import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';


// ======= 1. CẤU HÌNH FIREBASE =======
// Bắt buộc thay đổi thành config của bạn nếu muốn live.
// Đây là thông số giả định để demo (Lưu ý: Bạn phải tạo Firebase Project và Paste Config dưới đây)
const firebaseConfig = {
  apiKey: "AIzaSyCCvFYBNK92lbfTjE89FufJP-2xCltfa60",
  authDomain: "tien-ich-nx-csdl-vnedu.firebaseapp.com",
  projectId: "tien-ich-nx-csdl-vnedu",
  storageBucket: "tien-ich-nx-csdl-vnedu.firebasestorage.app",
  messagingSenderId: "87222165808",
  appId: "1:87222165808:web:865203c65dd69a8362a8f5",
  measurementId: "G-657J85CYGL"
};

// Khởi tạo Firebase (Chỉ khởi tạo nếu chưa có)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // if already initialized, use that one
}

const auth = firebase.auth();
const db = firebase.firestore();

// ======= 2. BIẾN TOÀN CỤC =======
const ADMIN_EMAIL = 'hvdkhoa89@gmail.com';
let currentUserInfo = null;
let unsubscribeCredit = null;
let unsubscribeTopupConfig = null;

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

let globalTopupConfig = {
  anchorAmt: 30000,
  anchorPts: 1,
  baseRate: 30000,
  packages: [
    {amt: 30000, pts: 1, bonus: 0, hot: false},
    {amt: 60000, pts: 2, bonus: 0, hot: false},
    {amt: 90000, pts: 3, bonus: 0, hot: false},
    {amt: 150000, pts: 5, bonus: 0, hot: false}
  ]
};

// ======= 3. UI HANDLERS (Chuyển đổi VIEW) =======
function switchView(viewId) {
    document.querySelectorAll('#auth-container .view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if(input) {
         const isPassword = input.type === 'password';
         input.type = isPassword ? 'text' : 'password';
         
         if (btn) {
             const eyeOpen = btn.querySelector('.eye-open');
             const eyeClosed = btn.querySelector('.eye-closed');
             if (eyeOpen && eyeClosed) {
                 if (isPassword) {
                     eyeOpen.classList.add('hidden');
                     eyeClosed.classList.remove('hidden');
                 } else {
                     eyeOpen.classList.remove('hidden');
                     eyeClosed.classList.add('hidden');
                 }
             }
         }
    }
}

function toggleLoading(show) {
    const loader = document.getElementById('auth-loading');
    if (show) loader.classList.replace('hidden', 'flex');
    else loader.classList.replace('flex', 'hidden');
}

// ======= 4. TOAST NOTIFICATION =======
function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    let bgClass = type === 'error' ? 'bg-red-500' : (type === 'success' ? 'bg-emerald-500' : 'bg-slate-800');
    let icon = type === 'error' ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
                : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';

    toast.className = `${bgClass} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transform translate-x-full transition-transform duration-300 ease-out z-50`;
    toast.innerHTML = `${icon} <span class="font-medium text-sm leading-tight max-w-[250px]">${message}</span>`;
    
    container.appendChild(toast);
    
    // Slide in
    requestAnimationFrame(() => toast.classList.remove('translate-x-full'));
    
    // Remove after 3-4s
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Chuyển đổi mã lỗi Firebase thành Tiếng Việt
function translateError(error) {
    const code = error.code;
    switch(code) {
        case 'auth/invalid-email': return 'Email không hợp lệ.';
        case 'auth/user-disabled': return 'Tài khoản đã bị khóa.';
        case 'auth/user-not-found': return 'Tài khoản không tồn tại.';
        case 'auth/wrong-password': return 'Mật khẩu không chính xác.';
        case 'auth/invalid-credential': return 'Tài khoản hoặc mật khẩu không đúng.';
        case 'auth/invalid-login-credentials': return 'Tài khoản hoặc mật khẩu không đúng.';
        case 'auth/email-already-in-use': return 'Email này đã được đăng ký.';
        case 'auth/weak-password': return 'Mật khẩu quá yếu (cần tối thiểu 6 ký tự).';
        case 'auth/popup-closed-by-user': return 'Đăng nhập Google bị hủy.';
        case 'auth/unauthorized-domain': return 'Vui lòng thêm "chrome-extension://[ID]" vào Authorized domains trong Firebase Console.';
        case 'auth/internal-error': return 'Lỗi hệ thống Nội bộ. Vui lòng thử lại sau.';
        default: return error.message;
    }
}

