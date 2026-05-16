// Prevent "Cannot set property fetch of #<Window> which has only a getter" from third-party libraries
let origFetch = window.fetch;
Object.defineProperty(window, "fetch", {
  get: () => origFetch,
  set: () => {},
  configurable: true,
});

import {
  GRADE_LEVELS,
  getSubjects,
  getDGTXSubjects,
  getEvalLevels,
  getEmptySubject,
  getEmptyDGTX,
  getEmptyThNlPc,
  getEmptyHocBaGVBM,
  getEmptyHocBaGVCN,
  getEmptyHieuTruong,
  getEmptyVneduNlpcHb,
  generateAllSampleData,
  migrateData
} from "./shared.js";
import * as XLSX from "xlsx";
import { auth, db, signOut, onAuthStateChanged, doc, onSnapshot } from "./src/firebase-config.js";

let currentData = { TH: {}, THCS: {}, THPT: {} };
let currentRole = "GVBM";
let currentCapHoc = "THCS";
let currentKhoiLop = "6";
let currentMonHoc = "Ngữ văn";
let currentHocKy = "Học kỳ 1";
let currentTieuChi = "Môn học và hoạt động giáo dục";
let currentThang = "8";

document.addEventListener("DOMContentLoaded", () => {
  // -------- AUTHENTICATION SETUP --------
  const loginBtn = document.getElementById("loginBtn");
  const userInfo = document.getElementById("user-info");
  const userCreditsDisplay = document.getElementById("user-credits");
  const userPointsDisplay = document.getElementById("user-points");
  const userEmailDisplay = document.getElementById("user-email-display");
  const logoutBtn = document.getElementById("logoutBtn");
  const topupBtn = document.getElementById("topupBtn");
  const adminBtn = document.getElementById("adminBtn");

  const openAuth = (tabParam = null) => {
    let url =
      typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL
        ? chrome.runtime.getURL("auth-ui.html")
        : "/auth-ui.html";
    if (typeof tabParam === "string" && typeof tabParam !== 'object') url += `?tab=${tabParam}`;
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  if (loginBtn) loginBtn.addEventListener("click", () => openAuth());
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

  let unsubSnapshot = null;
  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (loginBtn) loginBtn.classList.add("hidden");
      if (userInfo) {
        userInfo.classList.remove("hidden");
        userInfo.classList.add("flex");
      }
      if (userEmailDisplay) userEmailDisplay.innerText = user.email || "";

      if (adminBtn) {
          if (user.email === "hvdkhoa89@gmail.com" || (user.email && user.email.includes("admin"))) {
              adminBtn.classList.remove("hidden");
          } else {
              adminBtn.classList.add("hidden");
          }
      }

      if (unsubSnapshot) unsubSnapshot();
      unsubSnapshot = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        let credits = 0;
        let points = 0;
        if (docSnap.exists()) {
          const data = docSnap.data();
          credits = data.credits || 0;
          points = data.points || 0;
        }

        chrome.storage.local.get(["authState"], (res) => {
           let pending = res.authState && res.authState.pendingDeduction ? res.authState.pendingDeduction : 0;
           if (pending > 0) {
               // Reset pending immediately to avoid race condition with multiple windows
               const newAuthState = { ...res.authState, pendingDeduction: 0 };
               chrome.storage.local.set({ authState: newAuthState });

               // Deduct the pending points from Firebase points field (Cap at 0)
               import("./src/firebase-config.js").then(({ updateDoc }) => {
                 updateDoc(doc(db, "users", user.uid), {
                   points: Math.max(0, points - pending)
                 });
               });
               
               // Update local state with latest data
               const isAdmin = user.email === 'admin@admin.com' || (user.email && user.email.toLowerCase().includes("admin")) || user.email === 'hvdkhoa89@gmail.com';
               chrome.storage.local.set({ 
                 authState: { 
                   ...newAuthState, 
                   credits: credits, 
                   points: Math.max(0, points - pending),
                   isAdmin
                 } 
               });
           } else {
               const isAdmin = user.email === 'admin@admin.com' || (user.email && user.email.toLowerCase().includes("admin")) || user.email === 'hvdkhoa89@gmail.com';
               chrome.storage.local.set({ authState: { uid: user.uid, email: user.email, credits: Math.max(0, credits), points: points, pendingDeduction: 0, isAdmin } });
           }
        });

        const isAdmin = user.email === 'admin@admin.com' || (user.email && user.email.toLowerCase().includes("admin")) || user.email === 'hvdkhoa89@gmail.com';

        if (userCreditsDisplay) {
           if (isAdmin) {
             userCreditsDisplay.innerText = `VIP`;
             userCreditsDisplay.classList.remove("text-indigo-700", "bg-indigo-50", "border-indigo-100");
             userCreditsDisplay.classList.add("text-red-700", "bg-red-50", "border-red-100");
           } else {
             userCreditsDisplay.innerText = `${Math.max(0, credits)} NĂM`;
             userCreditsDisplay.classList.add("text-indigo-700", "bg-indigo-50", "border-indigo-100");
             userCreditsDisplay.classList.remove("text-red-700", "bg-red-50", "border-red-100");
           }
        }
        if (userPointsDisplay) {
           if (isAdmin) {
             userPointsDisplay.style.display = "none";
           } else {
             userPointsDisplay.style.display = "";
             userPointsDisplay.innerText = `${Math.max(0, points)} LƯỢT`;
           }
        }
      });
    } else {
      if (loginBtn) loginBtn.classList.remove("hidden");
      if (userInfo) {
        userInfo.classList.add("hidden");
        userInfo.classList.remove("flex");
      }
      chrome.storage.local.set({ authState: null });
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }
    }
  });
  // ------------------------------------
  // --- Modals ---
  const customModalOverlay = document.getElementById("custom-modal-overlay");
  const customModal = document.getElementById("custom-modal");
  const customModalTitle = document.getElementById("custom-modal-title");
  const customModalMessage = document.getElementById("custom-modal-message");
  const customModalCancel = document.getElementById("custom-modal-cancel");
  const customModalConfirm = document.getElementById("custom-modal-confirm");

  function showCustomModal(title, message, isAlert = false, onConfirm = null) {
    customModalTitle.innerText = title;
    customModalMessage.innerText = message;
    
    if (isAlert) {
      customModalCancel.style.display = "none";
      customModalConfirm.innerText = "Đóng";
      customModalConfirm.classList.replace("bg-blue-600", "bg-slate-600");
      customModalConfirm.classList.replace("hover:bg-blue-700", "hover:bg-slate-700");
    } else {
      customModalCancel.style.display = "block";
      customModalConfirm.innerText = "Đồng ý";
      customModalConfirm.classList.replace("bg-slate-600", "bg-blue-600");
      customModalConfirm.classList.replace("hover:bg-slate-700", "hover:bg-blue-700");
    }

    customModalOverlay.classList.remove("hidden");
    customModalOverlay.classList.add("flex");
    setTimeout(() => {
      customModal.classList.remove("scale-95", "opacity-0");
      customModal.classList.add("scale-100", "opacity-100");
    }, 10);

    const closeMenu = () => {
      customModal.classList.add("scale-95", "opacity-0");
      customModal.classList.remove("scale-100", "opacity-100");
      setTimeout(() => {
        customModalOverlay.classList.add("hidden");
        customModalOverlay.classList.remove("flex");
      }, 200);
      customModalConfirm.removeEventListener("click", onConfirmClick);
      customModalCancel.removeEventListener("click", onCancelClick);
    };

    const onConfirmClick = () => {
      closeMenu();
      if (onConfirm) onConfirm(true);
    };

    const onCancelClick = () => {
      closeMenu();
      if (onConfirm) onConfirm(false);
    };

    customModalConfirm.addEventListener("click", onConfirmClick);
    if (!isAlert) customModalCancel.addEventListener("click", onCancelClick);
  }

  const filterCapHoc = document.getElementById("filterCapHoc");
  const filterKhoiLop = document.getElementById("filterKhoiLop");
  const filterMonHoc = document.getElementById("filterMonHoc");
  const filterMonHocContainer = document.getElementById("filterMonHocContainer");
  const filterHocKy = document.getElementById("filterHocKy");
  const filterHocKyContainer = document.getElementById("filterHocKyContainer");
  const filterTieuChi = document.getElementById("filterTieuChi");
  const filterTieuChiContainer = document.getElementById("filterTieuChiContainer");
  const filterThang = document.getElementById("filterThang");
  const filterThangContainer = document.getElementById("filterThangContainer");
    
  const platformRadios = document.getElementsByName("configPlatform");
  const csdlNavSections = document.getElementById("csdl-nav-sections");
  const mainContentCsdl = document.getElementById("main-content-csdl");
  const mainContentVnedu = document.getElementById("main-content-vnedu");

  function updatePlatformUI() {
    let selectedPlatform = "csdl";
    for (const radio of platformRadios) {
      if (radio.checked) {
        selectedPlatform = radio.value;
        break;
      }
    }
    
    if (selectedPlatform === "csdl") {
      csdlNavSections.style.display = "block";
      mainContentCsdl.style.display = "flex";
      if (mainContentVnedu) {
        mainContentVnedu.classList.add("hidden");
        mainContentVnedu.classList.remove("flex");
      }
    } else {
      // Use the exact same UI for VnEdu (shared configuration)
      csdlNavSections.style.display = "block";
      mainContentCsdl.style.display = "flex";
      if (mainContentVnedu) {
        mainContentVnedu.classList.add("hidden");
        mainContentVnedu.classList.remove("flex");
      }
    }
    
    // Update header Title
    const headerTitle = document.getElementById("main-header-title");
    if (headerTitle) {
      headerTitle.innerText = selectedPlatform === "vnedu" ? "Quản lý Lời phê Mẫu (VnEdu)" : "Quản lý Lời phê Mẫu (CSDL Ngành)";
    }
  }

  for (const radio of platformRadios) {
    radio.addEventListener("change", () => {
      updatePlatformUI();
      updateTabsUI();
      updateDropdowns();
      renderData();
    });
  }
  updatePlatformUI();

  const navTemplates = document.getElementById("navTemplates");
  const viewTemplates = document.getElementById("viewTemplates");
  const saveConfigBtn = document.getElementById("saveConfigBtn");
  const resetConfigBtn = document.getElementById("resetConfigBtn");

  const urlParams = new URLSearchParams(window.location.search);

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["commentsData"], (result) => {
      // Migrate and overwrite if necessary
      let { data, migrated } = migrateData(result.commentsData);
      currentData = data;
      
      if (currentData?.TH?.['3']?.GVBM?.['Toán_Giữa kỳ 1']) {
        currentData = generateAllSampleData();
        migrated = true;
      }

      // Force upgrade DGTX (CSDL Ngành 5.3.4) for TH to use BGDĐT TT27 compliant text
      if (currentData?.TH && currentData.TH['3'] && !currentData.TH['3'].DGTX_V2) {
         const freshData = generateAllSampleData();
         for (const khoi of Object.keys(currentData.TH)) {
             if (currentData.TH[khoi]) {
                 currentData.TH[khoi].DGTX = freshData.TH[khoi].DGTX;
                 currentData.TH[khoi].DGTX_V2 = true;
             }
         }
         migrated = true;
      }

      // Force upgrade Công nghệ for TH (VnEdu and CSDL GVBM) to have strictly 20, 20, 5 custom comments
      if (currentData?.TH && currentData.TH['3'] && !currentData.TH['3'].GVBM_CN_V2) {
         const freshData = generateAllSampleData();
         for (const khoi of Object.keys(currentData.TH)) {
             if (currentData.TH[khoi] && currentData.TH[khoi].GVBM && currentData.TH[khoi].GVBM['Công nghệ']) {
                 currentData.TH[khoi].GVBM['Công nghệ'] = freshData.TH[khoi].GVBM['Công nghệ'];
                 currentData.TH[khoi].GVBM_CN_V2 = true;
             }
         }
         migrated = true;
      }

      // Force upgrade THCS Pass/Fail subjects (Giáo dục thể chất, Nghệ thuật, Nội dung giáo dục địa phương)
      if (currentData?.THCS && currentData.THCS['6'] && !currentData.THCS['6'].GVBM_THCS_3SUBS_V1) {
         const freshData = generateAllSampleData();
         for (const khoi of Object.keys(currentData.THCS)) {
             if (currentData.THCS[khoi] && currentData.THCS[khoi].GVBM) {
                 ["Giáo dục thể chất", "Nghệ thuật", "Âm nhạc", "Mĩ thuật", "Nội dung giáo dục địa phương"].forEach(subj => {
                     if (freshData.THCS[khoi].GVBM[subj]) {
                         currentData.THCS[khoi].GVBM[subj] = freshData.THCS[khoi].GVBM[subj];
                     }
                 });
                 currentData.THCS[khoi].GVBM_THCS_3SUBS_V1 = true;
             }
         }
         migrated = true;
      }
      
      // Force upgrade Công nghệ cho THCS và THPT
      if (currentData?.THCS && currentData.THCS['6'] && !currentData.THCS['6'].GVBM_CN_THCS_V1) {
         const freshData = generateAllSampleData();
         ['THCS', 'THPT'].forEach(cap => {
             if (currentData[cap]) {
                 for (const khoi of Object.keys(currentData[cap])) {
                     if (currentData[cap][khoi] && currentData[cap][khoi].GVBM && currentData[cap][khoi].GVBM['Công nghệ']) {
                         currentData[cap][khoi].GVBM['Công nghệ'] = freshData[cap][khoi].GVBM['Công nghệ'];
                         currentData[cap][khoi].GVBM_CN_THCS_V1 = true;
                     }
                 }
             }
         });
         migrated = true;
      }

      // Force upgrade HDTN & THPT Pass/Fail
      if (currentData?.THCS && currentData.THCS['6'] && !currentData.THCS['6'].GVBM_HDTN_V1) {
         const freshData = generateAllSampleData();
         ['THCS', 'THPT'].forEach(cap => {
             if (currentData[cap]) {
                 for (const khoi of Object.keys(currentData[cap])) {
                     if (currentData[cap][khoi] && currentData[cap][khoi].GVBM) {
                         ["Giáo dục thể chất", "Nghệ thuật", "Âm nhạc", "Mĩ thuật", "Nội dung giáo dục địa phương", "Hoạt động trải nghiệm", "Hoạt động trải nghiệm, hướng nghiệp"].forEach(subj => {
                             if (freshData[cap][khoi].GVBM[subj]) {
                                 currentData[cap][khoi].GVBM[subj] = freshData[cap][khoi].GVBM[subj];
                             }
                         });
                         currentData[cap][khoi].GVBM_HDTN_V1 = true;
                     }
                 }
             }
         });
         migrated = true;
      }

      // Data Cleanup: Remove obsolete and overly specific phrasing ("Kết nối tri thức", "Hòa nhập", "lớp X")
      const cleanString = (str) => {
        if (typeof str !== 'string') return str;
        let orig = str;
        str = str.replace(/lớp \d(,?)\s?/g, "");
        str = str.replace(/bám sát chương trình Kết nối tri thức\./g, "hoàn thành tốt các nội dung học tập.");
        str = str.replace(/Kết nối tri thức/gi, "");
        str = str.replace(/Hòa nhập rất nhanh với nhịp độ năm học mới/gi, "Tiếp thu bài nhanh");
        str = str.replace(/[ \t\r]+/g, ' ').trim();
        if (orig !== str) migrated = true;
        return str;
      };

      const traverseAndClean = (obj) => {
        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            if (typeof obj[i] === 'string') {
              obj[i] = cleanString(obj[i]);
            } else if (typeof obj[i] === 'object' && obj[i] !== null) {
              traverseAndClean(obj[i]);
            }
          }
        } else if (typeof obj === 'object' && obj !== null) {
          for (let key in obj) {
            if (typeof obj[key] === 'string') {
              obj[key] = cleanString(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              traverseAndClean(obj[key]);
            }
          }
        }
      };

      traverseAndClean(currentData);
      
      if (migrated || !result.commentsData) {
        chrome.storage.local.set({ commentsData: currentData });
      }
      
      updateTabsUI();
      updateDropdowns();
      renderData();
    });
  } else {
    currentData = generateAllSampleData();
    updateTabsUI();
    updateDropdowns();
    renderData();
  }

  function updateDropdowns(source = null) {
    // Update container visibility systematically
    filterMonHocContainer.style.display =
      (currentRole === "GVBM" || currentRole === "DGTX" || currentRole === "TH_NLPC") ? "block" : "none";

    const isTHCSorTHPT = currentCapHoc === "THCS" || currentCapHoc === "THPT";
    filterHocKyContainer.style.display =
      (currentRole === "GVBM" && isTHCSorTHPT) ? "block" : "none";

    if (!source || source === "cap") {
      const khois = GRADE_LEVELS[currentCapHoc] || [];
      filterKhoiLop.innerHTML = khois
        .map((k) => `<option value="${k}">Khối ${k}</option>`)
        .join("");
      currentKhoiLop = khois[0] || "";
    }

    if (!source || source === "cap" || source === "khoi" || source === "role") {
      if (currentRole === "GVBM" || currentRole === "DGTX" || currentRole === "TH_NLPC") {
        let subjects = [];
        if (currentRole === "DGTX" && currentCapHoc !== "TH") {
          subjects = ["Môn học", "Năng lực chung", "Phẩm chất chủ yếu"];
        } else if (currentRole === "TH_NLPC") {
          subjects = ["Năng lực", "Phẩm chất"];
        } else {
          subjects = getSubjects(currentCapHoc, currentKhoiLop);
        }
        filterMonHoc.innerHTML = subjects
          .map((s) => `<option value="${s}">${s}</option>`)
          .join("");
        currentMonHoc = subjects[0] || "";
      }
    }

    if (currentCapHoc === "TH" && currentRole === "DGTX") {
      filterTieuChiContainer.style.display = "block";
      const tieuChiList = [
        "Môn học và hoạt động giáo dục",
        "Nhận xét năng lực chung",
        "Nhận xét năng lực đặc thù",
        "Nhận xét phẩm chất chủ yếu"
      ];
      filterTieuChi.innerHTML = tieuChiList.map((t) => `<option value="${t}">${t}</option>`).join("");
      if (!tieuChiList.includes(currentTieuChi)) {
        currentTieuChi = tieuChiList[0];
      }
    } else {
      filterTieuChiContainer.style.display = "none";
    }

    if (currentRole === "DGTX") {
      filterThangContainer.style.display = "block";
    } else {
      filterThangContainer.style.display = "none";
    }

    let isVnedu = false;
    for (const radio of platformRadios) {
      if (radio.checked) {
        isVnedu = radio.value === "vnedu";
        break;
      }
    }
    
    
    // Safety
    

    filterCapHoc.value = currentCapHoc;
    if (filterKhoiLop.querySelector(`option[value="${currentKhoiLop}"]`)) {
      filterKhoiLop.value = currentKhoiLop;
    }
    if (filterMonHoc.querySelector(`option[value="${currentMonHoc}"]`)) {
      filterMonHoc.value = currentMonHoc;
    }
    if (filterHocKyContainer.style.display !== "none" && filterHocKy.querySelector(`option[value="${currentHocKy}"]`)) {
      filterHocKy.value = currentHocKy;
    }
    if (filterTieuChiContainer.style.display !== "none" && filterTieuChi.querySelector(`option[value="${currentTieuChi}"]`)) {
      filterTieuChi.value = currentTieuChi;
    }
    if (filterThangContainer.style.display !== "none" && filterThang.querySelector(`option[value="${currentThang}"]`)) {
      filterThang.value = currentThang;
    }
      }

  function updateTabsUI() {
    const tabGvbm = document.getElementById("tab-gvbm");
    const tabThNlpc = document.getElementById("tab-th-nlpc");
    const tabDgtx = document.getElementById("tab-dgtx");
    const tabHbGvbm = document.getElementById("tab-hb-gvbm");
    const tabHbGvcn = document.getElementById("tab-hb-gvcn");
    const tabHieuTruong = document.getElementById("tab-hieu-truong");
    const tabVneduNlpcHb = document.getElementById("tab-vnedu-nlpc-hb");

    let isVnedu = false;
    for (const radio of platformRadios) {
      if (radio.checked) {
        isVnedu = radio.value === "vnedu";
        break;
      }
    }

    if (currentCapHoc === "TH" && !isVnedu) {
      tabGvbm.innerHTML = "ĐGĐK Môn học (5.3.1)";
      tabThNlpc.style.display = "flex";
      tabDgtx.style.display = "flex";
      tabDgtx.innerHTML = "Đánh giá thường xuyên (5.3.4)";
      tabHbGvcn.innerHTML = "Nhận xét Học bạ (5.3.3)";
      tabHbGvbm.style.display = "none";
      tabHieuTruong.style.display = "none";
      tabVneduNlpcHb.style.display = "none";
      
      if (currentRole === "HOC_BA_GVBM" || currentRole === "HIEU_TRUONG" || currentRole === "VNEDU_NLPC_HB") {
         // Auto switch away from hidden tabs
         currentRole = "GVBM";
         tabs.forEach(t => {
            t.classList.remove("bg-red-600", "text-white", "shadow-sm");
            t.classList.add("text-slate-400", "hover:text-white", "hover:bg-slate-800");
         });
         tabGvbm.classList.remove("text-slate-400", "bg-transparent", "hover:text-white", "hover:bg-slate-800");
         tabGvbm.classList.add("bg-red-600", "text-white", "shadow-sm");
      }
    } else {
      if (isVnedu) {
         tabGvbm.innerHTML = "Sổ điểm nhận xét";
      } else {
         tabGvbm.innerHTML = "Nhận xét môn học (HK)";
      }
      tabThNlpc.style.display = "none";
      tabDgtx.style.display = "none";
      tabHbGvcn.innerHTML = "Học bạ (GVCN)";
      tabHbGvbm.innerHTML = "Học bạ (GVBM)";
      
      if (isVnedu && currentCapHoc === "TH") {
         tabVneduNlpcHb.style.display = "flex";
      } else {
         tabVneduNlpcHb.style.display = "none";
      }

      if (isVnedu) {
         tabHbGvbm.style.display = "none";
         if (currentRole === "HOC_BA_GVBM" || (currentRole === "VNEDU_NLPC_HB" && currentCapHoc !== "TH")) {
            currentRole = "GVBM";
            tabs.forEach(t => {
               t.classList.remove("bg-red-600", "text-white", "shadow-sm");
               t.classList.add("text-slate-400", "hover:text-white", "hover:bg-slate-800");
            });
            tabGvbm.classList.remove("text-slate-400", "bg-transparent", "hover:text-white", "hover:bg-slate-800");
            tabGvbm.classList.add("bg-red-600", "text-white", "shadow-sm");
         }
      } else {
         tabHbGvbm.style.display = "flex";
         if (currentRole === "VNEDU_NLPC_HB") {
            currentRole = "GVBM";
            tabs.forEach(t => {
               t.classList.remove("bg-red-600", "text-white", "shadow-sm");
               t.classList.add("text-slate-400", "hover:text-white", "hover:bg-slate-800");
            });
            tabGvbm.classList.remove("text-slate-400", "bg-transparent", "hover:text-white", "hover:bg-slate-800");
            tabGvbm.classList.add("bg-red-600", "text-white", "shadow-sm");
         }
      }
      tabHieuTruong.innerHTML = "Phê duyệt Hiệu trưởng";
      tabHieuTruong.style.display = "flex";
      
      if (currentRole === "TH_NLPC" || currentRole === "DGTX") {
         currentRole = "GVBM";
         tabs.forEach(t => {
            t.classList.remove("bg-red-600", "text-white", "shadow-sm");
            t.classList.add("text-slate-400", "hover:text-white", "hover:bg-slate-800");
         });
         tabGvbm.classList.remove("text-slate-400", "bg-transparent", "hover:text-white", "hover:bg-slate-800");
         tabGvbm.classList.add("bg-red-600", "text-white", "shadow-sm");
      }
    }
  }

  filterCapHoc.addEventListener("change", (e) => {
    currentCapHoc = e.target.value;
    updateTabsUI();
    updateDropdowns("cap");
    renderData();
  });

  filterKhoiLop.addEventListener("change", (e) => {
    currentKhoiLop = e.target.value;
    updateDropdowns("khoi");
    renderData();
  });

  filterHocKy.addEventListener("change", (e) => {
    currentHocKy = e.target.value;
    renderData();
  });

  filterMonHoc.addEventListener("change", (e) => {
    currentMonHoc = e.target.value;
    renderData();
  });

  filterTieuChi.addEventListener("change", (e) => {
    currentTieuChi = e.target.value;
    renderData();
  });

  filterThang.addEventListener("change", (e) => {
    currentThang = e.target.value;
    renderData();
  });

  
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      tabs.forEach((t) => {
        t.className = "tab-btn w-full text-left flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-slate-300 border border-transparent hover:text-white hover:bg-white/5 transition-colors cursor-pointer";
      });
      e.currentTarget.className = "tab-btn w-full text-left flex items-center gap-3 px-4 py-2 bg-green-500/20 text-white border border-green-500/30 backdrop-blur-md shadow-sm rounded-md text-sm font-semibold transition-colors cursor-pointer";

      currentRole = e.currentTarget.dataset.role;
      const roleAlert = document.getElementById("roleAlert");

      const messageEl = roleAlert.querySelector("ul.list-disc");
      if (currentRole === "HOC_BA_GVCN") {
        roleAlert.style.display = "flex";
        roleAlert.querySelector("p.font-bold").innerText =
          "Học bạ (Giáo viên chủ nhiệm):";
        if (messageEl) {
          messageEl.innerHTML =
            `<li>Nhận xét này áp dụng cho trang "7.4.2. Nhập nhận xét GVCN" và các trang Nhận xét Học bạ cuối năm.</li><li>Công cụ sẽ tự động điền các lời phê mẫu vào ô nhận xét của GVCN.</li>`;
        }
      } else if (currentRole === "HOC_BA_GVBM") {
        roleAlert.style.display = "flex";
        roleAlert.querySelector("p.font-bold").innerText =
          "Học bạ (Giáo viên bộ môn):";
        if (messageEl) {
          messageEl.innerHTML =
            `<li>Mục này áp dụng cho phần nhập Học bạ đối với Giáo viên Bộ môn (khi nhập điểm hoặc ở trang Nhận xét Học bạ).</li>`;
        }
      } else if (currentRole === "HIEU_TRUONG") {
        roleAlert.style.display = "flex";
        roleAlert.querySelector("p.font-bold").innerText =
          "Phê duyệt Hiệu trưởng:";
        if (messageEl) {
          messageEl.innerHTML =
            `<li>Mục này dành riêng cho việc điền ở trang "Nhập phê duyệt Hiệu trưởng". Hệ thống sẽ tự động ghép mẫu này vào vùng nhập Phê duyệt của Hiệu trưởng.</li>`;
        }
      } else if (currentRole === "TH_NLPC") {
        roleAlert.style.display = "flex";
        roleAlert.querySelector("p.font-bold").innerText =
          "Đánh giá định kỳ NL & PC (Tiểu học):";
        if (messageEl) {
          messageEl.innerHTML =
            `<li>Mục này dành cho việc nhập Nhận xét định kỳ Năng lực và Phẩm chất cho HĐGD Tiểu học.</li>`;
        }
      } else if (currentRole === "DGTX") {
        roleAlert.style.display = "flex";
        roleAlert.querySelector("p.font-bold").innerText =
          "Đánh giá thường xuyên:";
        if (messageEl) {
          messageEl.innerHTML =
            `<li>Sử dụng ở trang Nhập đánh giá thường xuyên. Hệ thống sẽ chọn ngẫu nhiên một nhận xét thuộc Mức chung cho môn học của bạn. Vì không có điểm kiểm tra, các tùy chọn đều được gộp chung.</li>`;
        }
      } else {
        roleAlert.style.display = "none";
      }

      updateDropdowns("role");
      renderData();
    });
  });

  saveConfigBtn.addEventListener("click", () => {
    ensureDataStructure();

    if (currentRole === "HIEU_TRUONG") {
      const allGrades = [
        {cap: "TH", khoi: "1"}, {cap: "TH", khoi: "2"}, {cap: "TH", khoi: "3"}, {cap: "TH", khoi: "4"}, {cap: "TH", khoi: "5"},
        {cap: "THCS", khoi: "6"}, {cap: "THCS", khoi: "7"}, {cap: "THCS", khoi: "8"}, {cap: "THCS", khoi: "9"},
        {cap: "THPT", khoi: "10"}, {cap: "THPT", khoi: "11"}, {cap: "THPT", khoi: "12"}
      ];

      allGrades.forEach(grade => {
        const textarea = document.getElementById(`hieu_truong_${grade.cap}_${grade.khoi}`);
        if (textarea) {
          const comments = textarea.value.split('\n').map(c => c.trim()).filter(c => c.length > 0);
          if (!currentData[grade.cap][grade.khoi].HIEU_TRUONG) {
             currentData[grade.cap][grade.khoi].HIEU_TRUONG = {};
          }
          currentData[grade.cap][grade.khoi].HIEU_TRUONG["Nhận xét chung"] = {
            min: 0,
            max: 10,
            code: "",
            mucDG: "",
            comments: comments
          };
        }
      });

      saveToStorage();
      showCustomModal("Thành công", "Đã lưu cấu hình Phê duyệt Hiệu trưởng thành công!", true);
      return;
    }

    if (currentRole === "VNEDU_NLPC_HB") {
      const groups = [
        "Năng lực chung", "Năng lực đặc thù", "Phẩm chất"
      ];
      const itemsMap = {
        "Năng lực chung": ["Nhận xét chung", "Tự chủ và tự học", "Giao tiếp và hợp tác", "GQVĐ và sáng tạo"],
        "Năng lực đặc thù": ["Nhận xét năng lực đặc thù", "Ngôn ngữ", "Tính toán", "Khoa học", "Thẩm mĩ", "Thể chất"],
        "Phẩm chất": ["Nhận xét chung", "Yêu nước", "Nhân ái", "Chăm chỉ", "Trung thực", "Trách nhiệm"]
      };

      if (["3", "4", "5"].includes(currentKhoiLop)) {
          itemsMap["Năng lực đặc thù"].splice(4, 0, "Công nghệ", "Tin học");
      }

      if (!currentData[currentCapHoc][currentKhoiLop].VNEDU_NLPC_HB) {
        currentData[currentCapHoc][currentKhoiLop].VNEDU_NLPC_HB = getEmptyVneduNlpcHb(currentKhoiLop);
      }

      groups.forEach(group => {
        itemsMap[group].forEach(item => {
          const className = `.comment-input-vnedu_${group.replace(/ /g, '_')}_${item.replace(/ /g, '_')}`;
          const inputs = Array.from(document.querySelectorAll(className));
          
          if (inputs.length > 0) {
            const comments = inputs.map(i => i.value.trim()).filter(c => c.length > 0);
            if (!currentData[currentCapHoc][currentKhoiLop].VNEDU_NLPC_HB[group]) {
              currentData[currentCapHoc][currentKhoiLop].VNEDU_NLPC_HB[group] = {};
            }
            if (!currentData[currentCapHoc][currentKhoiLop].VNEDU_NLPC_HB[group][item]) {
              currentData[currentCapHoc][currentKhoiLop].VNEDU_NLPC_HB[group][item] = {comments: []};
            }
            currentData[currentCapHoc][currentKhoiLop].VNEDU_NLPC_HB[group][item].comments = comments;
          }
        });
      });

      saveToStorage();
      showCustomModal("Thành công", "Đã lưu cấu hình Phẩm chất - Năng lực thành công!", true);
      return;
    }

    const isNlPcMode = currentRole === "TH_NLPC";
    const isDgtxMode = currentRole === "DGTX";
    const platformRadios = document.getElementsByName("configPlatform");
    let isVnedu = false;
    for (const radio of platformRadios) {
      if (radio.checked) {
        isVnedu = radio.value === "vnedu";
        break;
      }
    }
    const levels = getEvalLevels(currentCapHoc, isNlPcMode, isDgtxMode, isVnedu, currentMonHoc);

    levels.forEach((level) => {
      const minInput = document.getElementById(`min_${level}`);
      const maxInput = document.getElementById(`max_${level}`);
      const codeInput = document.getElementById(`code_${level}`);
      const mucDGInput = document.getElementById(`mucDG_${level}`);
      if (minInput && maxInput && codeInput) {
        const min = parseFloat(minInput.value);
        const max = parseFloat(maxInput.value);
        const code = codeInput.value.trim();
        const mucDG = mucDGInput ? mucDGInput.value.trim() : "";
        
        const commentInputs = Array.from(document.querySelectorAll(`.comment-input-${level.replace(/ /g, '_')}`));
        const comments = commentInputs
          .map((input) => input.value.trim())
          .filter((s) => s.length > 0);

        if (currentRole === "GVBM") {
          const mhKey = getMonHocKey();
          currentData[currentCapHoc][currentKhoiLop].GVBM[mhKey][
            level
          ] = {
            min: isNaN(min) ? 0 : min,
            max: isNaN(max) ? 10 : max,
            code: code,
            mucDG: mucDG,
            comments: comments,
          };
        } else if (currentRole === "TH_NLPC") {
          currentData[currentCapHoc][currentKhoiLop].TH_NLPC[level] = {
             min: isNaN(min) ? 0 : min,
             max: isNaN(max) ? 10 : max,
             code: code,
             mucDG: mucDG,
             comments: comments,
          };
        } else if (currentRole === "DGTX") {
          const mainKey = currentCapHoc === "TH" ? `${currentMonHoc}_${currentTieuChi}` : currentMonHoc;
          const dgtxKey = `${mainKey}_Thang${currentThang}`;
          if (!currentData[currentCapHoc][currentKhoiLop].DGTX) currentData[currentCapHoc][currentKhoiLop].DGTX = {};
          if (!currentData[currentCapHoc][currentKhoiLop].DGTX[dgtxKey]) {
            currentData[currentCapHoc][currentKhoiLop].DGTX[dgtxKey] = {};
          }
          currentData[currentCapHoc][currentKhoiLop].DGTX[dgtxKey][level] = {
            min: 0,
            max: 10,
            code: code,
            mucDG: mucDG,
            comments: comments,
          };
        } else if (currentRole === "HIEU_TRUONG") {
          if (!currentData[currentCapHoc][currentKhoiLop].HIEU_TRUONG[level]) {
            currentData[currentCapHoc][currentKhoiLop].HIEU_TRUONG[level] = {};
          }
          currentData[currentCapHoc][currentKhoiLop].HIEU_TRUONG[level] = {
            min: isNaN(min) ? 0 : min,
            max: isNaN(max) ? 10 : max,
            code: code,
            mucDG: mucDG,
            comments: comments,
          };
        } else if (currentRole === "HOC_BA_GVBM") {
          if (!currentData[currentCapHoc][currentKhoiLop].HOC_BA_GVBM[level]) {
            currentData[currentCapHoc][currentKhoiLop].HOC_BA_GVBM[level] = {};
          }
          currentData[currentCapHoc][currentKhoiLop].HOC_BA_GVBM[level] = {
            min: isNaN(min) ? 0 : min,
            max: isNaN(max) ? 10 : max,
            code: code,
            mucDG: mucDG,
            comments: comments,
          };
        } else if (currentRole === "HOC_BA_GVCN") {
          if (!currentData[currentCapHoc][currentKhoiLop].HOC_BA_GVCN[level]) {
            currentData[currentCapHoc][currentKhoiLop].HOC_BA_GVCN[level] = {};
          }
          currentData[currentCapHoc][currentKhoiLop].HOC_BA_GVCN[level] = {
            min: isNaN(min) ? 0 : min,
            max: isNaN(max) ? 10 : max,
            code: code,
            mucDG: mucDG,
            comments: comments,
          };
        }
      }
    });

    saveToStorage();
    showCustomModal("Thành công", "Đã lưu cấu hình thành công!", true);
  });

  resetConfigBtn.addEventListener("click", () => {
    showCustomModal("Khôi phục cài đặt gốc", "Bạn có chắc chắn muốn khôi phục về cài đặt gốc? TẤT CẢ lời phê mẫu của bạn sẽ bị xóa.", false, (isConfirmed) => {
      if (isConfirmed) {
        try {
          currentData = generateAllSampleData();
          saveToStorage();
          updateTabsUI();
          updateDropdowns();
          renderData();
          showCustomModal("Thành công", "Đã khôi phục cài đặt gốc thành công!", true);
        } catch (e) {
          console.error("Error resetting data:", e);
          showCustomModal("Lỗi", "Có lỗi xảy ra khi khôi phục: " + e.message, true);
        }
      }
    });
  });

  // Excel Export Template
  const downloadTemplateBtn = document.getElementById("downloadTemplateBtn");
  if (downloadTemplateBtn) {
    downloadTemplateBtn.addEventListener("click", () => {
      const wb = XLSX.utils.book_new();
      const headers = [
        "Cấp Học",
        "Khối Lớp",
        "Vai Trò",
        "Môn Học",
        "Mức Độ",
        "Điểm Từ",
        "Điểm Đến",
        "Mã NX",
        "Lời Phê",
      ];
      
      const sortMapLevels = (subData) => {
        return Object.keys(subData).sort((a, b) => {
          const itemA = subData[a];
          const itemB = subData[b];
          const maxA = itemA.max !== undefined && itemA.max !== "" ? Number(itemA.max) : -1;
          const maxB = itemB.max !== undefined && itemB.max !== "" ? Number(itemB.max) : -1;
          if (maxA !== maxB) return maxB - maxA;
          const minA = itemA.min !== undefined && itemA.min !== "" ? Number(itemA.min) : -1;
          const minB = itemB.min !== undefined && itemB.min !== "" ? Number(itemB.min) : -1;
          
          if (minA !== minB) return minB - minA;
          // default string compare
          if (a === "Mức độ Tốt") return -1;
          if (b === "Mức độ Tốt") return 1;
          return a.localeCompare(b);
        });
      };

      const capHocs = ["TH", "THCS", "THPT"];
      
      capHocs.forEach(capHoc => {
        const ws_data = [headers];
        
        if (currentData[capHoc]) {
          // Sort khoi numerically
          const khois = Object.keys(currentData[capHoc]).sort((a, b) => parseInt(a) - parseInt(b));
          
          khois.forEach(khoi => {
            const kData = currentData[capHoc][khoi];
            
            // 1. GVBM
            if (kData.GVBM) {
              const sortedMons = Object.keys(kData.GVBM).sort((a, b) => a.localeCompare(b));
              for (const mon of sortedMons) {
                const subData = kData.GVBM[mon];
                const sortedLevels = sortMapLevels(subData);
                for (const lv of sortedLevels) {
                  const item = subData[lv];
                  const commentsStr = (item.comments || []).join("\n");
                  ws_data.push([
                    capHoc, khoi, "GVBM", mon, lv, 
                    item.min !== undefined ? item.min.toString() : "", 
                    item.max !== undefined ? item.max.toString() : "", 
                    item.code || "", 
                    commentsStr
                  ]);
                }
              }
            }
            
            // 2. DGTX
            if (kData.DGTX) {
              const sortedMons = Object.keys(kData.DGTX).sort((a, b) => a.localeCompare(b));
              for (const mon of sortedMons) {
                const subData = kData.DGTX[mon];
                const sortedLevels = sortMapLevels(subData);
                for (const lv of sortedLevels) {
                  const item = subData[lv];
                  const commentsStr = (item.comments || []).join("\n");
                  ws_data.push([
                    capHoc, khoi, "DGTX", mon, lv, 
                    item.min !== undefined ? item.min.toString() : "", 
                    item.max !== undefined ? item.max.toString() : "", 
                    item.code || "", 
                    commentsStr
                  ]);
                }
              }
            }
            
            // 3. TH_NLPC
            if (kData.TH_NLPC) {
              const sortedLevels = sortMapLevels(kData.TH_NLPC);
              for (const lv of sortedLevels) {
                const item = kData.TH_NLPC[lv];
                const commentsStr = (item.comments || []).join("\n");
                ws_data.push([
                  capHoc, khoi, "TH_NLPC", "Năng lực & Phẩm chất", lv, 
                  item.min !== undefined ? item.min.toString() : "", 
                  item.max !== undefined ? item.max.toString() : "", 
                  item.code || "", 
                  commentsStr
                ]);
              }
            }

            // 4. VNEDU_NLPC_HB (exporting first so it shows up before HOC_BA)
            if (kData.VNEDU_NLPC_HB) {
              for (const group in kData.VNEDU_NLPC_HB) {
                for (const itemLbl in kData.VNEDU_NLPC_HB[group]) {
                  const item = kData.VNEDU_NLPC_HB[group][itemLbl];
                  const commentsStr = (item.comments || []).join("\n");
                  ws_data.push([
                    capHoc, khoi, "VNEDU_NLPC_HB", group, itemLbl, 
                    "", "", "", 
                    commentsStr
                  ]);
                }
              }
            }
          });
        }
        
        if (ws_data.length > 1) {
          const ws = XLSX.utils.aoa_to_sheet(ws_data);
          XLSX.utils.book_append_sheet(wb, ws, capHoc);
        }
      });
      
      // Hoc Ba Sheet
      const hb_ws_data = [headers];
      capHocs.forEach(capHoc => {
        if (currentData[capHoc]) {
          const khois = Object.keys(currentData[capHoc]).sort((a, b) => parseInt(a) - parseInt(b));
          
          khois.forEach(khoi => {
            const kData = currentData[capHoc][khoi];
            
            // HOC_BA_GVBM
            if (kData.HOC_BA_GVBM) {
              const sortedLevels = sortMapLevels(kData.HOC_BA_GVBM);
              for (const lv of sortedLevels) {
                const item = kData.HOC_BA_GVBM[lv];
                const commentsStr = (item.comments || []).join("\n");
                hb_ws_data.push([
                  capHoc, khoi, "HOC_BA_GVBM", "", lv, 
                  item.min !== undefined ? item.min.toString() : "0", 
                  item.max !== undefined ? item.max.toString() : "10", 
                  item.code || "", 
                  commentsStr
                ]);
              }
            }

            // HOC_BA_GVCN
            if (kData.HOC_BA_GVCN) {
              const sortedLevels = sortMapLevels(kData.HOC_BA_GVCN);
              for (const lv of sortedLevels) {
                const item = kData.HOC_BA_GVCN[lv];
                const commentsStr = (item.comments || []).join("\n");
                hb_ws_data.push([
                  capHoc, khoi, "HOC_BA_GVCN", "", lv, 
                  item.min !== undefined ? item.min.toString() : "0", 
                  item.max !== undefined ? item.max.toString() : "10", 
                  item.code || "", 
                  commentsStr
                ]);
              }
            }

            // HIEU_TRUONG
            if (kData.HIEU_TRUONG) {
              const sortedLevels = sortMapLevels(kData.HIEU_TRUONG);
              for (const lv of sortedLevels) {
                const item = kData.HIEU_TRUONG[lv];
                const commentsStr = (item.comments || []).join("\n");
                hb_ws_data.push([
                  capHoc, khoi, "HIEU_TRUONG", "", lv, 
                  item.min !== undefined ? item.min.toString() : "0", 
                  item.max !== undefined ? item.max.toString() : "10", 
                  item.code || "", 
                  commentsStr
                ]);
              }
            }
          });
        }
      });
      
      const hb_ws = XLSX.utils.aoa_to_sheet(hb_ws_data);
      XLSX.utils.book_append_sheet(wb, hb_ws, "Học Bạ");

      XLSX.writeFile(wb, "Mau_nhap_lieu.xlsx");
    });
  }

  // Excel Import
  const importCsvBtn = document.getElementById("importCsvBtn");
  const csvFileInput = document.getElementById("csvFileInput");

  if (importCsvBtn && csvFileInput) {
    importCsvBtn.addEventListener("click", () => {
      const file = csvFileInput.files[0];
      if (!file) {
        alert("Vui lòng chọn tệp Excel trước khi tải lên.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          let newData = JSON.parse(JSON.stringify(currentData));
          let hasData = false;

          workbook.SheetNames.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            if (rows.length < 2) return;

            const headers = rows[0].map((h) =>
              (h || "").toString().trim().toLowerCase(),
            );
            const cCapHoc = headers.indexOf("cấp học");
            const cKhoi = headers.indexOf("khối lớp");
            const cVaiTro = headers.indexOf("vai trò");
            const cMon = headers.indexOf("môn học");
            const cMucDo = headers.indexOf("mức độ");
            const cDiemTu = headers.indexOf("điểm từ");
            const cDiemDen = headers.indexOf("điểm đến");
            const cMaNX = headers.indexOf("mã nx");

            let cLoiPhe = headers.indexOf("lời phê");
            if (cLoiPhe === -1) cLoiPhe = headers.indexOf("nội dung"); // fallback

            if (
              cCapHoc === -1 ||
              cKhoi === -1 ||
              cVaiTro === -1 ||
              cLoiPhe === -1
            )
              return;

            hasData = true;

            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length === 0 || !row[cCapHoc]) continue;

              const capHoc = row[cCapHoc].toString().trim();
              const khoiLop = row[cKhoi] ? row[cKhoi].toString().trim() : "";
              const vaiTro = row[cVaiTro] ? row[cVaiTro].toString().trim() : "";
              const monHoc = row[cMon] ? row[cMon].toString().trim() : "";
              const mucDo = row[cMucDo] ? row[cMucDo].toString().trim() : "";

              let diemTu = parseFloat(row[cDiemTu]);
              if (isNaN(diemTu)) diemTu = 0;
              let diemDen = parseFloat(row[cDiemDen]);
              if (isNaN(diemDen)) diemDen = 10;

              const maNX = row[cMaNX] ? row[cMaNX].toString().trim() : "";

              const rawComments = row[cLoiPhe] ? row[cLoiPhe].toString() : "";
              const comments = rawComments
                .split("\n")
                .map((s) => s.trim())
                .filter((x) => x);

              if (!newData[capHoc]) newData[capHoc] = {};
              if (!newData[capHoc][khoiLop])
                newData[capHoc][khoiLop] = {
                  GVBM: {},
                  HOC_BA_GVBM: {},
                  HOC_BA_GVCN: {},
                  HIEU_TRUONG: {},
                };
              if (Array.isArray(newData[capHoc][khoiLop].HOC_BA_GVBM))
                newData[capHoc][khoiLop].HOC_BA_GVBM = {};
              if (Array.isArray(newData[capHoc][khoiLop].HOC_BA_GVCN))
                newData[capHoc][khoiLop].HOC_BA_GVCN = {};
              if (!newData[capHoc][khoiLop].HIEU_TRUONG)
                newData[capHoc][khoiLop].HIEU_TRUONG = getEmptyHieuTruong(khoiLop);
              if (capHoc === "TH" && !newData[capHoc][khoiLop].TH_NLPC)
                newData[capHoc][khoiLop].TH_NLPC = getEmptyThNlPc();

              if (vaiTro === "GVBM" && monHoc && mucDo) {
                if (!newData[capHoc][khoiLop].GVBM[monHoc]) {
                  newData[capHoc][khoiLop].GVBM[monHoc] = {
                    Tốt: { min: 8, max: 10, code: "T", mucDG: "T", comments: [] },
                    Khá: { min: 6.5, max: 7.9, code: "K", mucDG: "H", comments: [] },
                    Đạt: { min: 5, max: 6.4, code: "Đ", mucDG: "H", comments: [] },
                    "Chưa Đạt": { min: 0, max: 4.9, code: "CĐ", mucDG: "C", comments: [] },
                  };
                }
                if (!newData[capHoc][khoiLop].GVBM[monHoc][mucDo]) {
                  newData[capHoc][khoiLop].GVBM[monHoc][mucDo] = {
                    min: diemTu,
                    max: diemDen,
                    code: maNX,
                    comments: [],
                  };
                }

                if (
                  row[cDiemTu] !== undefined &&
                  row[cDiemTu] !== null &&
                  row[cDiemTu] !== ""
                ) {
                  newData[capHoc][khoiLop].GVBM[monHoc][mucDo].min = diemTu;
                }
                if (
                  row[cDiemDen] !== undefined &&
                  row[cDiemDen] !== null &&
                  row[cDiemDen] !== ""
                ) {
                  newData[capHoc][khoiLop].GVBM[monHoc][mucDo].max = diemDen;
                }
                if (row[cMaNX] !== undefined && row[cMaNX] !== null) {
                  newData[capHoc][khoiLop].GVBM[monHoc][mucDo].code = maNX;
                }

                newData[capHoc][khoiLop].GVBM[monHoc][mucDo].comments =
                  comments;
              } else if (vaiTro === "DGTX" && monHoc && mucDo) {
                if (!newData[capHoc][khoiLop].DGTX) newData[capHoc][khoiLop].DGTX = {};
                if (!newData[capHoc][khoiLop].DGTX[monHoc]) {
                  newData[capHoc][khoiLop].DGTX[monHoc] = getEmptyDGTX(monHoc, undefined, khoiLop);
                }
                if (!newData[capHoc][khoiLop].DGTX[monHoc][mucDo]) {
                  newData[capHoc][khoiLop].DGTX[monHoc][mucDo] = {
                    min: diemTu,
                    max: diemDen,
                    code: maNX,
                    comments: [],
                  };
                }

                if (row[cDiemTu] !== undefined && row[cDiemTu] !== null && row[cDiemTu] !== "") {
                  newData[capHoc][khoiLop].DGTX[monHoc][mucDo].min = diemTu;
                }
                if (row[cDiemDen] !== undefined && row[cDiemDen] !== null && row[cDiemDen] !== "") {
                  newData[capHoc][khoiLop].DGTX[monHoc][mucDo].max = diemDen;
                }
                if (row[cMaNX] !== undefined && row[cMaNX] !== null) {
                  newData[capHoc][khoiLop].DGTX[monHoc][mucDo].code = maNX;
                }

                newData[capHoc][khoiLop].DGTX[monHoc][mucDo].comments = comments;
              } else if (vaiTro === "TH_NLPC" && mucDo) {
                if (!newData[capHoc][khoiLop].TH_NLPC) {
                  newData[capHoc][khoiLop].TH_NLPC = getEmptyThNlPc();
                }
                if (!newData[capHoc][khoiLop].TH_NLPC[mucDo]) {
                  newData[capHoc][khoiLop].TH_NLPC[mucDo] = {
                    min: diemTu,
                    max: diemDen,
                    code: maNX,
                    comments: [],
                  };
                }

                if (row[cDiemTu] !== undefined && row[cDiemTu] !== null && row[cDiemTu] !== "") {
                  newData[capHoc][khoiLop].TH_NLPC[mucDo].min = diemTu;
                }
                if (row[cDiemDen] !== undefined && row[cDiemDen] !== null && row[cDiemDen] !== "") {
                  newData[capHoc][khoiLop].TH_NLPC[mucDo].max = diemDen;
                }
                if (row[cMaNX] !== undefined && row[cMaNX] !== null) {
                  newData[capHoc][khoiLop].TH_NLPC[mucDo].code = maNX;
                }

                newData[capHoc][khoiLop].TH_NLPC[mucDo].comments = comments;
              } else if ((vaiTro === "HOC_BA" || vaiTro === "HOC_BA_GVCN" || vaiTro === "HOC_BA_GVBM") && mucDo) {
                // If old HOC_BA, default to GVCN
                const targetVaiTro = vaiTro === "HOC_BA" ? "HOC_BA_GVCN" : vaiTro;
                
                if (!newData[capHoc][khoiLop][targetVaiTro]) {
                  newData[capHoc][khoiLop][targetVaiTro] = {
                    Tốt: { min: 8, max: 10, code: "T", mucDG: "T", comments: [] },
                    Khá: { min: 6.5, max: 7.9, code: "K", mucDG: "H", comments: [] },
                    Đạt: { min: 5, max: 6.4, code: "Đ", mucDG: "H", comments: [] },
                    "Chưa Đạt": { min: 0, max: 4.9, code: "CĐ", mucDG: "C", comments: [] },
                  };
                }
                if (!newData[capHoc][khoiLop][targetVaiTro][mucDo]) {
                  newData[capHoc][khoiLop][targetVaiTro][mucDo] = {
                    min: diemTu,
                    max: diemDen,
                    code: maNX,
                    comments: [],
                  };
                }

                if (
                  row[cDiemTu] !== undefined &&
                  row[cDiemTu] !== null &&
                  row[cDiemTu] !== ""
                ) {
                  newData[capHoc][khoiLop][targetVaiTro][mucDo].min = diemTu;
                }
                if (
                  row[cDiemDen] !== undefined &&
                  row[cDiemDen] !== null &&
                  row[cDiemDen] !== ""
                ) {
                  newData[capHoc][khoiLop][targetVaiTro][mucDo].max = diemDen;
                }
                if (row[cMaNX] !== undefined && row[cMaNX] !== null) {
                  newData[capHoc][khoiLop][targetVaiTro][mucDo].code = maNX;
                }

                newData[capHoc][khoiLop][targetVaiTro][mucDo].comments = comments;
              } else if (vaiTro === "HIEU_TRUONG" && mucDo) {
                if (!newData[capHoc][khoiLop].HIEU_TRUONG) {
                  newData[capHoc][khoiLop].HIEU_TRUONG = {
                    Tốt: { min: 8, max: 10, code: "T", mucDG: "T", comments: [] },
                    Khá: { min: 6.5, max: 7.9, code: "K", mucDG: "H", comments: [] },
                    Đạt: { min: 5, max: 6.4, code: "Đ", mucDG: "H", comments: [] },
                    "Chưa Đạt": { min: 0, max: 4.9, code: "CĐ", mucDG: "C", comments: [] },
                  };
                }
                if (!newData[capHoc][khoiLop].HIEU_TRUONG[mucDo]) {
                  newData[capHoc][khoiLop].HIEU_TRUONG[mucDo] = {
                    min: diemTu,
                    max: diemDen,
                    code: maNX,
                    comments: [],
                  };
                }

                if (
                  row[cDiemTu] !== undefined &&
                  row[cDiemTu] !== null &&
                  row[cDiemTu] !== ""
                ) {
                  newData[capHoc][khoiLop].HIEU_TRUONG[mucDo].min = diemTu;
                }
                if (
                  row[cDiemDen] !== undefined &&
                  row[cDiemDen] !== null &&
                  row[cDiemDen] !== ""
                ) {
                  newData[capHoc][khoiLop].HIEU_TRUONG[mucDo].max = diemDen;
                }
                if (row[cMaNX] !== undefined && row[cMaNX] !== null) {
                  newData[capHoc][khoiLop].HIEU_TRUONG[mucDo].code = maNX;
                }

                newData[capHoc][khoiLop].HIEU_TRUONG[mucDo].comments = comments;
              } else if (vaiTro === "VNEDU_NLPC_HB" && monHoc && mucDo) {
                if (!newData[capHoc][khoiLop].VNEDU_NLPC_HB) {
                  newData[capHoc][khoiLop].VNEDU_NLPC_HB = {};
                }
                if (!newData[capHoc][khoiLop].VNEDU_NLPC_HB[monHoc]) {
                  newData[capHoc][khoiLop].VNEDU_NLPC_HB[monHoc] = {};
                }
                if (!newData[capHoc][khoiLop].VNEDU_NLPC_HB[monHoc][mucDo]) {
                  newData[capHoc][khoiLop].VNEDU_NLPC_HB[monHoc][mucDo] = {
                    comments: []
                  };
                }
                newData[capHoc][khoiLop].VNEDU_NLPC_HB[monHoc][mucDo].comments = comments;
              }
            }
          });

          if (!hasData) {
            alert(
              "Định dạng cột ở các sheet không chính xác hoặc không có dữ liệu hợp lệ. Vui lòng tải 'File Mẫu' để xem chuẩn cấu trúc.",
            );
            return;
          }

          currentData = newData;
          saveToStorage();
          updateDropdowns();
          renderData();
          alert("Nhập liệu Excel thành công!");
          csvFileInput.value = "";
        } catch (err) {
          console.error(err);
          alert("Lỗi khi đọc file Excel: " + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // Event listeners for comment lists
  document.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".add-comment-btn");
    if (addBtn) {
      const level = addBtn.dataset.level;
      const list = addBtn.previousElementSibling;
      const row = document.createElement("div");
      row.className = "flex gap-2 items-start comment-row";
      row.innerHTML = `
        <textarea rows="2" class="comment-input-${level.replace(/ /g, '_')} flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 font-sans leading-relaxed transition-colors placeholder:text-slate-400 custom-scroll min-h-[40px]" placeholder="Nhập lời nhận xét..."></textarea>
        <button type="button" class="delete-comment-btn p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0 mt-1" title="Xóa">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
        </button>
      `;
      list.appendChild(row);
      const newTextarea = row.querySelector("textarea");
      if (newTextarea) newTextarea.focus();
      updateCommentCount(level);
    }

    const delBtn = e.target.closest(".delete-comment-btn");
    if (delBtn) {
      const row = delBtn.closest(".comment-row");
      const textarea = row.querySelector("textarea");
      let levelMatch = "";
      if (textarea && textarea.className.match(/comment-input-([^ ]+)/)) {
        levelMatch = textarea.className.match(/comment-input-([^ ]+)/)[1].replace(/_/g, ' ');
      }
      row.remove();
      if (levelMatch) {
         updateCommentCount(levelMatch);
      }
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target.tagName && e.target.tagName.toLowerCase() === 'textarea' && e.target.className.includes("comment-input-")) {
      const match = e.target.className.match(/comment-input-([^ ]+)/);
      if (match) {
        updateCommentCount(match[1].replace(/_/g, ' '));
      }
    }
  });

});

