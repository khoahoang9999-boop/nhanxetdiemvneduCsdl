import { migrateData } from "./shared.js";
import { auth, db, signOut, onAuthStateChanged, doc, onSnapshot, getDoc } from "./src/firebase-config.js";

document.addEventListener("DOMContentLoaded", () => {
  // Initialize sample data if it doesn't exist
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["commentsData"], (result) => {
      const { data, migrated } = migrateData(result.commentsData);
      if (migrated) {
        chrome.storage.local.set({ commentsData: data });
      }
    });
  }

  const optionsBtn = document.getElementById("optionsBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const runBtn = document.getElementById("runBtn");
  const fillCodeCheckbox = document.getElementById("fillCodeCheckbox");
  
  // Auth Elements
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const unauthButtons = document.getElementById("unauth-buttons");
  const unauthState = document.getElementById("unauth-state");
  const authState = document.getElementById("auth-state");
  const userDisplayName = document.getElementById("user-display-name");
  const userInfo = document.getElementById("user-info");
  const userCredits = document.getElementById("user-credits");
  const userPoints = document.getElementById("user-points");
  const userExpiryContainer = document.getElementById("user-expiry-container");
  const userExpiry = document.getElementById("user-expiry");
  const authStatusMessage = document.getElementById("auth-status-message");
  const logoutBtn = document.getElementById("logoutBtn");
  const topupBtn = document.getElementById("topupBtn");
  const adminBtn = document.getElementById("adminBtn");

  const openAuth = (tabParam = null) => {
    let url =
      typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL
        ? chrome.runtime.getURL("auth-ui.html")
        : "/auth-ui.html";
    if (typeof tabParam === "string" && typeof tabParam !== 'object') {
        url += `?tab=${tabParam}#${tabParam}`;
    }
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  if (loginBtn) loginBtn.addEventListener("click", () => openAuth());
  if (registerBtn) registerBtn.addEventListener("click", () => {
    // We can open auth UI, probably showing register if app supports hash/query routing
    openAuth("register");
  });
  if (topupBtn) topupBtn.addEventListener("click", () => openAuth("topup"));
  if (adminBtn) adminBtn.addEventListener("click", () => openAuth("admin"));

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Logout error", err);
      }
    });
  }

  // Firebase Auth Listener
  let unsubSnapshot = null;

  async function getDeviceId() {
    return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['deviceId'], (res) => {
                if (res.deviceId) {
                    resolve(res.deviceId);
                } else {
                    const newId = 'id' + Math.random().toString(36).substr(2, 10).toUpperCase();
                    chrome.storage.local.set({ deviceId: newId }, () => resolve(newId));
                }
            });
        } else {
            let id = localStorage.getItem('tlnx_device_id');
            if (!id) {
                id = 'web' + Math.random().toString(36).substr(2, 10).toUpperCase();
                localStorage.setItem('tlnx_device_id', id);
            }
            resolve(id);
        }
    });
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (unauthState) {
        unauthState.classList.add("hidden");
        unauthState.classList.remove("flex");
      }
      if (authState) {
        authState.classList.remove("hidden");
        authState.classList.add("flex");
      }
      
      const displayNameParam = user.displayName || user.email || "Người dùng";
      if (userDisplayName) {
        userDisplayName.innerText = displayNameParam;
      }

      if (adminBtn) {
          if (user.email === "hvdkhoa89@gmail.com" || (user.email && user.email.toLowerCase().includes("admin"))) {
              adminBtn.classList.remove("hidden");
              adminBtn.classList.add("flex");
          } else {
              adminBtn.classList.add("hidden");
              adminBtn.classList.remove("flex");
          }
      }

      if (unsubSnapshot) unsubSnapshot();
      unsubSnapshot = onSnapshot(doc(db, "users", user.uid), async (docSnap) => {
        let credits = 0;
        let points = 0;
        if (docSnap.exists()) {
          const data = docSnap.data();
          credits = data.credits || 0;
          points = data.points || 0;

          // KIỂM TRA GIỚI HẠN THIẾT BỊ
          const deviceId = await getDeviceId();
          const isAdmin = user.email === "hvdkhoa89@gmail.com" || (user.email && user.email.toLowerCase().includes("admin")) || user.email === 'hvdkhoa89@gmail.com';
          const currentDevices = data.deviceIds || [];

          if (!isAdmin && !currentDevices.includes(deviceId)) {
              if (currentDevices.length >= 2) {
                  authStatusMessage.textContent = "Tài khoản đã đạt giới hạn 2 thiết bị. Vui lòng liên hệ Admin!";
                  authStatusMessage.className = "text-center text-red-500 font-bold mb-2 p-2 bg-red-50 rounded text-[11px]";
                  userInfo.classList.add("hidden");
                  logoutBtn.classList.remove("hidden");
                  unauthButtons.classList.add("hidden");
                  runBtn.disabled = true;
                  runBtn.classList.add("opacity-50", "cursor-not-allowed");
                  return;
              } else {
                  // If under limit, we could auto-add here too for safety
                  import("./src/firebase-config.js").then(({ updateDoc, arrayUnion }) => {
                      updateDoc(doc(db, "users", user.uid), {
                          deviceIds: arrayUnion(deviceId)
                      });
                  });
              }
          } else {
              if (authStatusMessage) {
                  authStatusMessage.textContent = "";
                  authStatusMessage.className = "hidden";
              }
              if (userInfo) userInfo.classList.remove("hidden");
              if (runBtn) {
                  runBtn.disabled = false;
                  runBtn.classList.remove("opacity-50", "cursor-not-allowed");
              }
          }
        }
        
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          if (!window.__pendingListenerAddedPopup) {
              window.__pendingListenerAddedPopup = true;
              chrome.storage.onChanged.addListener((changes, area) => {
                  if (area === 'local' && changes.authState) {
                      const newVal = changes.authState.newValue;
                      if (newVal && newVal.pendingDeduction > 0) {
                          const pending = newVal.pendingDeduction;
                          chrome.storage.local.set({ authState: { ...newVal, pendingDeduction: 0 } });
                          import("./src/firebase-config.js").then(({ updateDoc }) => {
                              getDoc(doc(db, "users", user.uid)).then(docSnap => {
                                  if (docSnap.exists()) {
                                      updateDoc(doc(db, "users", user.uid), {
                                          points: Math.max(0, (docSnap.data().points || 0) - pending)
                                      });
                                  }
                              });
                          });
                      }
                  }
              });
          }
          chrome.storage.local.get(["authState"], (res) => {
              const pending = res.authState && res.authState.pendingDeduction ? res.authState.pendingDeduction : 0;
              if (pending > 0) {
                  // RESET PENDING IMMEDIATELY TO AVOID RACE CONDITION
                  const newAuthState = { ...res.authState, pendingDeduction: 0 };
                  chrome.storage.local.set({ authState: newAuthState });

                  // Deduct from POINTS then CREDITS (Logic: only points for now)
                  let currentPoints = points || 0;
                  let updateData = {};
                  
                  if (currentPoints >= pending) {
                      updateData.points = currentPoints - pending;
                  } else {
                      updateData.points = 0;
                  }

                  import("./src/firebase-config.js").then(({ updateDoc }) => {
                    updateDoc(doc(db, "users", user.uid), updateData);
                  });
                  // We already reset pendingDeduction above, but let's ensure authState is synced with latest data
                  const isAdmin = user.email === 'admin@admin.com' || (user.email && user.email.toLowerCase().includes("admin")) || user.email === 'hvdkhoa89@gmail.com';
                  chrome.storage.local.set({ 
                    authState: { 
                      ...newAuthState,
                      credits: credits, 
                      points: updateData.points,
                      isAdmin
                    } 
                  });
              } else {
                  const isAdmin = user.email === 'admin@admin.com' || (user.email && user.email.toLowerCase().includes("admin")) || user.email === 'hvdkhoa89@gmail.com';
                  chrome.storage.local.set({ 
                    authState: { 
                      uid: user.uid, 
                      email: user.email, 
                      credits: credits, 
                      points: points,
                      pendingDeduction: 0,
                      isAdmin
                    } 
                  });
              }
          });
        }

        if (userCredits) {
           const isAdmin = user.email === "hvdkhoa89@gmail.com" || (user.email && user.email.toLowerCase().includes("admin"));
           if (isAdmin) {
               userCredits.textContent = "VIP";
               userCredits.classList.add("text-red-600", "font-black");
           } else {
               userCredits.textContent = `${Math.max(0, credits)} Năm`;
               userCredits.classList.remove("text-red-600", "font-black");
           }
        }
        if (userPoints) {
           const isAdmin = user.email === "hvdkhoa89@gmail.com" || (user.email && user.email.toLowerCase().includes("admin"));
           if (isAdmin) {
               userPoints.style.display = "none";
           } else {
               userPoints.textContent = `${points} Lượt`;
               userPoints.style.display = "";
           }
        }
        
        if (userExpiryContainer && userExpiry) {
           if (credits > 0 && docSnap.data().expiryDate) {
               const date = docSnap.data().expiryDate.toDate();
               const dateStr = date.toLocaleDateString('vi-VN', { 
                   day: '2-digit', 
                   month: '2-digit', 
                   year: 'numeric'
               });
               userExpiry.textContent = dateStr;
               userExpiryContainer.classList.remove('hidden');
           } else {
               userExpiryContainer.classList.add('hidden');
           }
        }
      }, (error) => {
          console.error("Snapshot error:", error);
          if (userCredits) userCredits.textContent = "Lỗi";
          if (userPoints) userPoints.textContent = "Lỗi";
      });
    } else {
      if (unauthState) {
        unauthState.classList.remove("hidden");
        unauthState.classList.add("flex");
      }
      if (authState) {
        authState.classList.add("hidden");
        authState.classList.remove("flex");
      }
      chrome.storage.local.set({ authState: null });
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }
    }
  });

  if (fillCodeCheckbox && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["autoFillCode"], (result) => {
      if (result.autoFillCode !== undefined) {
        fillCodeCheckbox.checked = result.autoFillCode;
      }
    });

    fillCodeCheckbox.addEventListener("change", (e) => {
      chrome.storage.local.set({ autoFillCode: e.target.checked });
    });
  }

  const openOptions = (tabParam = null) => {
    let url =
      typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL
        ? chrome.runtime.getURL("options.html")
        : "/options.html";
    if (typeof tabParam === "string" && typeof tabParam !== 'object') url += `?tab=${tabParam}`;
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  if (optionsBtn) optionsBtn.addEventListener("click", openOptions);
  if (settingsBtn) settingsBtn.addEventListener("click", openOptions);

  const setStatus = (msg, type) => {
    const area = document.getElementById("statusArea");
    const text = document.getElementById("statusText");
    const dot = document.getElementById("statusDot");
    if (!area) return;
    
    area.classList.remove("hidden");
    text.innerText = msg;
    if (type === "error") {
      text.className = "text-[11px] font-bold text-red-500";
      dot.className = "w-2 h-2 rounded-full bg-red-500 animate-pulse";
    } else if (type === "success") {
      text.className = "text-[11px] font-bold text-green-600";
      dot.className = "w-2 h-2 rounded-full bg-green-500";
    } else {
      text.className = "text-[11px] font-medium text-slate-500";
      dot.className = "w-2 h-2 rounded-full bg-slate-300";
    }
  };

  if (runBtn) {
    runBtn.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (!user) {
        setStatus("Vui lòng đăng nhập để sử dụng tính năng này!", "error");
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const credits = data.credits || 0;
          const points = data.points || 0;
          if (credits <= 0 && points <= 0) {
            setStatus("Bạn đã hết lượt sử dụng và hạn VIP. Vui lòng gia hạn để tiếp tục!", "error");
            return;
          }
        } else {
           setStatus("Không tìm thấy thông tin tài khoản!", "error");
           return;
        }

        const method = "template";
        const autoFillCode = fillCodeCheckbox ? fillCodeCheckbox.checked : true;
        // Proceed to execute logic
        executeLogic({ method, autoFillCode });
      } catch (err) {
        setStatus("Lỗi kiểm tra điểm: " + err.message, "error");
      }
    });
  }

  function executeLogic(config) {
    setStatus("Đang quét trang và xử lý dữ liệu...", "default");
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && !tabs[0].url.startsWith("chrome://")) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            {
              action: "fillComments",
              config,
            },
            async (response) => {
              if (chrome.runtime.lastError) {
                setStatus("Lỗi kết nối. Hãy đảm bảo bạn đang ở đúng trang web tra điểm!", "error");
              } else if (response && response.success) {
                if (response.count > 0) {
                  // Deduct point if success
                  const user = auth.currentUser;
                  if (user) {
                      chrome.storage.local.get(['authState'], (res) => {
                          const state = res.authState || {};
                          const email = (state.email || "").toLowerCase();
                          const isAdmin = state.isAdmin === true || email === 'admin@admin.com' || email.includes('admin') || email === 'hvdkhoa89@gmail.com';
                          const p = state.points || 0;
                          const c = state.credits || 0;

                          if (!isAdmin && p > 0 && c <= 0) {
                              state.points -= 1;
                              state.pendingDeduction = (state.pendingDeduction || 0) + 1;
                              chrome.storage.local.set({ authState: state });
                          }
                      });
                  }

                  let msg = `Đã điền NX cho ${response.count} HS (môn: ${response.detectedMon || '?'}).`;
                  if (response.detectedMon && response.detectedMon.includes("GVCN")) {
                      msg += " (Nếu có HS chưa được điền, hãy cuộn chuột xuống tít dưới rồi chạy lại)";
                  }
                  setStatus(
                    msg,
                    "success"
                  );
                } else {
                  setStatus("Không tìm thấy ô nhập nhận xét phù hợp trên trang!", "error");
                }
              } else {
                const errDesc = response?.error || "Lỗi không xác định";
                setStatus(errDesc.replace("Error: ", ""), "error");
              }
            }
          );
        } else {
          setStatus("Không thể chạy tự động trên trang web này.", "error");
        }
      });
    } else {
      setStatus("Chỉ hoạt động khi chạy như Extension thật.", "error");
      
      // MOCK for Web Env
      setTimeout(async () => {
        setStatus("Chế độ Demo Web: Đã mô phỏng điền 40 dòng thành công!", "success");
      }, 1000);
    }
  }
});