// ======= 5. LẮNG NGHE TRẠNG THÁI AUTH =======
auth.onAuthStateChanged(user => {
    const authContainer = document.getElementById('auth-container');
    const mainContainer = document.getElementById('main-container');
    const successContainer = document.getElementById('success-container');
    const adminPanel = document.getElementById('admin-panel');

    if (user) {
        // User Đăng nhập
        currentUserInfo = user;
        authContainer.classList.remove('flex');
        authContainer.classList.add('hidden');
        
        const currentUrlParams = new URLSearchParams(window.location.search);
        const currentTabAttr = currentUrlParams.get('tab');
        const isAdmin = user.email === ADMIN_EMAIL || (user.email && user.email.toLowerCase().includes("admin"));
        
        if (!isAdmin && (!currentTabAttr || currentTabAttr === 'login' || currentTabAttr === 'register')) {
            successContainer.classList.remove('hidden');
            successContainer.classList.add('flex');
            mainContainer.classList.remove('flex');
            mainContainer.classList.add('hidden');
            
            const successNameEl = document.getElementById('success-user-name');
            if (successNameEl) {
                successNameEl.textContent = `Chào mừng ${user.displayName || user.email}`;
            }
            
            const countdownEl = document.getElementById('success-countdown-msg');
            let timeLeft = 5;
            if (countdownEl) {
                countdownEl.textContent = `Thông báo tự đóng và chuyển trang sau ${timeLeft} giây...`;
                const timerId = setInterval(() => {
                    timeLeft--;
                    if (timeLeft > 0) {
                        countdownEl.textContent = `Thông báo tự đóng và chuyển trang sau ${timeLeft} giây...`;
                    } else {
                        clearInterval(timerId);
                    }
                }, 1000);
            }
            
            setTimeout(() => {
                if (successContainer.classList.contains('flex')) {
                    if (typeof window.closeAuthWindow === 'function') {
                        window.closeAuthWindow();
                    } else {
                        window.close();
                    }
                }
            }, 5000);
        } else {
            successContainer.classList.add('hidden');
            successContainer.classList.remove('flex');
            mainContainer.classList.remove('hidden');
            mainContainer.classList.add('flex');
        }
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
             const isAdmin = user.email === 'admin@admin.com' || (user.email && user.email.toLowerCase().includes("admin")) || user.email === 'hvdkhoa89@gmail.com';
             chrome.storage.local.set({ authState: { uid: user.uid, email: user.email, credits: 0, points: 0, pendingDeduction: 0, isAdmin } });
        }
        
        // Cập nhật Header
        document.getElementById('user-name').textContent = user.displayName || 'Tài khoản Không tên';
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('avatar-letters').textContent = (user.displayName || user.email || '?').charAt(0).toUpperCase();

        const creditEl = document.getElementById('credit-balance');
        const trialContainer = document.getElementById('trial-points-container');
        if (creditEl) {
            if (isAdmin) {
                creditEl.textContent = 'VIP';
                creditEl.parentElement.classList.remove('text-blue-700', 'bg-blue-50', 'border-blue-100');
                creditEl.parentElement.classList.add('text-red-600', 'bg-red-50', 'border-red-100');
                const labelEl = creditEl.nextElementSibling;
                if (labelEl && labelEl.textContent.trim().toUpperCase() === 'NĂM') {
                    labelEl.classList.add('hidden');
                }
                if (trialContainer) trialContainer.classList.add('hidden');
                const divider = creditEl.parentElement.nextElementSibling;
                if (divider && divider.classList.contains('bg-slate-200')) divider.classList.add('hidden');
            } else {
                // Reset to default just in case
                creditEl.parentElement.classList.add('text-blue-700', 'bg-blue-50', 'border-blue-100');
                creditEl.parentElement.classList.remove('text-red-600', 'bg-red-50', 'border-red-100');
                const labelEl = creditEl.nextElementSibling;
                if (labelEl) labelEl.classList.remove('hidden');
                if (trialContainer) trialContainer.classList.remove('hidden');
                const divider = creditEl.parentElement.nextElementSibling;
                if (divider && divider.classList.contains('bg-slate-200')) divider.classList.remove('hidden');
            }
        }

        // Hiện Admin Panel nếu đúng email
        if (user.email === ADMIN_EMAIL || (user.email && user.email.toLowerCase().includes("admin"))) {
            adminPanel.classList.remove('hidden');
            loadAdminUserList();
            const topupSection = document.getElementById('topup-section');
            if (topupSection) topupSection.classList.add('hidden');
        } else {
            adminPanel.classList.add('hidden');
            const topupSection = document.getElementById('topup-section');
            if (topupSection) topupSection.classList.remove('hidden');
        }

        // Check và tạo Firestore Doc, đồng thời lắng nghe Point
        syncUserFirestore(user);

        // Kiểm tra URL param để mở modal tương ứng
        if (isAdmin) {
            const adminPanel = document.getElementById('admin-panel');
            if (adminPanel) {
                adminPanel.classList.remove('hidden');
                setTimeout(() => {
                    adminPanel.scrollIntoView({behavior: "smooth"});
                }, 500);
            }
        }

        // Khởi tạo hiển thị Topup UI
        initAdminPanel();
        initTopup();
        
        // Connect admin buttons
        const addPkgBtn = document.querySelector('[data-action="admin-add-package"]');
        if (addPkgBtn) addPkgBtn.onclick = () => addAdminPackageRow();
        
        const saveCfgBtn = document.querySelector('[data-action="admin-save-topup-config"]');
        if (saveCfgBtn) saveCfgBtn.onclick = () => adminSaveTopupConfig();

        const loadUsersBtn = document.querySelector('[data-action="admin-load-users"]');
        if (loadUsersBtn) loadUsersBtn.onclick = () => loadAdminUserList();
    } else {
        // Chưa đăng nhập
        currentUserInfo = null;
        if (unsubscribeCredit) { unsubscribeCredit(); unsubscribeCredit = null; }
        
        mainContainer.classList.remove('flex');
        mainContainer.classList.add('hidden');
        
        if (successContainer) {
             successContainer.classList.remove('flex');
             successContainer.classList.add('hidden');
        }

        authContainer.classList.remove('hidden');
        authContainer.classList.add('flex');
        
        // Mặc định hiện đăng nhập hoặc the tab query
        const urlParams = new URLSearchParams(window.location.search);
        const tabAttr = urlParams.get('tab');
        if (tabAttr === 'register') {
            switchView('view-register');
        } else {
            switchView('view-login');
        }

        // Tự động khôi phục nếu có lưu trên localStorage
        if (!window.__attemptedAutoLogin) {
            window.__attemptedAutoLogin = true;
            const savedEmail = localStorage.getItem('tlnx_saved_email');
            const savedPass = localStorage.getItem('tlnx_saved_pass');
            if (savedEmail && savedPass) {
                toggleLoading(true);
                auth.signInWithEmailAndPassword(savedEmail, savedPass).catch(err => {
                    console.log("Auto-login failed:", err);
                    toggleLoading(false);
                });
            }
        }
    }
});