function updateCommentCount(levelStr) {
  const levelId = levelStr.replace(/ /g, '_');
  const badge = document.getElementById(`count_badge_${levelId}`);
  if (badge) {
    const inputs = Array.from(document.querySelectorAll(`.comment-input-${levelId}`));
    const count = inputs.map(i => i.value.trim()).filter(s => s.length > 0).length;
    badge.textContent = count + " lời nhận xét";
  }
}

function getMonHocKey() {
  if ((currentCapHoc === "THCS" || currentCapHoc === "THPT") && currentRole === "GVBM") {
    return `${currentMonHoc}_${currentHocKy}`;
  }
  return currentMonHoc;
}

  function ensureDataStructure() {
  let modified = false;
  if (!currentData[currentCapHoc]) {
    currentData[currentCapHoc] = {};
    modified = true;
  }
  if (!currentData[currentCapHoc][currentKhoiLop]) {
    currentData[currentCapHoc][currentKhoiLop] = {
      GVBM: {},
      DGTX: {},
      HOC_BA_GVBM: getEmptyHocBaGVBM(),
      HOC_BA_GVCN: getEmptyHocBaGVCN(),
      HIEU_TRUONG: getEmptyHieuTruong(currentKhoiLop),
    };
    if (currentCapHoc === "TH") {
      currentData[currentCapHoc][currentKhoiLop].TH_NLPC = getEmptyThNlPc();
    }
    modified = true;
  }
  const kData = currentData[currentCapHoc][currentKhoiLop];
  if (currentCapHoc === "TH" && !kData.TH_NLPC) {
    kData.TH_NLPC = getEmptyThNlPc();
    modified = true;
  }
  if (currentCapHoc === "TH" && !kData.VNEDU_NLPC_HB) {
    kData.VNEDU_NLPC_HB = getEmptyVneduNlpcHb(currentKhoiLop);
    modified = true;
  }
  if (!kData.DGTX) {
    kData.DGTX = {};
    modified = true;
  }
  if (!kData.HIEU_TRUONG) {
    kData.HIEU_TRUONG = getEmptyHieuTruong(currentKhoiLop);
    modified = true;
  }
  if (Array.isArray(kData.HOC_BA_GVCN) || (kData.HOC_BA_GVCN && kData.HOC_BA_GVCN["Tốt"])) {
    // Migrate to single category "Nhận xét chung"
    const oldData = kData.HOC_BA_GVCN;
    let allComments = [];
    if (Array.isArray(oldData)) {
      allComments = oldData;
    } else {
      for (const key in oldData) {
        if (oldData[key] && oldData[key].comments) {
          allComments = allComments.concat(oldData[key].comments);
        }
      }
    }
    kData.HOC_BA_GVCN = {
      "Nhận xét chung": { min: 0, max: 10, code: "", comments: allComments.length > 0 ? allComments : getEmptyHocBaGVCN()["Nhận xét chung"].comments }
    };
    modified = true;
  }
  if (currentRole === "GVBM") {
    const mhKey = getMonHocKey();
    if (
      !kData.GVBM[mhKey] ||
      Object.keys(kData.GVBM[mhKey]).length === 0
    ) {
      const platformRadios = document.getElementsByName("configPlatform");
      let isVnedu = false;
      for (const radio of platformRadios) {
        if (radio.checked) {
          isVnedu = radio.value === "vnedu";
          break;
        }
      }
      if (isVnedu) {
        kData.GVBM[mhKey] = getEmptySubject(currentMonHoc, currentCapHoc, currentHocKy);
      } else {
        kData.GVBM[mhKey] = getEmptySubject(currentMonHoc, null, currentHocKy);
      }
      modified = true;
    } else {
      // Ensure T, H, C exists for VnEdu if missing, cloned from Tốt, Khá, Chưa Đạt
      const subjData = kData.GVBM[mhKey];
      if (!subjData["T"] && subjData["Tốt"]) {
        subjData["T"] = JSON.parse(JSON.stringify(subjData["Tốt"]));
        subjData["T"].code = "T";
        subjData["T"].mucDG = "T";
        modified = true;
      }
      if (!subjData["H"] && subjData["Khá"]) {
        subjData["H"] = JSON.parse(JSON.stringify(subjData["Khá"]));
        subjData["H"].code = "H";
        subjData["H"].mucDG = "H";
        modified = true;
      }
      if (!subjData["C"] && subjData["Chưa Đạt"]) {
        subjData["C"] = JSON.parse(JSON.stringify(subjData["Chưa Đạt"]));
        subjData["C"].code = "C";
        subjData["C"].mucDG = "C";
        modified = true;
      }
    }
  }
  if (currentRole === "DGTX") {
    // dynamically import from shared if not exists
    const mainKey = currentCapHoc === "TH" ? `${currentMonHoc}_${currentTieuChi}` : currentMonHoc;
    const dgtxKey = `${mainKey}_Thang${currentThang}`;
    if (!kData.DGTX[dgtxKey] || Object.keys(kData.DGTX[dgtxKey]).length === 0 || kData.DGTX[dgtxKey]["Chung"]) {
      kData.DGTX[dgtxKey] = getEmptyDGTX(mainKey, currentThang, currentKhoiLop);
      modified = true;
    }
  }
  if (currentRole === "TH_NLPC") {
    if (!kData.TH_NLPC) {
      kData.TH_NLPC = getEmptyThNlPc();
      modified = true;
    }
  }
  if (modified) {
    saveToStorage();
  }
}

