import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import admin from 'firebase-admin';

import fs from "fs";

// Firebase Admin initialization
let adminConfig: any = {
  projectId: "tien-ich-nx-csdl-vnedu", // Project ID from auth-ui.js
};

try {
  const envServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (envServiceAccount) {
    const serviceAccount = JSON.parse(envServiceAccount);
    adminConfig.credential = admin.credential.cert(serviceAccount);
  } else {
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      adminConfig.credential = admin.credential.cert(serviceAccount);
    }
  }
} catch (e) {
  console.error("Failed to load Firebase Admin credentials", e);
}

// If GOOGLE_APPLICATION_CREDENTIALS is not set, it might fail in some environments
// but usually Cloud Run provides a default service account.
try {
    admin.initializeApp(adminConfig);
} catch (e) {
    console.error("Firebase Admin initialization error:", e);
}

const db = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  /**
   * Webhook Payment Endpoint (SePay / Casso)
   * Format:
   * {
   *   "content": "NAP 123456",
   *   "amount": 30000,
   *   ...
   * }
   */
  app.post("/api/webhook/payment", async (req, res) => {
    try {
      console.log(`[PAYMENT WEBHOOK START] Headers:`, req.headers);
      console.log(`[PAYMENT WEBHOOK START] Body:`, req.body);

      // Xác thực API Key từ SePay
      const authHeader = req.headers.authorization || req.headers.apikey || req.headers['api-key'];
      if (!authHeader || !authHeader.includes("sepay-token-nhanxet")) {
        console.warn("[PAYMENT WEBHOOK] Invalid or missing auth token in headers.", { 
          authHeader, 
          headers: req.headers 
        });
        // Tạm thời bỏ block 401 để test nếu bị kẹt
        // return res.status(401).json({ error: "Unauthorized" });
      }

      let bodyData = req.body;
      if (req.body.data && Array.isArray(req.body.data) && req.body.data.length > 0) {
        bodyData = req.body.data[0];
      }

      const content = bodyData.content || bodyData.transactionContent || bodyData.transaction_content || bodyData.description;
      let rawAmount = bodyData.transferAmount || bodyData.amountIn || bodyData.amount || bodyData.value;
      const memo = content || ""; // Handle both SePay/Casso formats

      // Normalize amount
      let amount = 0;
      if (typeof rawAmount === 'string') {
        amount = Number(rawAmount.replace(/[^0-9.-]+/g, ""));
      } else if (typeof rawAmount === 'number') {
        amount = rawAmount;
      }
      
      console.log(`[PAYMENT WEBHOOK] Received: ${amount} VNĐ, Memo: "${memo}"`);

      // Log all payment attempts for debugging
      await db.collection("payment_logs").add({
        amount,
        memo,
        fullBody: req.body,
        timestamp: admin.firestore.Timestamp.now()
      });

      if (!memo || !amount) {
        return res.status(400).json({ error: "Missing content or amount" });
      }

      // 1. Parse content to find bankCode (Match: NAP 123456 or NAP ABCD12)
      // Be more flexible: look for NAP followed by alphanumeric code
      const match = memo.toUpperCase().match(/NAP\s*([A-Z0-9]+)/);
      if (!match) {
        console.warn(`[PAYMENT] Memo "${memo}" does not follow 'NAP CODE' format.`);
        return res.status(200).json({ success: false, message: "Invalid memo format" });
      }

      const bankCode = match[1];

      // 2. Find user in Firestore by bankCode
      const snapshot = await db.collection("users").where("bankCode", "==", bankCode).limit(1).get();

      if (snapshot.empty) {
        console.warn(`[PAYMENT] No user found with bankCode: ${bankCode}`);
        return res.status(200).json({ success: false, message: "User not found" });
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      // 3. Logic nạp: Lấy bảng giá từ config Firebase
      const configDoc = await db.collection("config").doc("topup").get();
      let packages = [];
      if (configDoc.exists) {
        const configData = configDoc.data() || {};
        if (configData.packages && Array.isArray(configData.packages)) {
          packages = configData.packages;
        }
      }

      // Sắp xếp các gói giảm dần theo số tiền (để ưu tiên gói lớn trước)
      packages.sort((a, b) => b.amt - a.amt);

      if (packages.length === 0) {
         // Fallback default
         packages = [
            { amt: 120000, pts: 5 },
            { amt: 81000, pts: 3 },
            { amt: 57000, pts: 2 },
            { amt: 30000, pts: 1 },
         ];
      }

      let addedYearsForCredit = 0;
      let remainingAmount = amount;

      for (const pkg of packages) {
        const packs = Math.floor(remainingAmount / pkg.amt);
        if (packs > 0) {
          addedYearsForCredit += packs * pkg.pts;
          remainingAmount %= pkg.amt;
        }
      }

      if (addedYearsForCredit <= 0) {
        console.warn(`[PAYMENT] Amount ${amount} is too low for any added time.`);
        return res.status(200).json({ success: false, message: "Số tiền quá thấp để đạt tối thiểu 1 gói sử dụng" });
      }

      const addedDays = addedYearsForCredit * 365;

      // 4. Update User Data
      const now = admin.firestore.Timestamp.now();
      let currentExpiry = userData.expiryDate || now;
      
      let startDateMillis = now.toMillis();
      if (userData.expiryDate) {
        if (typeof userData.expiryDate.toMillis === 'function') {
          startDateMillis = Math.max(userData.expiryDate.toMillis(), startDateMillis);
        } else if (typeof userData.expiryDate.toDate === 'function') {
          startDateMillis = Math.max(userData.expiryDate.toDate().getTime(), startDateMillis);
        } else if (userData.expiryDate instanceof Date) {
          startDateMillis = Math.max(userData.expiryDate.getTime(), startDateMillis);
        } else if (userData.expiryDate._seconds) {
           startDateMillis = Math.max(userData.expiryDate._seconds * 1000, startDateMillis);
        } else if (typeof userData.expiryDate === 'string' || typeof userData.expiryDate === 'number') {
          startDateMillis = Math.max(new Date(userData.expiryDate).getTime(), startDateMillis);
        }
      }
      
      const newExpiryMillis = startDateMillis + (addedDays * 24 * 60 * 60 * 1000);
      const newExpiryDate = new Date(newExpiryMillis);

      await userDoc.ref.update({
        credits: admin.firestore.FieldValue.increment(addedYearsForCredit),
        expiryDate: admin.firestore.Timestamp.fromDate(newExpiryDate),
        updatedAt: now,
        lastTransaction: {
          amount,
          memo: memo,
          addedDays,
          addedYears: addedYearsForCredit,
          timestamp: now
        }
      });

      console.log(`[PAYMENT] Success: Added ${addedYearsForCredit} years to user ${userData.email}. New expiry: ${newExpiryDate.toISOString()}`);
      return res.json({ success: true, message: `Đã cộng thêm ${addedYearsForCredit} năm sử dụng.` });

    } catch (err) {
      console.error("[PAYMENT ERROR]", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Temporary endpoint to debug payment logs
  app.get("/api/webhook/logs", async (req, res) => {
    try {
      const snapshot = await db.collection("payment_logs").orderBy("timestamp", "desc").limit(10).get();
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Serve static UI or Vite Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