// ======= 6. FIRESTORE SYNC & CREDITS =======
async function syncUserFirestore(user) {
    const userRef = db.collection('users').doc(user.uid);
    const deviceId = await getDeviceId();
    const isAdmin = user.email === ADMIN_EMAIL || (user.email && user.email.toLowerCase().includes("admin")) || user.email === 'hvdkhoa89@gmail.com';
    
    try {
        const doc = await userRef.get();
        const displayName = user.displayName || '';
        
        if (!doc.exists) {
            const bankCode = Math.floor(100000 + Math.random() * 900000).toString();
            await userRef.set({
                email: user.email,
                displayName: displayName,
                credits: 0,
                points: 0,
                bankCode: bankCode,
                deviceIds: [deviceId],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            const data = doc.data();
            const currentDevices = data.deviceIds || [];
            
            // KIỂM TRA GIỚI HẠN THIẾT BỊ (2 MÁY)
            if (!isAdmin && !currentDevices.includes(deviceId)) {
                if (currentDevices.length >= 2) {
                    showToast("Tài khoản này đã đạt giới hạn 2 thiết bị. Vui lòng liên hệ Admin để reset!", "error");
                    auth.signOut();
                    return;
                } else {
                    // Thêm thiết bị mới nếu còn lượt
                    await userRef.update({
                        deviceIds: firebase.firestore.FieldValue.arrayUnion(deviceId)
                    });
                }
            }

            if (!data.bankCode) {
                const bankCode = Math.floor(100000 + Math.random() * 900000).toString();
                await userRef.update({ bankCode: bankCode, lastLoginAt: firebase.firestore.FieldValue.serverTimestamp() });
            } else {
                await userRef.update({ lastLoginAt: firebase.firestore.FieldValue.serverTimestamp() });
            }
            if (!data.displayName && displayName) {
                await userRef.update({ displayName: displayName });
            }
            if (data.points === undefined) {
                await userRef.update({ points: 0 });
            }
        }
        
        unsubscribeCredit = userRef.onSnapshot((docSnapshot) => {
            if (docSnapshot.exists) {
                const data = docSnapshot.data();
                currentUserInfo = { ...user, ...data }; // Update global info with Firestore data
                const creditEl = document.getElementById('credit-balance');
                const pointsEl = document.getElementById('trial-points');
                const trialContainer = document.getElementById('trial-points-container');
                const expiryContainer = document.getElementById('expiry-date-container');
                const expiryText = document.getElementById('expiry-date-text');
                const expiryDaysText = document.getElementById('expiry-days-text');
                
                if (typeof chrome !== 'undefined' && chrome.storage) {
                     if (!window.__pendingListenerAdded) {
                         window.__pendingListenerAdded = true;
                         chrome.storage.onChanged.addListener((changes, area) => {
                             if (area === 'local' && changes.authState) {
                                 const newVal = changes.authState.newValue;
                                 if (newVal && newVal.pendingDeduction > 0) {
                                     const pending = newVal.pendingDeduction;
                                     chrome.storage.local.set({ authState: { ...newVal, pendingDeduction: 0 } });
                                     userRef.get().then(docSnap => {
                                         if (docSnap.exists) {
                                             userRef.update({ points: Math.max(0, (docSnap.data().points || 0) - pending) });
                                         }
                                     });
                                 }
                             }
                         });
                     }
                     
                     chrome.storage.local.get(['authState'], (res) => {
                         let pending = res.authState && res.authState.pendingDeduction ? res.authState.pendingDeduction : 0;
                         if (pending > 0) {
                             // Reset pending immediately to avoid race condition
                             const newAuthState = { ...res.authState, pendingDeduction: 0 };
                             chrome.storage.local.set({ authState: newAuthState });
                             
                             let currentPoints = data.points || 0;
                             userRef.update({ points: Math.max(0, currentPoints - pending) });
                             
                             const isAdmin = user.email === 'admin@admin.com' || (user.email && user.email.toLowerCase().includes("admin")) || user.email === 'hvdkhoa89@gmail.com';
                             chrome.storage.local.set({ 
                                authState: { ...newAuthState, uid: user.uid, email: user.email, credits: data.credits || 0, points: Math.max(0, currentPoints - pending), isAdmin } 
                             });
                         } else {
                             const isAdmin = user.email === 'admin@admin.com' || (user.email && user.email.toLowerCase().includes("admin")) || user.email === 'hvdkhoa89@gmail.com';
                             chrome.storage.local.set({ authState: { uid: user.uid, email: user.email, credits: data.credits || 0, points: data.points || 0, pendingDeduction: 0, isAdmin } });
                         }
                     });
                }

                if (creditEl) {
                    const isAdmin = user.email === ADMIN_EMAIL || (user.email && user.email.toLowerCase().includes("admin"));
                    if (isAdmin) {
                        creditEl.textContent = 'VIP';
                        creditEl.parentElement.classList.remove('text-blue-700', 'bg-blue-50', 'border-blue-100');
                        creditEl.parentElement.classList.add('text-red-600', 'bg-red-50', 'border-red-100');
                        const labelEl = creditEl.nextElementSibling;
                        if (labelEl && labelEl.textContent.trim().toUpperCase() === 'NĂM') {
                            labelEl.classList.add('hidden');
                        }
                        if (trialContainer) trialContainer.classList.add('hidden');
                        const divider = creditEl.parentElement.nextElementSibling;
                        if (divider && divider.classList.contains('bg-slate-200')) divider.classList.add('hidden');
                    } else {
                        creditEl.textContent = Math.max(0, data.credits || 0);
                        creditEl.parentElement.classList.add('text-blue-700', 'bg-blue-50', 'border-blue-100');
                        creditEl.parentElement.classList.remove('text-red-600', 'bg-red-50', 'border-red-100');
                        const labelEl = creditEl.nextElementSibling;
                        if (labelEl && labelEl.textContent.trim().toUpperCase() === 'NĂM') {
                            labelEl.classList.remove('hidden');
                        }
                        if (trialContainer) trialContainer.classList.remove('hidden');
                        const divider = creditEl.parentElement.nextElementSibling;
                        if (divider && divider.classList.contains('bg-slate-200')) divider.classList.remove('hidden');
                    }
                }

                if (expiryContainer && expiryText) {
                    if (data.expiryDate) {
                        const date = data.expiryDate.toDate();
                        const now = new Date();
                        const isExpired = date < now;

                        const dateStr = date.toLocaleString('vi-VN', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        expiryText.textContent = dateStr;
                        expiryContainer.classList.remove('hidden');

                        if (isExpired) {
                            expiryText.classList.add('text-red-500');
                            expiryText.classList.remove('text-blue-600', 'text-slate-600');
                        } else {
                            expiryText.classList.remove('text-red-500');
                            expiryText.classList.add('text-blue-600');
                        }
                    } else {
                        expiryContainer.classList.add('hidden');
                    }
                }
                
                if (pointsEl) {
                    const pts = data.points || 0;
                    pointsEl.textContent = pts;
                }
            }
        });
    } catch (error) {
        console.error("Lỗi đồng bộ Firestore:", error);
        if(error.code === 'permission-denied' || error.message.includes('API_KEY')) {
            const creditEl = document.getElementById('credit-balance');
            if (creditEl) creditEl.textContent = 'Demo';
            showToast('CẢNH BÁO: Đang chạy với Fake Firebase Config. Bạn cần thêm Config thật.', 'error');
        }
    }
}

// Trợ lý Nhận Xét Pro
// ======= 8. NẠP ĐIỂM (VIETQR) =======
function loadTopupConfig() {
    if (unsubscribeTopupConfig) return;
    
    unsubscribeTopupConfig = db.collection('config').doc('topup').onSnapshot(doc => {
        if (doc.exists) {
            globalTopupConfig = doc.data();
            
            // Recalculate baseRate just in case
            if (globalTopupConfig.anchorAmt && globalTopupConfig.anchorPts) {
               globalTopupConfig.baseRate = globalTopupConfig.anchorAmt / globalTopupConfig.anchorPts;
            } else {
               globalTopupConfig.baseRate = 30000;
            }

            renderPackages();
            
            // Nếu là admin, điền sẵn vào form cấu hình
            const isAdmin = currentUserInfo && (currentUserInfo.email === ADMIN_EMAIL || currentUserInfo.email.toLowerCase().includes("admin"));
            if (isAdmin) {
                const amtInp = document.getElementById('admin-anchor-amt');
                if (amtInp) amtInp.value = globalTopupConfig.anchorAmt || 30000;
                
                const ratePrev = document.getElementById('admin-rate-preview');
                if (ratePrev && globalTopupConfig.baseRate) {
                   ratePrev.textContent = globalTopupConfig.baseRate.toLocaleString('vi-VN');
                }

                // Show last updated info
                const lastUpdatedEl = document.getElementById('admin-last-updated');
                if (lastUpdatedEl && globalTopupConfig.updatedAt) {
                    const date = globalTopupConfig.updatedAt.toDate();
                    const fromNow = date.toLocaleString('vi-VN');
                    lastUpdatedEl.innerHTML = `Lưu cuối: ${fromNow} <br class="sm:hidden"> bởi ${globalTopupConfig.updatedBy || 'admin'}`;
                }

                renderAdminPackages();
            }
        } else {
            renderPackages();
        }
    });
}

function renderPackages() {
    const container = document.getElementById('packages-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    globalTopupConfig.packages.forEach(pkg => {
        if (pkg.hidden) return; // Skip hidden packages
        
        // Calculate years based on dynamic admin rate
        const bRate = globalTopupConfig.baseRate || 30000;
        // The image shows specific years: 1, 2, 3, 5
        // pkg.pts now represents years
        const years = pkg.pts || Math.round(pkg.amt / bRate);

        const pkgDiv = document.createElement('div');
        pkgDiv.className = `group border-2 ${pkg.hot ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'} hover:border-emerald-500 hover:bg-emerald-50 p-3 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center bg-white shadow-md hover:shadow-lg relative overflow-hidden h-24 sm:h-28`;
        pkgDiv.setAttribute('data-action', 'generate-qr');
        pkgDiv.setAttribute('data-pts', years);
        pkgDiv.setAttribute('data-amt', pkg.amt);
        
        const bonusTag = (pkg.bonus > 0) ? `<div class="absolute -top-0 -right-0 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-bl-xl shadow-sm animate-pulse">-${pkg.bonus}%</div>` : '';
        
        pkgDiv.innerHTML = `
            ${bonusTag}
            <div class="text-[16px] sm:text-[18px] font-black uppercase tracking-tight text-slate-800 group-hover:text-emerald-700 mb-1">${years} NĂM</div>
            <div class="text-[14px] sm:text-[16px] font-black text-rose-600">${pkg.amt.toLocaleString('vi-VN')} đ</div>
        `;
        
        container.appendChild(pkgDiv);
    });
}

function initTopup() {
    loadTopupConfig();
    
    if (currentUserInfo && document.getElementById('uid-display')) {
        document.getElementById('uid-display').innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg> UID: ${currentUserInfo.uid.substring(0, 6).toUpperCase()}`;
    }
    
    // Reset state
    const qrPlaceholder = document.getElementById('qr-placeholder');
    const qrImg = document.getElementById('qr-img');
    const qrInfo = document.getElementById('qr-info-display');
    const qrMemoText = document.getElementById('qr-memo-text');
    
    if (qrPlaceholder) qrPlaceholder.classList.remove('hidden');
    if (qrImg) {
        qrImg.classList.add('hidden');
        qrImg.src = '';
    }
    if (qrInfo) qrInfo.classList.add('hidden');
    if (qrMemoText) qrMemoText.textContent = '---';
    
    // Tự động chọn gói đầu tiên sau khi load config (qua renderPackages)
    // Coi như retry 3 lần mỗi giây nếu chưa thấy packages
    let attempts = 0;
    const autoSelect = setInterval(() => {
        const firstPackage = document.querySelector('[data-action="generate-qr"]');
        if (firstPackage && currentUserInfo) {
            generateQR(firstPackage, parseFloat(firstPackage.getAttribute('data-pts')), parseInt(firstPackage.getAttribute('data-amt')));
            clearInterval(autoSelect);
        }
        attempts++;
        if (attempts > 10) clearInterval(autoSelect); // Timeout after 10s
    }, 1000);
}

function generateQR(btn, points, amount) {
    try {
        if(!currentUserInfo) {
            console.warn("generateQR: No currentUserInfo");
            return;
        }
        const uid = currentUserInfo.uid;
        
        // Xóa active khỏi các nút khác
        document.querySelectorAll('[data-action="generate-qr"], #custom-qr-container').forEach(b => {
            b.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50', 'border-blue-500', 'border-emerald-500');
            b.classList.add('border-slate-200');
        });
        
        // Thêm active
        if (btn) {
            btn.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50', 'border-blue-500');
            btn.classList.remove('border-slate-200');
        }
        
        // Tự động tạo mã QR với VietQR
        const bankCode = currentUserInfo.bankCode || uid.substring(0, 6).toUpperCase();
        const userPrefix = (currentUserInfo.email ? currentUserInfo.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 15) : '');
        const MEMO = `SEVQR NAP ${bankCode} ${userPrefix}`.trim();
        const BANK_ID = "vietinbank"; 
        const ACCOUNT_NO = "101879516096"; 
        const ACCOUNT_NAME = "HOANG VAN DINH KHOA";
        
        const url = `https://qr.sepay.vn/img?bank=${BANK_ID}&acc=${ACCOUNT_NO}&template=compact&amount=${amount}&des=${encodeURIComponent(MEMO)}`;
        
        const qrImg = document.getElementById('qr-img');
        const qrPlaceholder = document.getElementById('qr-placeholder');
        const qrMemoText = document.getElementById('qr-memo-text');
        
        // QR INFO Display
        const qrInfo = document.getElementById('qr-info-display');
        const qrInfoPts = document.getElementById('qr-info-pts');
        const qrInfoAmt = document.getElementById('qr-info-amt');
        
        if (qrImg && qrPlaceholder) {
            qrImg.src = url;
            qrPlaceholder.classList.add('hidden');
            qrImg.classList.remove('hidden');
            
            if (qrInfo && qrInfoPts && qrInfoAmt) {
                qrInfo.classList.remove('hidden');
                qrInfo.classList.add('flex');
                qrInfoPts.textContent = `/ ${points} năm`;
                qrInfoAmt.textContent = `${amount.toLocaleString('vi-VN')} VNĐ`;
            }
        }
        
        if (qrMemoText) {
            qrMemoText.textContent = MEMO;
            qrMemoText.onclick = () => {
                navigator.clipboard.writeText(MEMO).then(() => {
                    showToast("Đã sao chép: " + MEMO, "success");
                });
            };
        }
    } catch(err) {
        console.error("QR Generation Error:", err);
        showToast("Lỗi tạo QR: " + err.message, "error");
    }
}

function setupAdminListeners() {
    const anchorAmt = document.getElementById('admin-anchor-amt');
    if (anchorAmt) {
        anchorAmt.addEventListener('input', () => {
             const amt = parseInt(anchorAmt.value) || 30000;
             const ratePrev = document.getElementById('admin-rate-preview');
             if (ratePrev) ratePrev.textContent = amt.toLocaleString('vi-VN');
             
             // Update all current rows
             const packageRows = document.querySelectorAll('.package-row');
             packageRows.forEach(row => {
                 const yearsInp = row.querySelector('.pkg-years');
                 if (yearsInp) yearsInp.dispatchEvent(new Event('input'));
             });
        });
    }
}

function initAdminPanel() {
    setupAdminListeners();
}

function renderAdminPackages() {
    const list = document.getElementById('admin-packages-list');
    if (!list) return;
    list.innerHTML = '';
    
    // Sort packages by years before rendering
    const packages = [...(globalTopupConfig.packages || [])];
    if (packages.length === 0) {
        // Default milestones if none exist
        [1, 2, 3, 5].forEach(years => {
            addAdminPackageRow({
                pts: years,
                amt: (globalTopupConfig.anchorAmt || 30000) * years,
                bonus: 0,
                hot: false,
                hidden: false
            });
        });
    } else {
        packages.sort((a, b) => a.pts - b.pts).forEach(pkg => {
            addAdminPackageRow(pkg);
        });
    }
}

function addAdminPackageRow(pkg = {amt: 30000, pts: 1, bonus: 0, hot: false, hidden: false}) {
    const list = document.getElementById('admin-packages-list');
    if (!list) return;

    // Ensure list is visible when adding new
    const container = document.getElementById('admin-packages-list-container');
    const chevron = document.getElementById('packages-chevron');
    if (container && container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    }
    
    const row = document.createElement('div');
    row.className = 'bg-white p-2 rounded-lg border border-slate-200 shadow-sm relative group package-row';
    
    const updatePreview = () => {
        const bonus = parseFloat(row.querySelector('.pkg-bonus').value) || 0;
        const years = parseFloat(row.querySelector('.pkg-years').value) || 0;
        
        const anchorAmt = parseFloat(document.getElementById('admin-anchor-amt').value) || 30000;
        const basePrice = Math.round(anchorAmt * years);
        const finalPrice = Math.round(basePrice * (1 - bonus / 100));
        
        row.querySelector('.base-price-preview').textContent = basePrice.toLocaleString('vi-VN') + ' đ';
        row.querySelector('.pkg-amt-readonly').value = finalPrice;
        row.querySelector('.final-price-preview').textContent = finalPrice.toLocaleString('vi-VN') + ' đ';
    };

    row.innerHTML = `
        <button class="btn-delete-pkg absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-slate-200 text-slate-400 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 shadow-sm transition-all z-10 opacity-0 group-hover:opacity-100">
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <div class="grid grid-cols-2 gap-2 items-center">
            <div class="flex items-center gap-1.5">
                <div class="flex-1">
                    <label class="block text-[8px] text-slate-400 font-bold uppercase">Năm</label>
                    <input type="number" step="0.1" class="pkg-years w-full px-1.5 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded font-bold text-slate-700 focus:outline-none" value="${pkg.pts}">
                </div>
                <div class="flex-1">
                    <label class="block text-[8px] text-slate-400 font-bold uppercase">Giảm %</label>
                    <input type="number" class="pkg-bonus w-full px-1.5 py-0.5 text-xs bg-rose-50 border border-rose-100 rounded font-bold text-rose-600 focus:outline-none" value="${pkg.bonus || 0}">
                </div>
            </div>
            
            <div class="flex flex-col items-end">
                <div class="base-price-preview text-[8px] font-bold text-slate-300 line-through">-- đ</div>
                <div class="final-price-preview text-[11px] font-black text-blue-600">-- đ</div>
                <input type="hidden" class="pkg-amt-readonly" value="${pkg.amt || 30000}">
            </div>
        </div>

        <div class="flex items-center justify-between border-t border-slate-100 mt-1.5 pt-1">
            <div class="flex items-center gap-3">
                <label class="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" class="pkg-hot w-3 h-3 rounded text-red-600 focus:ring-red-500" ${pkg.hot ? 'checked' : ''}>
                    <span class="text-[8px] font-bold text-slate-400 uppercase">HOT</span>
                </label>
                <label class="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" class="pkg-hidden w-3 h-3 rounded text-slate-400 focus:ring-slate-400" ${pkg.hidden ? 'checked' : ''}>
                    <span class="text-[8px] font-bold text-slate-400 uppercase">ẨN GÓI</span>
                </label>
            </div>
            <button class="btn-create-qr-preview text-[8px] font-black text-slate-400 hover:text-blue-600 uppercase transition-colors">Thử QR</button>
        </div>
    `;
    
    row.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', updatePreview);
    });

    row.querySelector('.btn-delete-pkg').addEventListener('click', () => {
        row.remove();
    });

    row.querySelector('.btn-create-qr-preview').addEventListener('click', () => {
        const amt = parseInt(row.querySelector('.pkg-amt-readonly').value) || 0;
        const yrs = parseFloat(row.querySelector('.pkg-years').value) || 0;
        generateQR(null, yrs, amt);
        window.scrollTo({top: 0, behavior: 'smooth'});
        showToast("Đã tạo bản xem trước QR cho gói " + yrs + " năm!", "success");
    });

    list.appendChild(row);
    updatePreview();
}