function saveToStorage() {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ commentsData: currentData });
  }
}

function renderData() {
  const container = document.getElementById("configContainer");
  container.innerHTML = "";

  ensureDataStructure();

  if (currentRole === "HIEU_TRUONG") {
    let titlePrefix = `<span class="text-blue-600">Danh sách Mẫu Phê duyệt Hiệu trưởng</span>`;
    const mainTitle = document.getElementById("main-header-title");
    if (mainTitle) mainTitle.innerHTML = titlePrefix;

    const allGrades = [
      {cap: "TH", khoi: "1"}, {cap: "TH", khoi: "2"}, {cap: "TH", khoi: "3"}, {cap: "TH", khoi: "4"}, {cap: "TH", khoi: "5"},
      {cap: "THCS", khoi: "6"}, {cap: "THCS", khoi: "7"}, {cap: "THCS", khoi: "8"}, {cap: "THCS", khoi: "9"},
      {cap: "THPT", khoi: "10"}, {cap: "THPT", khoi: "11"}, {cap: "THPT", khoi: "12"}
    ];

    let html = `
      <div class="col-span-full mb-4 p-4 text-sm rounded-xl border bg-blue-50 text-blue-800 border-blue-200">
        <b>Hướng dẫn:</b> Cấu hình mẫu phê duyệt chung cho tất cả các Khối lớp. <br/><br/>- Mỗi khối có một ô riêng. <br/>- Mỗi dòng văn bản là 1 lời nhận xét độc lập (bấm Enter để tách dòng, phần mềm tự động xuống dòng không tính).<br/>- Khi nhấn phê duyệt học bạ, công cụ sẽ lấy ngẫu nhiên 1 lời phê ở khối lớp đang được chọn để điền vào cho học sinh.
      </div>
      <div class="flex flex-col gap-4 w-full pb-8">
    `;

    allGrades.forEach(grade => {
      let htData = currentData[grade.cap][grade.khoi].HIEU_TRUONG || {};
      let item = htData["Nhận xét chung"] || { comments: [] };
      let textVal = (item.comments || []).join('\n');
      html += `
        <div class="bg-white border text-sm border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col sm:flex-row min-h-[100px]">
            <div class="bg-slate-100 border-b sm:border-b-0 sm:border-r border-slate-200 px-4 py-3 font-bold text-slate-700 flex flex-row sm:flex-col justify-between sm:justify-center items-center w-full sm:w-[140px] shrink-0">
              <span class="text-base mb-0 sm:mb-2 text-blue-800">Khối ${grade.khoi}</span>
              <span class="text-[10px] font-bold uppercase bg-white border border-slate-200 px-2.5 py-0.5 rounded-md text-slate-500 shadow-sm">${grade.cap}</span>
            </div>
            <div class="p-3 flex-1 flex flex-col">
              <textarea id="hieu_truong_${grade.cap}_${grade.khoi}" class="w-full flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[13.5px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all custom-scroll resize-y font-sans leading-relaxed tracking-wide placeholder:text-slate-400 min-h-[70px]" placeholder="Nhập lời phê... (Mỗi dòng là 1 mẫu)">${textVal}</textarea>
            </div>
        </div>
      `;
    });
    html += `</div>`;
    container.innerHTML = html;
    return;
  }

  if (currentRole === "VNEDU_NLPC_HB") {
    container.className = "grid grid-cols-1 gap-6 mt-4";
    let titlePrefix = `<span class="text-blue-600">Phẩm chất - Năng lực ghi học bạ (VnEdu)</span> (<span class="text-green-600">Khối ${currentKhoiLop}</span>)`;
    const mainTitle = document.getElementById("main-header-title");
    if (mainTitle) mainTitle.innerHTML = titlePrefix;

    const data = currentData[currentCapHoc][currentKhoiLop].VNEDU_NLPC_HB || getEmptyVneduNlpcHb(currentKhoiLop);

    const nlChungItems = ["Nhận xét chung", "Tự chủ và tự học", "Giao tiếp và hợp tác", "GQVĐ và sáng tạo"];
    let nlDacThuItems = ["Nhận xét năng lực đặc thù", "Ngôn ngữ", "Tính toán", "Khoa học", "Thẩm mĩ", "Thể chất"];
    const pcItems = ["Nhận xét chung", "Yêu nước", "Nhân ái", "Chăm chỉ", "Trung thực", "Trách nhiệm"];

    if (["3", "4", "5"].includes(currentKhoiLop)) {
        nlDacThuItems.splice(4, 0, "Công nghệ", "Tin học");
    }

    const renderTextarea = (groupId, itemLabel, colorClass) => {
       const groupData = data[groupId] || {};
       const itemData = groupData[itemLabel] || {comments: []};
       const comments = itemData.comments.length > 0 ? itemData.comments : [""];
       const validCount = itemData.comments.filter(c => c.trim().length > 0).length;
       
       const commentsHtml = comments.map(c => `
         <div class="flex gap-2 items-start comment-row">
           <textarea rows="2" class="comment-input-vnedu_${groupId.replace(/ /g, '_')}_${itemLabel.replace(/ /g, '_')} flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-${colorClass}-500 focus:ring-1 focus:ring-${colorClass}-500 transition-all custom-scroll resize-y font-sans leading-relaxed placeholder:text-slate-400 min-h-[40px]">${c}</textarea>
           <button type="button" class="delete-comment-btn p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0 mt-1" title="Xóa">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
           </button>
         </div>
       `).join("");

       return `
          <div class="vnedu-nlpc-item border border-slate-100 bg-white rounded-lg p-3 shadow-sm">
             <div class="flex justify-between items-center mb-3">
                 <label class="block text-[13px] font-bold text-${colorClass}-600">${itemLabel}:</label>
                 <span id="count_badge_vnedu_${groupId.replace(/ /g, '_')}_${itemLabel.replace(/ /g, '_')}" class="px-2.5 py-0.5 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-red-600 shadow-sm">${validCount} lời nhận xét</span>
             </div>
             <div class="comments-list flex flex-col gap-2">
                 ${commentsHtml}
             </div>
             <button type="button" class="add-comment-btn mt-3 text-sm text-${colorClass}-600 font-medium hover:underline flex items-center gap-1" data-level="vnedu_${groupId.replace(/ /g, '_')}_${itemLabel.replace(/ /g, '_')}">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
                 Thêm nhận xét
             </button>
          </div>
       `;
    };

    let html = `
      <div class="col-span-full mb-4 p-4 text-sm rounded-xl border bg-blue-50 text-blue-800 border-blue-200">
        <b>Hướng dẫn:</b><br/>- Mỗi dòng văn bản là 1 lời nhận xét độc lập (bấm Enter để tách dòng).<br/>- Công cụ sẽ lấy ngẫu nhiên 1 lời phê ở mỗi ô để điền vào hệ thống.
      </div>
      <div class="flex flex-col gap-6 w-full pb-8">
        
        <!-- NĂNG LỰC CHUNG -->
        <div class="flex flex-col gap-4">
          <div class="bg-blue-50/50 border text-sm border-blue-100 rounded-xl overflow-hidden flex flex-col h-full shadow-sm">
            <div class="bg-blue-100/50 border-b border-blue-100 px-4 py-3 font-bold text-blue-800 text-center uppercase tracking-wide">
              1. NĂNG LỰC CHUNG
            </div>
            <div class="p-4 grid grid-cols-1 gap-4">
               ${nlChungItems.map(item => renderTextarea("Năng lực chung", item, "blue")).join("")}
            </div>
          </div>
        </div>

        <!-- NĂNG LỰC ĐẶC THÙ -->
        <div class="flex flex-col gap-4">
          <div class="bg-indigo-50/50 border text-sm border-indigo-100 rounded-xl overflow-hidden flex flex-col h-full shadow-sm">
            <div class="bg-indigo-100/50 border-b border-indigo-100 px-4 py-3 font-bold text-indigo-800 text-center uppercase tracking-wide">
              1.2 NĂNG LỰC ĐẶC THÙ
            </div>
            <div class="p-4 grid grid-cols-1 gap-4">
               ${nlDacThuItems.map(item => renderTextarea("Năng lực đặc thù", item, "indigo")).join("")}
            </div>
          </div>
        </div>

        <!-- PHẨM CHẤT -->
        <div class="flex flex-col gap-4 md:col-span-2 xl:col-span-1">
          <div class="bg-green-50/50 border text-sm border-green-100 rounded-xl overflow-hidden flex flex-col h-full shadow-sm">
            <div class="bg-green-100/50 border-b border-green-100 px-4 py-3 font-bold text-green-800 text-center uppercase tracking-wide">
              2. PHẨM CHẤT
            </div>
            <div class="p-4 grid grid-cols-1 gap-4">
               ${pcItems.map(item => renderTextarea("Phẩm chất", item, "green")).join("")}
            </div>
          </div>
        </div>

      </div>
    `;

    container.className = "flex flex-col w-full gap-4 mt-4";
    container.innerHTML = html;
    return;
  }

  let titlePrefix = `<span class="text-blue-600">Danh sách Lời nhận xét môn</span> <span class="text-green-600">${currentMonHoc}</span>`;
  if (currentRole === "DGTX")
    titlePrefix = `<span class="text-blue-600">Đánh giá thường xuyên</span> - <span class="text-green-600">${currentMonHoc}</span>`;
  if (currentRole === "TH_NLPC")
    titlePrefix = `<span class="text-blue-600">Đánh giá định kỳ NL & PC</span> - <span class="text-green-600">${currentMonHoc}</span>`;
  if (currentRole === "HOC_BA_GVBM")
    titlePrefix = `<span class="text-blue-600">Danh sách Mẫu Học bạ - GVBM</span> (<span class="text-green-600">${currentCapHoc} - Khối ${currentKhoiLop}</span>)`;
  if (currentRole === "HOC_BA_GVCN")
    titlePrefix = `<span class="text-blue-600">Danh sách Mẫu Học bạ - GVCN</span> (<span class="text-green-600">${currentCapHoc} - Khối ${currentKhoiLop}</span>)`;
  if (currentRole === "HIEU_TRUONG")
    titlePrefix = `<span class="text-blue-600">Danh sách Mẫu Phê duyệt Hiệu trưởng</span> (<span class="text-green-600">${currentCapHoc} - Khối ${currentKhoiLop}</span>)`;

  const platformRadios = document.getElementsByName("configPlatform");
  let isVnedu = false;
  for (const radio of platformRadios) {
    if (radio.checked) {
      isVnedu = radio.value === "vnedu";
      break;
    }
  }

  const isNlPcMode = currentRole === "TH_NLPC";
  const isDgtxMode = currentRole === "DGTX";
  let levels = getEvalLevels(currentCapHoc, isNlPcMode, isDgtxMode, isVnedu, currentMonHoc);
  
  if (currentRole === "HOC_BA_GVCN") {
    // For HOC_BA_GVCN, we only have one category "Nhận xét chung"
    levels = ["Nhận xét chung"];
  }

  levels.forEach((l) => {
    let targetData;
    if (currentRole === "GVBM") {
      const mhKey = getMonHocKey();
      targetData =
        currentData[currentCapHoc][currentKhoiLop].GVBM[mhKey] || {};
    } else if (currentRole === "TH_NLPC") {
      targetData = currentData[currentCapHoc][currentKhoiLop].TH_NLPC || {};
    } else if (currentRole === "DGTX") {
      const mainKey = currentCapHoc === "TH" ? `${currentMonHoc}_${currentTieuChi}` : currentMonHoc;
      const dgtxKey = `${mainKey}_Thang${currentThang}`;
      targetData = currentData[currentCapHoc][currentKhoiLop].DGTX[dgtxKey] || {};
    } else if (currentRole === "HIEU_TRUONG") {
      targetData = currentData[currentCapHoc][currentKhoiLop].HIEU_TRUONG || {};
    } else if (currentRole === "HOC_BA_GVBM") {
      targetData = currentData[currentCapHoc][currentKhoiLop].HOC_BA_GVBM || {};
    } else {
      targetData = currentData[currentCapHoc][currentKhoiLop].HOC_BA_GVCN || {};
    }
    const item = targetData[l] || { min: 0, max: 10, code: "", comments: [] };

    const hideScores = currentRole === "HOC_BA_GVCN";
    const hideMinMax = currentRole === "TH_NLPC" || currentRole === "DGTX";
    const showMucDG = (currentCapHoc === "TH" && currentRole === "GVBM") || currentRole === "TH_NLPC";
    const validCount = (item.comments && item.comments.length > 0 ? item.comments : [""]).filter(c => c.trim().length > 0).length;

    let gridColsClass = "grid-cols-3";
    if (showMucDG) {
      gridColsClass = hideMinMax ? 'grid-cols-2' : 'grid-cols-4';
    } else {
      gridColsClass = 'grid-cols-3';
    }

    if (isVnedu) {
        if (gridColsClass === "grid-cols-4") gridColsClass = "grid-cols-3";
        else if (gridColsClass === "grid-cols-3") gridColsClass = "grid-cols-2";
        else if (gridColsClass === "grid-cols-2") gridColsClass = "grid-cols-1";
    }

    let style = "bg-stone-50 border-stone-200 text-stone-700";
    if (l === "Tốt" || l === "Giỏi" || l === "Hoàn thành Tốt" || l === "T")
      style = "bg-green-50 border-green-200 text-green-700";
    if (l === "Khá" || l === "Hoàn thành" || l === "Đạt" || l === "H") style = "bg-blue-50 border-blue-200 text-blue-700";
    if (l === "Chưa Đạt" || l === "Chưa hoàn thành" || l === "Cần cố gắng" || l === "C") style = "bg-red-50 border-red-200 text-red-700";

    container.innerHTML += `
      <div class="bg-white border text-sm border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div class="${style} px-5 py-3 border-b flex items-center gap-4">
              <span class="px-2.5 py-1 bg-white/50 mix-blend-multiply border border-black/5 rounded-md shadow-sm font-bold uppercase tracking-widest text-[#2f3542] text-xs">${l}</span>
              ${hideScores || currentRole === "DGTX" ? "" : `<span class="text-sm font-medium">Điểm: ${item.min} - ${item.max}</span>`}
              <div class="ml-auto">
                 <span id="count_badge_${l.replace(/ /g, '_')}" class="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-red-600 shadow-sm">${validCount} lời nhận xét</span>
              </div>
          </div>
          
          <div class="p-5 flex flex-col gap-5">
              <div class="grid ${gridColsClass} gap-4" ${hideScores ? 'style="display: none;"' : ""}>
                  <div ${hideMinMax ? 'style="display:none;"' : ''}>
                      <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Điểm TT</label>
                      <input type="number" step="0.1" id="min_${l}" value="${item.min}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 font-mono">
                  </div>
                  <div ${hideMinMax ? 'style="display:none;"' : ''}>
                      <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Điểm TĐ</label>
                      <input type="number" step="0.1" id="max_${l}" value="${item.max}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 font-mono">
                  </div>
                  ${showMucDG ? `
                  <div>
                      <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2" title="Mức độ đánh giá bằng Chữ (VD: T, Đ, C)">Mức Đánh Giá</label>
                      <input type="text" id="mucDG_${l}" value="${item.mucDG || ""}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 font-sans font-medium uppercase" placeholder="T/Đ/C">
                  </div>` : ""}
                  <div ${isVnedu ? 'style="display:none;"' : ''}>
                      <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Mã NX</label>
                      <input type="text" id="code_${l}" value="${item.code || ""}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 font-sans font-medium">
                  </div>
              </div>

              ${hideScores && currentRole === "HOC_BA_GVCN" ? `<div class="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-xs italic">Mục này tự động lấy ngẫu nhiên lời phê mẫu để điền vào Học bạ. Không cần cấu hình điểm.</div>` : ""}
              
              <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Ngân hàng Lời nhận xét</label>
                  <div class="comments-list flex flex-col gap-2">
                     ${(item.comments && item.comments.length > 0 ? item.comments : [""]).map((c) => `
                        <div class="flex gap-2 items-start comment-row">
                          <textarea rows="2" class="comment-input-${l.replace(/ /g, '_')} flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 font-sans leading-relaxed transition-colors placeholder:text-slate-400 custom-scroll min-h-[40px]" placeholder="Nhập lời nhận xét...">${c}</textarea>
                          <button type="button" class="delete-comment-btn p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0 mt-1" title="Xóa">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                          </button>
                        </div>
                     `).join("")}
                  </div>
                  <button type="button" class="add-comment-btn mt-3 text-sm text-blue-600 font-medium hover:underline flex items-center gap-1" data-level="${l}">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
                     Thêm nhận xét
                  </button>
              </div>
          </div>
      </div>
    `;
  });
  if (currentRole === "HOC_BA_GVCN") {
    container.className = "grid grid-cols-1 gap-6 mt-4";
  } else {
    container.className = "grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4";
  }

  // optionally prepend the title block
  const titleDiv = document.createElement("div");
  titleDiv.className =
    (currentRole === "HOC_BA_GVCN" ? "" : "xl:col-span-2 ") + "bg-white border border-slate-200 p-4 rounded-xl shadow-sm font-bold text-slate-800 tracking-wide";
  titleDiv.innerHTML = titlePrefix;
  container.insertBefore(titleDiv, container.firstChild);
}