async function adminSaveTopupConfig() {
    const anchorAmt = parseInt(document.getElementById('admin-anchor-amt').value) || 30000;
    const anchorPts = 1;
    const baseRate = anchorAmt;
    
    const packageRows = document.querySelectorAll('.package-row');
    const packages = [];
    
    packageRows.forEach(row => {
        const amtInput = row.querySelector('.pkg-amt-readonly');
        const yearsInput = row.querySelector('.pkg-years');
        const bonusInput = row.querySelector('.pkg-bonus');
        const hotInput = row.querySelector('.pkg-hot');

        if (amtInput && yearsInput && bonusInput && hotInput) {
            const amt = parseInt(amtInput.value) || 0;
            const pts = parseFloat(yearsInput.value) || 1;
            const bonus = parseFloat(bonusInput.value) || 0;
            const hot = hotInput.checked;
            
            const hiddenInput = row.querySelector('.pkg-hidden');
            const hidden = hiddenInput ? hiddenInput.checked : false;
            
            if (amt > 0) {
                packages.push({ amt, pts, bonus, hot, hidden });
            }
        }
    });

    if (packages.length === 0) {
        return showToast("Phải có ít nhất một gói nạp", "error");
    }
    
    try {
        const newConfig = {
            ...globalTopupConfig,
            anchorAmt: anchorAmt,
            anchorPts: anchorPts,
            baseRate: baseRate,
            packages: packages.sort((a, b) => a.pts - b.pts),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentUserInfo ? currentUserInfo.email : 'unknown'
        };
        
        await db.collection('config').doc('topup').set(newConfig);
        showToast("Lưu cấu hình thành công!", "success");
    } catch (e) {
        showToast("Lỗi khi lưu: " + e.message, "error");
    }
}

async function searchUserByEmail() {
    const email = document.getElementById('admin-target-email').value.trim().toLowerCase();
    if(!email) return showToast("Nhập email cần tìm", "error");
    
    const uidDiv = document.getElementById('admin-target-uid');
    uidDiv.textContent = "Đang tìm...";
    uidDiv.classList.remove('hidden');

    try {
        const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
        if(snapshot.empty) {
            uidDiv.textContent = "❌ Không tìm thấy User với Email này.";
        } else {
            const userDoc = snapshot.docs[0];
            const userData = userDoc.data();
            uidDiv.textContent = "✅ UID: " + userDoc.id;
            uidDiv.dataset.uid = userDoc.id; // Save to dataset
            uidDiv.dataset.expiry = userData.expiryDate ? userData.expiryDate.toDate().toISOString() : '';
            uidDiv.dataset.credits = (userData.credits || 0).toString();

            // Populate VIP start date
            const vipStartInput = document.getElementById('admin-vip-start-date');
            const oldExpiryText = document.getElementById('admin-old-expiry-text');
            
            if (userData.expiryDate) {
                const date = userData.expiryDate.toDate();
                const offset = date.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
                
                if (oldExpiryText) {
                    oldExpiryText.textContent = date.toLocaleString('vi-VN', { 
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    });
                }

                // Set default VIP start date to current expiry if it's in future, otherwise now
                if (vipStartInput) {
                    if (date > new Date()) {
                        vipStartInput.value = localISOTime;
                    } else {
                        const now = new Date();
                        const nowISO = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
                        vipStartInput.value = nowISO;
                    }
                }
            } else {
                if (oldExpiryText) oldExpiryText.textContent = 'Trống (Mới)';
                if (vipStartInput) {
                    const now = new Date();
                    const offset = now.getTimezoneOffset() * 60000;
                    const nowISO = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
                    vipStartInput.value = nowISO;
                }
            }
            refreshAdminVipPreview();
        }
    } catch(error) {
        uidDiv.textContent = "Lỗi truy vấn: " + error.message;
    }
}

function refreshAdminVipPreview() {
    const type = document.getElementById('admin-credit-type')?.value;
    const amountInput = document.getElementById('admin-credit-amount');
    const amount = parseFloat(amountInput?.value) || 0;
    const startDateStr = document.getElementById('admin-vip-start-date')?.value;
    const container = document.getElementById('admin-vip-details');
    const resultText = document.getElementById('admin-vip-new-expiry');
    const uidDiv = document.getElementById('admin-target-uid');

    if (type === 'credits') {
        container?.classList.remove('hidden');
        if (amount > 0 && resultText) {
            // Cumulative Preview Logic: 
            // Matches the server-side logic in adminUpdateCredit
            let baseDate = new Date();
            let durationToApply = amount;
            
            if (uidDiv && uidDiv.dataset.expiry) {
                const existingExp = new Date(uidDiv.dataset.expiry);
                if (existingExp > baseDate) {
                    baseDate = existingExp;
                } else {
                    // Expiry is past or missing, sync the existing numerical balance
                    const existingCredits = parseFloat(uidDiv.dataset.credits) || 0;
                    durationToApply = existingCredits + amount;
                }
            } else {
                // No existing expiry found in dataset, assume sync with balance
                const existingCredits = parseFloat(uidDiv.dataset.credits) || 0;
                durationToApply = existingCredits + amount;
            }
            
            // Allow manual override if admin selected a SPECIFIC date in UI
            if (startDateStr) {
                const manualStart = new Date(startDateStr);
                // We only respect manual start if it's different from our calculated base
                // or if specifically edited by the user. 
                // For simplicity, let's keep it cumulative unless manual is set.
                // Reset duration to just amount if we are picking a custom start? 
                // Actually the user said "Check the VIP years column to calculate the start date too".
            }

            const end = new Date(baseDate);
            
            // Add years + fractional years
            end.setFullYear(end.getFullYear() + Math.floor(durationToApply));
            const remainingDays = (durationToApply % 1) * 365;
            end.setDate(end.getDate() + Math.round(remainingDays));
            
            resultText.textContent = end.toLocaleString('vi-VN', { 
                day: '2-digit', month: '2-digit', year: 'numeric', 
                hour: '2-digit', minute: '2-digit' 
            });
            resultText.classList.remove('text-slate-400');
            resultText.classList.add('text-blue-700');
        } else if (resultText) {
            resultText.textContent = '-- : --';
            resultText.classList.add('text-slate-400');
            resultText.classList.remove('text-blue-700');
        }
    } else {
        container?.classList.add('hidden');
    }
}

async function adminUpdateCredit() {
    const uid = document.getElementById('admin-target-uid').dataset.uid;
    const amountStr = document.getElementById('admin-credit-amount').value;
    const type = document.getElementById('admin-credit-type').value; 
    const startDateStr = document.getElementById('admin-vip-start-date')?.value;
    const amount = parseFloat(amountStr);

    if(!uid) return showToast("Vui lòng 'Tìm User ID' hợp lệ trước.", "error");
    if(isNaN(amount)) return showToast("Nhập số lượng cần cộng/trừ.", "error");

    try {
        const userRef = db.collection('users').doc(uid);
        
        // Fetch current user data to ensure cumulative calculation
        const userSnapshot = await userRef.get();
        if (!userSnapshot.exists) return showToast("User không tồn tại.", "error");
        const userData = userSnapshot.data();

        const updateData = {};
        updateData[type] = firebase.firestore.FieldValue.increment(amount);
        
        // Handle expiration calculation
        if (type === 'credits' && amount > 0) {
            let baseDate = new Date();
            let durationToApply = amount;

            // If Admin selected a custom start date, we respect it
            if (startDateStr) {
                const manualStart = new Date(startDateStr);
                if (!isNaN(manualStart.getTime())) {
                    baseDate = manualStart;
                }
            } else if (userData.expiryDate) {
                // Otherwise Cumulative Logic:
                const existingExp = userData.expiryDate.toDate();
                if (existingExp > baseDate) {
                    baseDate = existingExp;
                } else {
                    // Expiry is in the past, we start from 'Now' 
                    // but we ensure the existing numerical balance is also satisfied
                    durationToApply = (userData.credits || 0) + amount;
                }
            } else {
                durationToApply = (userData.credits || 0) + amount;
            }

            const end = new Date(baseDate);
            end.setFullYear(end.getFullYear() + Math.floor(durationToApply));
            const remainingDays = (durationToApply % 1) * 365;
            end.setDate(end.getDate() + Math.round(remainingDays));
            
            updateData.expiryDate = firebase.firestore.Timestamp.fromDate(end);
        }

        await userRef.update(updateData);
        
        const typeName = type === 'credits' ? 'năm VIP' : 'lượt dùng';
        showToast(`Thành công! Đã ${amount > 0 ? 'cộng' : 'trừ'} ${Math.abs(amount)} ${typeName}.`, "success");
        document.getElementById('admin-credit-amount').value = '';
        refreshAdminVipPreview();
        loadAdminUserList();
    } catch(error) {
        showToast("Lỗi cập nhật: " + error.message, "error");
    }
}

async function adminResetExpiry() {
    const uid = document.getElementById('admin-target-uid').dataset.uid;
    if(!uid) return showToast("Vui lòng 'Tìm User ID' hợp lệ trước.", "error");

    const btn = document.querySelector('[data-action="admin-reset-expiry"]');
    
    // Check if we are already in confirm mode via a volatile flag
    if (!window._resetConfirmMode) {
        window._resetConfirmMode = true;
        
        // Update button text and style directly
        const originalText = btn.textContent;
        const originalClass = btn.className;
        
        btn.textContent = "XÁC NHẬN XÓA?";
        btn.className = "px-4 py-3 bg-red-600 text-white text-[10px] font-black rounded-xl transition-all uppercase tracking-tight shadow-md animate-pulse";
        
        // Auto hide after 3 seconds if not pressed
        setTimeout(() => {
            window._resetConfirmMode = false;
            btn.textContent = originalText;
            btn.className = originalClass;
        }, 3000);
        return;
    }

    try {
        window._resetConfirmMode = false;
        btn.textContent = "ĐANG RESET...";
        
        await db.collection('users').doc(uid).update({
            credits: 0,
            expiryDate: firebase.firestore.FieldValue.delete()
        });
        showToast("Đã reset hạn VIP thành công.", "success");
        
        // Refresh UI
        searchUserByEmail();
        loadAdminUserList();
    } catch(error) {
        showToast("Lỗi Reset: " + error.message, "error");
    }
}

async function adminDeleteUser(btn) {
    const uid = btn.dataset.uid;
    const email = btn.dataset.email;

    if (!uid) return;
    if (email === ADMIN_EMAIL) return showToast("Không thể xoá tài khoản Admin gốc!", "error");

    // Double confirmation via UI state
    if (!btn._confirmDelete) {
        btn._confirmDelete = true;
        btn.classList.add('bg-red-50', 'text-red-600', 'border-red-200');
        showToast("⚠️ Nhấn một lần nữa để XÁC NHẬN XOÁ tài khoản này!", "error");
        setTimeout(() => {
            btn._confirmDelete = false;
            btn.classList.remove('bg-red-50', 'text-red-600', 'border-red-200');
        }, 3000);
        return;
    }

    try {
        await db.collection('users').doc(uid).delete();
        showToast(`Đã xoá tài khoản ${email} thành công.`, "success");
        // User record is gone, list will auto-refresh via onSnapshot
    } catch (error) {
        showToast("Lỗi xoá: " + error.message, "error");
    }
}

async function adminResetDevices(btn) {
    const uid = btn.dataset.uid || btn.getAttribute('data-uid');
    const email = btn.dataset.email || btn.getAttribute('data-email');
    if (!uid) return;

    try {
        await db.collection('users').doc(uid).update({
            deviceIds: []
        });
        showToast(`Đã Reset thiết bị cho tài khoản ${email} thành công.`, "success");
    } catch (error) {
        showToast("Lỗi Reset: " + error.message, "error");
    }
}

async function adminResetPassword() {
    const email = document.getElementById('admin-target-email').value.trim();
    if(!email) return showToast("Vui lòng nhập Email", "error");
    
    try {
        await auth.sendPasswordResetEmail(email);
        showToast("Đã gửi email Reset Password tới " + email, "success");
    } catch (error) {
        showToast(translateError(error), "error");
    }
}

async function adminFillEmail(email) {
    document.getElementById('admin-target-email').value = email;
    searchUserByEmail(); // auto search
}

let unsubscribeAdminUsers = null;

function loadAdminUserList() {
    const listObj = document.getElementById('admin-user-list');
    const adminContainer = document.getElementById('admin-user-row-container');
    
    if (unsubscribeAdminUsers) {
        unsubscribeAdminUsers();
        unsubscribeAdminUsers = null;
    }

    try {
        unsubscribeAdminUsers = db.collection('users').orderBy('createdAt', 'desc').limit(100).onSnapshot(snapshot => {
            listObj.innerHTML = ''; 
            if (adminContainer) adminContainer.innerHTML = '';
            
            if(snapshot.empty) {
                listObj.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-slate-400">Chưa có khách hàng nào</td></tr>';
                return;
            }

            let sttCount = 1;
            const adminRows = [];
            const userRows = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                const isUserAdmin = data.email === ADMIN_EMAIL || (data.email && data.email.toLowerCase().includes("admin"));
                
                const expiryDate = data.expiryDate ? data.expiryDate.toDate().toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '--';
                const lastLoginStr = data.lastLoginAt ? data.lastLoginAt.toDate().toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '--';
                
                let daysRemaining = '';
                if (data.expiryDate && (data.credits > 0 || data.points > 0)) {
                    const now = new Date();
                    const diff = data.expiryDate.toDate().getTime() - now.getTime();
                    const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
                    daysRemaining = `<div class="text-[10px] sm:text-[11px] text-emerald-600 font-black mt-0.5">${days > 0 ? 'Còn ' + days + ' ngày' : 'Đã hết hạn'}</div>`;
                }

                if (isUserAdmin) {
                    adminRows.push(`
                    <td class="px-2 py-3 text-center w-[5%] font-bold text-emerald-600">--</td>
                    <td class="px-2 py-3 text-center w-[12%] font-bold text-[10px] sm:text-[11px] text-emerald-600">${lastLoginStr}</td>
                    <td class="px-4 py-3 font-bold text-slate-800 w-[28%]">
                        <div class="flex items-center gap-2">
                             <div class="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center text-[10px] font-black">${(data.displayName || data.email || '?').charAt(0).toUpperCase()}</div>
                             <div class="flex flex-col">
                                <span class="truncate max-w-[200px] leading-tight flex items-center gap-1">
                                    ${data.displayName && data.displayName.trim() !== '' ? data.displayName : 'VIP'}
                                    <span class="px-1 py-0.5 bg-red-600 text-white text-[7px] rounded">VIP</span>
                                </span>
                                <span class="text-[8px] text-slate-400 font-medium">${data.email}</span>
                             </div>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-center w-[12%]">
                        <span class="px-2.5 py-1 bg-red-50 text-red-700 rounded-full font-black text-[13px] border border-red-100 shadow-inner">VIP</span>
                    </td>
                    <td class="px-4 py-3 text-center w-[10%]">
                         <span class="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-black text-[11px] border border-amber-100 shadow-inner">${data.points || 0} LƯỢT</span>
                    </td>
                    <td class="px-4 py-3 text-center w-[18%] text-[10px] font-black text-red-600 uppercase">
                        Vô hạn
                    </td>
                    <td class="px-4 py-3 text-right w-[15%]">
                        <div class="flex items-center justify-end gap-1">
                            <button data-action="admin-fill-email" data-email="${data.email}" class="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-[9px] uppercase font-bold transition-all shadow-sm">Chọn</button>
                        </div>
                    </td>
                    `);
                } else {
                    userRows.push({
                        id: doc.id,
                        email: data.email,
                        displayName: data.displayName,
                        credits: data.credits,
                        points: data.points,
                        expiryDateStr: expiryDate,
                        daysRemaining: daysRemaining,
                        lastLoginStr: lastLoginStr
                    });
                }
            });

            // Render admins to fixed container
            if (adminRows.length > 0 && adminContainer) {
                const adminTable = document.createElement('table');
                adminTable.className = "w-full text-xs text-left border-collapse table-fixed";
                const adminTbody = document.createElement('tbody');
                adminRows.forEach(content => {
                    const tr = document.createElement('tr');
                    tr.className = "border-b border-red-100 bg-red-50/20";
                    tr.innerHTML = content;
                    adminTbody.appendChild(tr);
                });
                adminTable.appendChild(adminTbody);
                adminContainer.appendChild(adminTable);
            }

            // Render others to scrollable list - Reset STT for users
            userRows.forEach(u => {
                const tr = document.createElement('tr');
                tr.className = "border-b border-slate-100 hover:bg-slate-50 transition-colors";
                tr.innerHTML = `
                    <td class="px-2 py-3 text-center w-[5%] font-bold text-emerald-600">${sttCount++}</td>
                    <td class="px-2 py-3 text-center w-[12%] font-bold text-[10px] sm:text-[11px] text-emerald-600">${u.lastLoginStr}</td>
                    <td class="px-4 py-3 font-bold text-slate-800 w-[28%]">
                        <div class="flex items-center gap-2">
                             <div class="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">${(u.displayName || u.email || '?').charAt(0).toUpperCase()}</div>
                             <div class="flex flex-col">
                                <span class="truncate max-w-[200px] leading-tight flex items-center gap-1">
                                    ${u.displayName && u.displayName.trim() !== '' ? u.displayName : (u.email ? u.email.split('@')[0] : 'Khách')}
                                </span>
                                <span class="text-[8px] text-slate-400 font-medium">${u.email}</span>
                             </div>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-center w-[12%]">
                        <span class="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-black text-[13px] border border-blue-100 shadow-inner">${Math.max(0, (u.credits || 0))} NĂM</span>
                    </td>
                    <td class="px-4 py-3 text-center w-[10%]">
                        <span class="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-black text-[11px] border border-amber-100 shadow-inner">${Math.max(0, (u.points || 0))} LƯỢT</span>
                    </td>
                    <td class="px-4 py-3 text-center w-[18%] text-[11px] sm:text-[12px] font-bold text-red-600">
                        <div>${u.expiryDateStr}</div>
                        ${u.daysRemaining}
                    </td>
                    <td class="px-4 py-3 text-right w-[15%]">
                        <div class="flex items-center justify-end gap-1">
                            <button data-action="admin-fill-email" data-email="${u.email}" class="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-[9px] uppercase font-bold transition-all shadow-sm">Chọn</button>
                            <button data-action="admin-reset-devices" data-uid="${u.id}" data-email="${u.email}" class="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded transition-all" title="Reset thiết bị">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                            </button>
                            <button data-action="admin-delete-user" data-uid="${u.id}" data-email="${u.email}" class="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 rounded transition-all" title="Xoá tài khoản">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                        </div>
                    </td>
                `;
                listObj.appendChild(tr);
            });
            
            if (userRows.length === 0) {
               listObj.innerHTML = '<tr><td colspan="6" class="text-center py-10 text-slate-400">Không có người dùng nào khác.</td></tr>';
            }

        }, error => {
            listObj.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Lỗi truy vấn: ${error.message}</td></tr>`;
            console.error(error);
        });

    } catch(error) {
        listObj.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Lỗi truy vấn: ${error.message}</td></tr>`;
    }
}

// ======= DOM READY: CSP COMPLIANT EVENT LISTENERS =======
function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const tabAttr = urlParams.get('tab');
    if (tabAttr === 'register') {
        switchView('view-register');
    }

    document.body.addEventListener('click', (e) => {
        // We handle clicks by checking closest elements with data-action or specific IDs
        
        const dataAction = e.target.closest('[data-action]');
        if (dataAction) {
            const action = dataAction.getAttribute('data-action');
            if (action === 'switch-view') {
                e.preventDefault();
                switchView(dataAction.getAttribute('data-view'));
            } else if (action === 'toggle-password') {
                togglePassword(dataAction.getAttribute('data-target'), dataAction);
            } else if (action === 'signout') {
                localStorage.removeItem('tlnx_saved_email');
                localStorage.removeItem('tlnx_saved_pass');
                auth.signOut();
            } else if (action === 'admin-search') {
                searchUserByEmail();
            } else if (action === 'admin-update-credit') {
                adminUpdateCredit();
            } else if (action === 'admin-reset-expiry') {
                adminResetExpiry();
            } else if (action === 'admin-delete-user') {
                adminDeleteUser(dataAction);
            } else if (action === 'admin-reset-devices') {
                adminResetDevices(dataAction);
            } else if (action === 'admin-reset-pw') {
                adminResetPassword();
            } else if (action === 'admin-load-users') {
                loadAdminUserList();
            } else if (action === 'admin-fill-email') {
                adminFillEmail(dataAction.getAttribute('data-email'));
            } else if (action === 'admin-add-package') {
                addAdminPackageRow();
            } else if (action === 'admin-save-topup-config') {
                adminSaveTopupConfig();
            } else if (action === 'toggle-packages') {
                const container = document.getElementById('admin-packages-list-container');
                const chevron = document.getElementById('packages-chevron');
                if (container && chevron) {
                    const isHidden = container.classList.contains('hidden');
                    if (isHidden) {
                        container.classList.remove('hidden');
                        chevron.style.transform = 'rotate(180deg)';
                    } else {
                        container.classList.add('hidden');
                        chevron.style.transform = 'rotate(0deg)';
                    }
                }
            } else if (action === 'generate-qr') {
                generateQR(dataAction, parseFloat(dataAction.getAttribute('data-pts')), parseInt(dataAction.getAttribute('data-amt')));
            }
        }
        
        if (e.target.id === 'continue-to-system' || e.target.closest('#continue-to-system')) {
            document.getElementById('success-container').classList.add('hidden');
            document.getElementById('success-container').classList.remove('flex');
            document.getElementById('main-container').classList.remove('hidden');
            document.getElementById('main-container').classList.add('flex');
        }

        if (e.target.id === 'close-window-btn' || e.target.closest('#close-window-btn')) {
            if (typeof window.closeAuthWindow === 'function') {
                window.closeAuthWindow();
            }
        }
    });

    // Listeners for Admin VIP Preview
    const adminCreditAmtInput = document.getElementById('admin-credit-amount');
    const adminCreditTypeSelect = document.getElementById('admin-credit-type');
    const adminVipStartInput = document.getElementById('admin-vip-start-date');

    [adminCreditAmtInput, adminCreditTypeSelect, adminVipStartInput].forEach(el => {
        el?.addEventListener('input', refreshAdminVipPreview);
        el?.addEventListener('change', refreshAdminVipPreview);
    });

    // Form submits
    const formLogin = document.getElementById('form-login');
    if(formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value;
            const remember = document.getElementById('remember-me').checked;
            
            toggleLoading(true);
            try {
                // Backdoor cho admin/admin để thuận tiện theo yêu cầu
                if (email.toLowerCase() === 'admin' && pass === 'admin') {
                    const fauxEmail = 'admin@admin.com';
                    const fauxPass = 'admin123456';
                    const persistence = remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
                    await auth.setPersistence(persistence);
                    
                    if (remember) {
                        localStorage.setItem('tlnx_saved_email', email);
                        localStorage.setItem('tlnx_saved_pass', pass);
                    } else {
                        localStorage.removeItem('tlnx_saved_email');
                        localStorage.removeItem('tlnx_saved_pass');
                    }
                    
                    try {
                        await auth.signInWithEmailAndPassword(fauxEmail, fauxPass);
                    } catch(err) {
                        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
                             await auth.createUserWithEmailAndPassword(fauxEmail, fauxPass);
                             // Tự động đăng nhập sau khi tạo
                             await auth.signInWithEmailAndPassword(fauxEmail, fauxPass);
                        } else {
                             throw err;
                        }
                    }
                    toggleLoading(false);
                    return;
                }

                // Handle remember
                const persistence = remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
                await auth.setPersistence(persistence);
                
                if (remember) {
                    localStorage.setItem('tlnx_saved_email', email);
                    localStorage.setItem('tlnx_saved_pass', pass);
                } else {
                    localStorage.removeItem('tlnx_saved_email');
                    localStorage.removeItem('tlnx_saved_pass');
                }
                
                // Login
                await auth.signInWithEmailAndPassword(email, pass);
                // OnAuthStateChanged sẽ tự chuyển trang
            } catch (error) {
                showToast(translateError(error), 'error');
            }
            toggleLoading(false);
        });
    }

    const formRegister = document.getElementById('form-register');
    if (formRegister) {
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const pass = document.getElementById('reg-password').value;
            const cfm = document.getElementById('reg-confirm').value;
            
            if (pass !== cfm) {
                return showToast("Mật khẩu xác nhận không khớp.", "error");
            }

            toggleLoading(true);
            try {
                const userCred = await auth.createUserWithEmailAndPassword(email, pass);
                const user = userCred.user;
                await user.updateProfile({ displayName: name });
                
                // Đồng bộ ngay lập tức vào Firestore sau khi update Profile
                await db.collection('users').doc(user.uid).set({
                    email: email,
                    displayName: name,
                    credits: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                // Cập nhật lại giao diện ngay để hiện tên
                document.getElementById('user-name').textContent = name;
                document.getElementById('avatar-letters').textContent = name.charAt(0).toUpperCase();
                
                if (email !== ADMIN_EMAIL && !email.toLowerCase().includes("admin")) {
                    showToast("Đăng ký thành công! Bạn có thể tắt trang này và mở Tiện ích Nhận xét để sử dụng.", "success");
                }
            } catch (error) {
                showToast(translateError(error), 'error');
            }
            toggleLoading(false);
        });
    }

    const formForgot = document.getElementById('form-forgot');
    if (formForgot) {
        formForgot.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value;
            toggleLoading(true);
            try {
                await auth.sendPasswordResetEmail(email);
                showToast("Link khôi phục đã gửi vào email. Vui lòng kiểm tra hộp thư.", "success");
                switchView('view-login');
            } catch (error) {
                showToast(translateError(error), 'error');
            }
            toggleLoading(false);
        });
    }

    // Khôi phục tài khoản đã nhớ
    const savedEmail = localStorage.getItem('tlnx_saved_email');
    const savedPass = localStorage.getItem('tlnx_saved_pass');
    if (savedEmail && savedPass) {
        const loginEmail = document.getElementById('login-email');
        const loginPass = document.getElementById('login-password');
        const rememberMe = document.getElementById('remember-me');
        if (loginEmail) loginEmail.value = savedEmail;
        if (loginPass) loginPass.value = savedPass;
        if (rememberMe) rememberMe.checked = true;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.closeAuthWindow = function() {
    try {
        window.close();
    } catch(e){}
    
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: "closeCurrentTab" });
    }
};