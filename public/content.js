import { generateAllSampleData } from "../shared.js";

(() => {
  // public/content.js
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fillComments") {
      fillCommentsAsync(request.config)
        .then((result) => {
          sendResponse({
            success: true,
            count: result.count,
            detectedMon: result.detectedMon,
          });
        })
        .catch((err) => {
          console.error(err);
          if (window === window.top && document.querySelectorAll("iframe").length > 0) {
            // If top window fails but has iframes, let the iframe's success response win.
            // We just wait a bit, if no iframe responds, we send the error.
            setTimeout(() => {
                sendResponse({ success: false, error: err.message });
            }, 500);
          } else {
            sendResponse({ success: false, error: err.message });
          }
        });
      return true;
    }
  });
  
  const saveScrollState = () => {
     let containers = Array.from(document.querySelectorAll('*')).filter(el => {
         if (el.tagName === 'BODY' || el.tagName === 'HTML' || el.tagName === 'HEAD') return false;
         const style = window.getComputedStyle(el);
         return el.scrollHeight > el.clientHeight + 10 && 
                (style.overflowY === 'auto' || style.overflowY === 'scroll');
     });
     return {
        windowX: window.scrollX,
        windowY: window.scrollY,
        containers: containers.map(c => ({ el: c, top: c.scrollTop }))
     };
  };

  const restoreScrollState = (state) => {
      if (!state) return;
      window.scrollTo({ left: state.windowX, top: state.windowY, behavior: 'instant' });
      state.containers.forEach(s => {
          if(s.el) s.el.scrollTop = s.top;
      });
  };

  async function fillCommentsAsync(config) {
    const scrollState = saveScrollState();
    try {
      return await fillCommentsInner(config);
    } finally {
      // Delay restore slightly to ensure all DOM updates and scrolling have settled
      setTimeout(() => restoreScrollState(scrollState), 100);
    }
  }

  async function fillCommentsInner(config) {
    let fillCount = 0;
    let skippedNoScore = 0;
    let skippedNoInput = 0;
    const storageResult = await chrome.storage.local.get(["commentsData"]);
    let db = storageResult.commentsData;
    if (
      !db ||
      Object.keys(db).length === 0 ||
      db?.TH?.["3"]?.GVBM?.["Toán_Giữa kỳ 1"]
    ) {
      db = generateAllSampleData();
      await chrome.storage.local.set({ commentsData: db });
    }
    let role = "GVBM";
    let capHoc = "THCS";
    let khoiLop = "6";
    let subject = "";
    let pageText = document.body.innerText.toLowerCase();

    // Add text from same-origin iframes
    let iframes = document.querySelectorAll("iframe");
    for (let iframe of iframes) {
      try {
        if (iframe.contentDocument && iframe.contentDocument.body) {
          pageText += " " + iframe.contentDocument.body.innerText.toLowerCase();
        }
      } catch (e) {}
    }

    let detectedHocKy = "Học kỳ 1";
    let isGiuaKy = false;
    let isCuoiKy = false;
    if (
      pageText.includes("học kỳ 2") ||
      pageText.includes("học kỳ ii") ||
      pageText.includes("hk2") ||
      pageText.includes("hk ii") ||
      pageText.includes("hk 2") ||
      pageText.includes("hkii")
    ) {
      detectedHocKy = "Học kỳ 2";
    }

    // Preliminary level detection from page text
    if (pageText.includes("thpt") || pageText.includes("ph\u1ED5 th\xF4ng") || pageText.includes("trung học phổ thông"))
      capHoc = "THPT";
    else if (pageText.includes("thcs") || pageText.includes("trung học cơ sở"))
      capHoc = "THCS";
    else if (pageText.includes("ti\u1EC3u h\u1ECDc"))
      capHoc = "TH";

    // Build a map of label-like text to nearby values to reliably find Khối and Môn
    const possibleInfoEls = Array.from(
      document.querySelectorAll(
        'input[type="text"], input:not([type]), select, .k-input, .rcbInput, .rcbReadOnly, .x-form-text, .select2-selection__rendered'
      )
    );
    const normVal = (el) => {
      if (el.tagName?.toLowerCase() === "select")
        return el.options[el.selectedIndex]?.text?.trim() || "";
      return (el.value || el.innerText || "").trim();
    };

    // First try the traditional valSet list matching
    const valSet = Array.from(new Set(possibleInfoEls.map(normVal))).filter(Boolean);
    console.log("[Extension] Detected info values:", valSet);

    // Advanced search: Try finding label-next-to-value or value directly
    let foundKhoi = false;
    
    // Look closely at elements for explicit label-value pairs
    // Typical DOM on CSDL Ngành: <td>Khối:</td><td><input value="6"/></td>
    // Or <label>Khối học</label> ... <span class="select2-selection__rendered">6</span>
    for (let el of document.querySelectorAll('td, label, span, div')) {
      let txt = (el.innerText || "").toLowerCase().trim();
      // Expanded label matching for better precision
      if (txt === "khối" || txt === "khối học" || txt === "khối:" || txt === "khối học:" || txt === "khối lớp" || txt === "khối lớp:") {
        // Try finding next sibling or an element nearby that contains the number
        let parent = el.parentElement;
        let walkArea = parent?.parentElement || parent;
        if (walkArea) {
          let inputsInArea = walkArea.querySelectorAll('input:not([type="hidden"]), select, .k-input, .select2-selection__rendered, .x-form-text, .rcbInput');
          for (let inp of inputsInArea) {
            let iv = normVal(inp).toLowerCase();
            let mt = iv.match(/^(\d+)$/);
            if (mt) {
              khoiLop = mt[1];
              foundKhoi = true;
              break;
            }
          }
        }
      }
      if (foundKhoi) break;
    }

    if (!foundKhoi) {
      for (const val of valSet) {
        const match = val.toLowerCase().match(/khối[\s:]*(\d+)/);
        if (match) {
          khoiLop = match[1];
          foundKhoi = true;
          break;
        }
        
        // Sometimes the dropdown just says "6", "6A", "10" 
        // We carefully only pick 1-12 if no explicit string "Khối X" was found.
        const numExactStrMatch = val.match(/^(\d+)[A-Za-z]?$/);
        if (numExactStrMatch && !foundKhoi) {
          let num = parseInt(numExactStrMatch[1]);
          if (num >= 1 && num <= 12) {
             // Defer assignment if possible, but keep it as a weak match
             khoiLop = numExactStrMatch[1];
          }
        }
      }

      // Explicit search for "Học kỳ" label-value
      for (let el of document.querySelectorAll('td, label, span, div')) {
        let txt = (el.innerText || "").toLowerCase().trim();
        if (txt === "học kỳ" || txt === "học kỳ:" || txt === "kỳ học" || txt === "kỳ học:") {
          let parent = el.parentElement;
          let walkArea = parent?.parentElement || parent;
          if (walkArea) {
             let inps = walkArea.querySelectorAll('input:not([type="hidden"]), select, .k-input, .select2-selection__rendered, .rcbInput');
             for (let inp of inps) {
               let iv = normVal(inp).toLowerCase();
               if (iv.includes("2") || iv.includes("ii")) detectedHocKy = "Học kỳ 2";
               else if (iv.includes("1") || iv.includes("i")) detectedHocKy = "Học kỳ 1";
             }
          }
        }
      }

      // Fallback to valSet loop for semester if labels didn't find it
      for (const val of valSet) {
        const vLow = val.toLowerCase();
        if (vLow.includes("học kỳ ii") || vLow.includes("học kỳ 2") || vLow.includes("hk2") || vLow.includes("hk ii") || vLow.includes("hk 2") || vLow.includes("hkii")) {
          detectedHocKy = "Học kỳ 2";
        } else if (vLow.includes("học kỳ i") || vLow.includes("học kỳ 1") || vLow.includes("hk1") || vLow.includes("hki") || vLow.includes("hk i") || vLow.includes("hk 1")) {
          detectedHocKy = "Học kỳ 1";
        }
        
        if (vLow.includes("cuối học kỳ") || vLow.includes("cuối năm") || vLow.includes("cuối hk") || vLow.includes("cuối kỳ") || vLow.includes("ck1") || vLow.includes("ck2") || vLow === "ck") {
          isCuoiKy = true;
        }
        if (vLow.includes("giữa học kỳ") || vLow.includes("giữa hk") || vLow.includes("giữa kỳ") || vLow.includes("gk1") || vLow.includes("gk2") || vLow === "gk") {
          isGiuaKy = true;
        }
      }
      
      if (isCuoiKy) {
         isGiuaKy = false;
      }
    }

    // Fallback: search entire body text for "Khối: X" or "Khối lớp: X" in case inputs missed it
    const bodyMatch = document.body.innerText.toLowerCase().match(/khối(?:\s+lớp)?[\s:]*(\d+)/);
    if (bodyMatch && !foundKhoi) {
      khoiLop = bodyMatch[1];
      foundKhoi = true;
    }

    // Refine capHoc based on final khoiLop
    if (khoiLop) {
      const k = parseInt(khoiLop);
      if (k >= 10) capHoc = "THPT";
      else if (k >= 6 && k <= 9) capHoc = "THCS";
      else if (k >= 1 && k <= 5) capHoc = "TH";
    }

    console.log(`[Extension] Resolved: Cap=${capHoc}, Khoi=${khoiLop}`);
    const activeTitles = Array.from(
      document.querySelectorAll(
        ".x-window-header-text, .x-panel-header-text, .x-tab-strip-active, .x-tab-active, .k-window-title, h1, h2, h3, .x-title-text, .panel-title",
      ),
    );
    let activeTitleText = activeTitles
      .map((el) => el.innerText)
      .join(" ")
      .toLowerCase();

    let parentText = "";
    try {
      if (window.top !== window.self) {
        parentText = (
          window.parent.document.body.innerText || ""
        ).toLowerCase();
        parentText += " " + window.parent.location.href.toLowerCase();
      }
    } catch (e) {}

    let textToCheckRole =
      activeTitleText +
      " " +
      pageText +
      " " +
      parentText +
      " " +
      window.location.href.toLowerCase();

    let is533 =
      textToCheckRole.includes("5.3.3") ||
      activeTitleText.includes(
        "nh\u1EADn x\xE9t in h\u1ECDc b\u1EA1 c\u1EE7a gvcn",
      ) ||
      window.location.href.includes("5.3.3");
    let isTrangNLPC =
      activeTitleText.includes("n\u0103ng l\u1EF1c") ||
      (capHoc === "TH" && (textToCheckRole.includes("5.3.2") || window.location.href.includes("5.3.2")));
    let isTrangDGTX =
      textToCheckRole.includes("5.3.4") ||
      activeTitleText.includes("th\u01B0\u1EDDng xuy\xEAn");

    const isVnEdu = window.location.hostname.includes("vnedu");

    if (isVnEdu) {
      // Enforce VnEdu specific logic (VnEdu doesn't use 5.3.1, 5.3.2, 5.3.4 schemas like SMAS)
      let titleAndTab = activeTitleText + " " + window.location.href.toLowerCase();
      let isSoDiemOrNhanXet = activeTitleText.includes("sổ nhận xét") || 
                              activeTitleText.includes("sổ điểm") || 
                              activeTitleText.includes("sổ ghi điểm") || 
                              activeTitleText.includes("nhận xét môn học");

      let isHocBaPage = (
        activeTitleText.includes("phẩm chất - năng lực") ||
        activeTitleText.includes("năng lực, phẩm chất") ||
        activeTitleText.includes("năng lực - phẩm chất") ||
        activeTitleText.includes("phẩm chất - năn") ||
        (activeTitleText.includes("học bạ") && activeTitleText.includes("năng lực") && activeTitleText.includes("phẩm chất"))
      ) && !isSoDiemOrNhanXet;

      if (isHocBaPage) {
        role = "VNEDU_NLPC_HB";
      } else if (activeTitleText.includes("hiệu trưởng") || activeTitleText.includes("phê duyệt của hiệu trưởng") || document.body.innerText.match(/Hiệu trưởng:\s/i)) {
        role = "HIEU_TRUONG";
      } else if (
        activeTitleText.includes("giáo viên chủ nhiệm") ||
        activeTitleText.includes("gvcn") ||
        activeTitleText.includes("nhận xét của giáo viên chủ nhiệm") ||
        activeTitleText.includes("đánh giá của giáo viên chủ nhiệm") ||
        activeTitleText.includes("nhận xét gvcn") ||
        (activeTitleText.includes("sổ học bạ") && !activeTitleText.includes("hiệu trưởng") && !activeTitleText.includes("phẩm chất") && !activeTitleText.includes("năng lực")) ||
        (activeTitleText.includes("sổ học bạ") && document.body.innerText.match(/Giáo viên chủ nhiệm:\s/i))
      ) {
        role = "HOC_BA_GVCN";
      } else if (isSoDiemOrNhanXet) {
        role = "GVBM";
      } else {
        role = "GVBM"; // Default for VnEdu entries
      }
    } else {
      // SMAS / CSDL Ngành logic
      if (
        is533 ||
        activeTitleText.includes("chủ nhiệm") ||
        activeTitleText.includes("gvcn") ||
        textToCheckRole.includes("nhận xét của giáo viên chủ nhiệm") ||
        textToCheckRole.includes(
          "\u0063\u0068\u1EE7 \u006E\u0068\u0069\u1EC7\u006D",
        ) ||
        textToCheckRole.includes("nhận xét đánh giá của gvcn") ||
        textToCheckRole.includes("nhập nhận xét gvcn") ||
        textToCheckRole.includes("nhận xét gvcn") ||
        textToCheckRole.includes("7.4.2") ||
        textToCheckRole.includes("sổ học bạ")
      )
        role = "HOC_BA_GVCN";
      else if (isTrangDGTX) role = "DGTX";
      else if (isTrangNLPC) role = "TH_NLPC";
      else if (
        textToCheckRole.includes("hi\u1EC7u tr\u01B0\u1EDFng") ||
        activeTitleText.includes("hiệu trưởng")
      )
        role = "HIEU_TRUONG";
      else if (
        textToCheckRole.includes("b\u1ED9 m\xF4n") ||
        textToCheckRole.includes("gvbm") ||
        (capHoc !== "TH" && textToCheckRole.includes("h\u1ECDc b\u1EA1")) // Only map to HOC_BA_GVBM if it explicitly says học bạ
      ) {
        role = "HOC_BA_GVBM";
      }
      else if (
        textToCheckRole.includes("5.3.1") ||
        textToCheckRole.includes("5.3.2") ||
        textToCheckRole.includes("\u0111\u1ECBnh k\u1EF3 m\xF4n h\u1ECDc") ||
        textToCheckRole.includes("nh\u1EADn x\xE9t m\xF4n h\u1ECDc") ||
        textToCheckRole.includes("nhận xét môn học")
      )
        role = "GVBM";
    }

    if (db[capHoc] && db[capHoc][khoiLop] && db[capHoc][khoiLop].GVBM) {
      const availSubs = Object.keys(db[capHoc][khoiLop].GVBM);
      // ONLY use base subjects for matching the valSet initially
      const baseSubs = Array.from(
        new Set(availSubs.map((s) => s.split("_")[0])),
      ).sort((a, b) => b.length - a.length);

      const vnEduSubMap = {
        "Tiếng Anh": "Ngoại ngữ",
        "TN-XH": "Tự nhiên và Xã hội",
        "Tin học và Công nghệ (Tin học)": "Tin học",
        "Tin học và Công nghệ (Công nghệ)": "Công nghệ",
      };

      let pageText = document.body.innerText.replace(/\s+/g, " ");
      let lowerPageText = pageText.toLowerCase();

      // Add explicit robust check for selects first
      const getSubjectFromSelects = () => {
        const selects = document.querySelectorAll("select, input.k-input, .rcbInput, .rcbReadOnly, .select2-selection__rendered");
        for (const s of selects) {
          let text = "";
          if (s.tagName?.toLowerCase() === "select") {
            text = s.options[s.selectedIndex]?.text;
          } else if (s.tagName?.toLowerCase() === "input") {
            text = s.value;
          } else {
            text = s.innerText;
          }
          text = text?.trim().toLowerCase();
          
          if (!text) continue;

          let matchSpecific = text.match(/\(([^)]+)\)/);
          if (matchSpecific) {
            let inner = matchSpecific[1].trim();
            let foundBase = baseSubs.find(s => s.toLowerCase() === inner);
            if (foundBase) {
              console.log("[Extension] Matched subject from parentheses in select:", foundBase);
              return foundBase;
            }
            for (const [vnName, oName] of Object.entries(vnEduSubMap)) {
              if (vnName.toLowerCase() === inner) {
                console.log("[Extension] Matched subject from parentheses (vnEduMap) in select:", oName);
                return oName;
              }
            }
          }
          
          for (const [vnName, oName] of Object.entries(vnEduSubMap)) {
            if (text === vnName.toLowerCase() || text.includes(vnName.toLowerCase())) {
              console.log("[Extension] Matched subject from explicit select (vnEduMap):", oName);
              return oName;
            }
          }
          
          for (const sub of baseSubs) {
            if (
              text === sub.toLowerCase() || 
              text.includes(`môn ${sub.toLowerCase()}`) || 
              text.includes(`môn học: ${sub.toLowerCase()}`) ||
              text.includes(sub.toLowerCase()) // Fallback substring match, safe because baseSubs is sorted by length descending
            ) {
              console.log("[Extension] Matched subject from explicit select:", sub);
              return sub;
            }
          }
        }
        return null;
      };
      
      // Explicit DOM Search for Labels matching "Môn"
      let foundMon = false;
      for (let el of document.querySelectorAll('td, label, span, div')) {
        let txt = (el.innerText || "").toLowerCase().trim();
        // Updated label matching to match user request precisely
        if (txt === "môn" || txt === "môn học" || txt === "môn:" || txt === "môn học:" || txt === "môn thi:" || txt === "môn học/hđgd:") {
          // Look at parent/sibling inputs
          let parent = el.parentElement;
          let walkArea = parent?.parentElement || parent;
          if (walkArea) {
            let inputsInArea = walkArea.querySelectorAll('input:not([type="hidden"]), select, .k-input, .select2-selection__rendered, .x-form-text, .rcbInput');
            for (let inp of inputsInArea) {
              let iv = normVal(inp).toLowerCase();
              let matchedSub = null;
              
              let matchSpecific = iv.match(/\(([^)]+)\)/);
              if (matchSpecific) {
                let inner = matchSpecific[1].trim();
                let foundBase = baseSubs.find(s => s.toLowerCase() === inner);
                if (foundBase) matchedSub = foundBase;
                else {
                  for (const [vnName, oName] of Object.entries(vnEduSubMap)) {
                    if (vnName.toLowerCase() === inner) {
                       matchedSub = oName; break;
                    }
                  }
                }
              }
              
              if (!matchedSub) {
                for (const [vnName, oName] of Object.entries(vnEduSubMap)) {
                  if (iv === vnName.toLowerCase() || iv.includes(vnName.toLowerCase())) {
                    matchedSub = oName;
                    break;
                  }
                }
              }
              
              if (!matchedSub) {
                matchedSub = baseSubs.find(s => iv === s.toLowerCase() || iv.includes(s.toLowerCase()));
              }
              
              if (matchedSub) {
                subject = matchedSub;
                foundMon = true;
                break;
              }
            }
          }
        }
        if (foundMon) break;
      }
      
      if (foundMon) {
        console.log("[Extension] Matched explicit subject from DOM label:", subject);
      } else {
        // Fallback to getSubjectFromSelects()
        subject = getSubjectFromSelects() || subject;
      }

      // 1. HIGHEST PRIORITY: Match explicit pattern in valSet e.g., (...)
      if (!subject) {
        for (const val of valSet) {
          let matchSpecific = val.match(/\(([^)]+)\)/);
          if (matchSpecific) {
            let inner = matchSpecific[1].trim().toLowerCase();
            let found = baseSubs.find((s) => s.toLowerCase() === inner);
            if (!found) {
              for (const [vnEduName, ourName] of Object.entries(vnEduSubMap)) {
                if (vnEduName.toLowerCase() === inner) {
                  found = ourName;
                  break;
                }
              }
            }
            if (found) {
              subject = found;
              console.log(
                "[Extension] Matched subject from parentheses priority:",
                subject,
              );
              break;
            }
          }
        }
      }

      // Prioritize explicit vnedu mapping from pageText
      if (!subject) {
        const sortedVnEduNames = Object.keys(vnEduSubMap).sort(
          (a, b) => b.length - a.length,
        );
        for (const vnEduName of sortedVnEduNames) {
          const ourName = vnEduSubMap[vnEduName];
          const lowerName = vnEduName.toLowerCase();
          if (
            lowerPageText.includes(`môn ${lowerName}`) ||
            lowerPageText.includes(`môn học: ${lowerName}`) ||
            lowerPageText.includes(`môn: ${lowerName}`) ||
            lowerPageText.includes(lowerName)
          ) {
            subject = ourName;
            break;
          }
        }
      }

      if (!subject) {
        for (const sub of baseSubs) {
          const lowerSub = sub.toLowerCase();
          // Regex to safely find "Môn học abc" or "Môn: abc" specifically inside the text content
          const escapedSub = lowerSub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex
          const regex = new RegExp(`môn(?:\\s+học)?(?:[\\s:]+)(${escapedSub})(?!\\w)`);
          if (
            lowerPageText.includes(`môn ${lowerSub}`) ||
            lowerPageText.includes(`môn học: ${lowerSub}`) ||
            lowerPageText.includes(`môn: ${lowerSub}`) ||
            regex.test(lowerPageText)
          ) {
            subject = sub;
            break;
          }
        }
      }

      if (!subject) {
        for (const val of valSet) {
          const lowVal = val.toLowerCase();

          // Match explicit pattern in valSet e.g., (...)
          let matchSpecific = val.match(/\(([^)]+)\)/);
          if (matchSpecific) {
            let inner = matchSpecific[1].trim().toLowerCase();
            let found = baseSubs.find((s) => s.toLowerCase() === inner);
            if (!found) {
              for (const [vnEduName, ourName] of Object.entries(vnEduSubMap)) {
                if (vnEduName.toLowerCase() === inner) {
                  found = ourName;
                  break;
                }
              }
            }
            if (found) {
              subject = found;
              break;
            }
          }

          // Match exact vnedu map in valSet
          for (const [vnEduName, ourName] of Object.entries(vnEduSubMap)) {
            if (
              vnEduName.toLowerCase() === lowVal ||
              lowVal.includes(vnEduName.toLowerCase())
            ) {
              subject = ourName;
              break;
            }
          }
          if (subject) break;

          // Loose match in valSet
          for (const sub of baseSubs) {
            if (
              sub.toLowerCase() === lowVal ||
              lowVal.includes(sub.toLowerCase())
            ) {
              subject = sub;
              break;
            }
          }

          if (subject) break;
        }
      }

      if (!subject && baseSubs.length > 0) subject = baseSubs[0];
    }

    const getEmptySubjectVnEdu = (mon, kyDanhGia) => {
      const m = mon ? mon.toLowerCase() : "môn học";
      const kyText =
        kyDanhGia === "Cả Năm Mặc định"
          ? "trong năm học này"
          : `trong ${kyDanhGia.toLowerCase()}`;

      const th_T = [
        `Em nắm vững kiến thức trọng tâm môn ${m}, thể hiện xuất sắc ${kyText}.`,
        `Có kĩ năng thực hành thành thạo môn ${m}, tư duy nhạy bén ${kyText}.`,
        `Thường xuyên chủ động, sáng tạo khi hoàn thành các bài học môn ${m} ${kyText}.`,
        `Tích cực tham gia xây dựng bài, có ý thức tự học đáng khen ngợi ${kyText}.`,
        `Tiếp thu bài nhanh môn ${m}, biết vận dụng kiến thức vào giải quyết vấn đề hiệu quả ${kyText}.`,
        `Luôn hoàn thành xuất sắc các bài tập môn ${m} được giao, là tấm gương sáng ${kyText}.`,
        `Có năng lực tư duy logic tốt đối với môn ${m}, kết quả học tập vượt trội ${kyText}.`,
        `Chăm ngoan, đánh giá môn ${m} đạt nhiều thành tích cao ${kyText}.`,
        `Khả năng nắm bắt kiến thức môn ${m} sâu sắc, trình bày mạch lạc ${kyText}.`,
        `Luôn cố gắng vươn lên, duy trì kết quả học tập môn ${m} rất xuất sắc ${kyText}.`,
        `Tiến bộ rõ rệt trong kỹ năng và kiến thức môn ${m}, kết quả rất đáng khích lệ ${kyText}.`,
        `Năng động, tự tin trong các hoạt động, nắm vững môn ${m} ${kyText}.`,
        `Phát huy tốt khả năng tự học tự rèn môn ${m}, hoàn thành xuất sắc yêu cầu ${kyText}.`,
        `Kết quả đánh giá môn ${m} phản ánh đúng sự nỗ lực ${kyText}.`,
        `Quan sát tốt, nhạy bén và xử lý linh hoạt trong môn ${m} ${kyText}.`,
        `Nắm chắc lý thuyết và vận dụng thực hành rất hiệu quả môn ${m} ${kyText}.`,
        `Thể hiện sự tập trung cao độ, thái độ học tập môn ${m} nghiêm túc ${kyText}.`,
        `Có tinh thần trách nhiệm cao môn ${m}, ghi nhớ kiến thức rất tốt ${kyText}.`,
        `Giao tiếp tự tin, trả lời các vấn đề môn ${m} rất mạch lạc ${kyText}.`,
        `Em có năng khiếu học tốt môn ${m}, tư duy sáng tạo phát triển ${kyText}.`,
      ];

      const th_H = [
        `Em nắm được kiến thức nền tảng vững vàng môn ${m}, có cố gắng ${kyText}.`,
        `Hoàn thành tốt các nhiệm vụ được giao môn ${m}, cần mạnh dạn phát biểu hơn ${kyText}.`,
        `Có ý thức học tập tốt, kĩ năng làm bài môn ${m} có tiến bộ trưởng thành ${kyText}.`,
        `Hiểu và vận dụng cơ bản kiến thức môn ${m}, thái độ học tập tích cực ${kyText}.`,
        `Làm bài môn ${m} cẩn thận, biết rèn luyện kĩ năng, kết quả đạt mức khá ${kyText}.`,
        `Cần rèn luyện thêm chút tự tin môn ${m}, thành tích em có thể vươn xa ${kyText}.`,
        `Nắm vững yêu cầu môn ${m}, chăm chỉ ôn tập ${kyText}.`,
        `Biết ứng dụng kiến thức môn ${m} vào thực tế ở mức độ khá ${kyText}.`,
        `Luôn chú ý nghe giảng môn ${m}, tự giác học tập ở nhà tốt ${kyText}.`,
        `Hiểu ý chính của bài giảng môn ${m}, nhưng cần diễn đạt trọn vẹn hơn ${kyText}.`,
        `Tiếp thu bài môn ${m} ở mức khá, cần đọc kỹ bài hơn để tránh sai sót ${kyText}.`,
        `Có tiến bộ trong quá trình học môn ${m}, tập trung hơn nữa sẽ thành công ${kyText}.`,
        `Em có khả năng môn ${m} phát triển tốt nếu khắc phục sự nhút nhát ${kyText}.`,
        `Đạt yêu cầu môn ${m}, cần trau dồi thêm kĩ năng để nâng cao thành tích ${kyText}.`,
        `Ghi chép bài đầy đủ môn ${m}, nhận thức đạt mức khá ${kyText}.`,
        `Có khả năng ghi nhớ nội dung tương đối tốt môn ${m}, hoàn thành yêu cầu ${kyText}.`,
        `Tinh thần học tập làm bài môn ${m} tích cực, duy trì điểm số ở mức tốt ${kyText}.`,
        `Biết cách học bài môn ${m} hiệu quả, nắm vững các bài học thiết yếu ${kyText}.`,
        `Nỗ lực vươn lên môn ${m} nhưng đôi lúc làm bài kiểm tra còn thiếu cẩn thận ${kyText}.`,
        `Đáp ứng được yêu cầu về kiến thức và kĩ năng môn ${m} ở mức khá ${kyText}.`,
      ];

      const th_C = [
        `Em chưa nắm vững kiến thức môn ${m}, cần cố gắng rất nhiều ${kyText}.`,
        `Kĩ năng nhận thức môn ${m} còn hạn chế, cần gia đình quan tâm hơn ${kyText}.`,
        `Đôi lúc thiếu tập trung trong giờ học môn ${m}, kết quả chưa tốt ${kyText}.`,
        `Dành khoảng thời gian ưu tiên ôn lại kiến thức cơ bản môn ${m} bị hổng ${kyText}.`,
        `Nhận thức môn ${m} chưa đạt yêu cầu, cần mạnh dạn trao đổi cùng thầy cô ${kyText}.`,
      ];

      const thcs_Tot = th_T.map((c) => c.replace(/\.$/, ` (Mức Tốt).`));
      const thcs_Kha = th_H.map((c) => c.replace(/\.$/, ` (Mức Khá).`));
      const thcs_Dat = [
        `Nắm được kiến thức cơ bản môn ${m}, biết cách làm bài nhưng chưa sáng tạo ${kyText}.`,
        `Kết quả môn ${m} đạt mức trung bình, cần rèn tư duy thêm ${kyText}.`,
        `Phần lớn các yêu cầu môn ${m} đã được hoàn thành nhưng còn sơ suất nhỏ ${kyText}.`,
      ];
      const thcs_ChuaDat = th_C.map((c) => c.replace(/\.$/, ` (Chưa Đạt).`));

      return {
        Tốt: { min: 8, max: 10, code: "T", mucDG: "T", comments: thcs_Tot },
        Khá: { min: 6.5, max: 7.9, code: "K", mucDG: "H", comments: thcs_Kha },
        Đạt: { min: 5, max: 6.4, code: "Đ", mucDG: "H", comments: thcs_Dat },
        "Chưa Đạt": {
          min: 0,
          max: 4.9,
          code: "CĐ",
          mucDG: "C",
          comments: thcs_ChuaDat,
        },
        T: { min: 8, max: 10, code: "T", mucDG: "T", comments: th_T },
        H: { min: 5, max: 7.9, code: "H", mucDG: "H", comments: th_H },
        C: { min: 0, max: 4.9, code: "C", mucDG: "C", comments: th_C },
      };
    };

    const getgetCommentsPoolInner = (poolTarget) => {
      try {
        if (poolTarget === "GVBM") {
          const sObj1 = db[capHoc][khoiLop].GVBM[`${subject}_${detectedHocKy}`];
          const sObj2 = db[capHoc][khoiLop].GVBM[`${subject}_Học kỳ 1`];
          const sObj3 = db[capHoc][khoiLop].GVBM[`${subject}_Học kỳ 2`];
          const sObj4 = db[capHoc][khoiLop].GVBM[subject];
          const found = sObj1 || sObj2 || sObj3 || sObj4;
          if (found) return found;
        }
        if (poolTarget === "TH_NLPC") return db[capHoc][khoiLop].TH_NLPC;
        if (poolTarget === "DGTX") return db[capHoc][khoiLop].DGTX;
        if (poolTarget === "HIEU_TRUONG") return db[capHoc][khoiLop].HIEU_TRUONG;
        if (poolTarget === "HOC_BA_GVBM") return db[capHoc][khoiLop].HOC_BA_GVBM;
        if (poolTarget === "HOC_BA_GVCN") return db[capHoc][khoiLop].HOC_BA_GVCN;
        if (poolTarget === "VNEDU_NLPC_HB") return db[capHoc][khoiLop].VNEDU_NLPC_HB;
      } catch (e) {
        return null;
      }
      return null;
    };
    const getCommentsPool = () => getgetCommentsPoolInner(role);
    const getGvbmPool = () => getgetCommentsPoolInner("GVBM");
    const commentsPool = getCommentsPool();
    const gvbmPool = getGvbmPool();
    if (!commentsPool)
      throw new Error(
        "Kh\xF4ng t\xECm th\u1EA5y kho nh\u1EADn x\xE9t ph\xF9 h\u1EE3p.",
      );
    if (role === "DGTX") {
      return await dienNhanXetDGTXAsync(
        config,
        commentsPool,
        capHoc,
        subject,
        khoiLop,
      );
    }
    if (role === "TH_NLPC") {
      return await dienNhanXetNLPCAsync(config, commentsPool, subject);
    }
    let is532 = window.location.href.includes("5.3.2") || textToCheckRole.includes("5.3.2") ||
      ((capHoc !== "TH") && (textToCheckRole.includes("nh\u1EADn x\xE9t m\xF4n h\u1ECDc") || textToCheckRole.includes("nhận xét môn học")));
    if (
      role === "HOC_BA_GVCN" ||
      (role === "HOC_BA_GVBM" && !is532) ||
      role === "HIEU_TRUONG"
    ) {
      return await dienNhanXetHocBaRandom(config, commentsPool, subject);
    }
    if (role === "VNEDU_NLPC_HB") {
      return await dienNhanXetVNEDUNLPC(config, commentsPool);
    }
    const getRandom = (arr) =>
      arr && arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : "";
    const dispatchEvents = (element) => {
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.dispatchEvent(new Event("blur", { bubbles: true }));
    };

    let keepScrolling = true;
    let loopProtect = 0;
    let emptyPassCount = 0;
    let successCount = 0;
    let successfulRows = new Set();
    let processedRows = new Set();
    let visibleTextareas = [];

    // PATCH VNEDU POPUPS
    const patchVnEduPopups = () => {
      try {
        const script = document.createElement("script");
        script.textContent = `
          if (window.radalert) window.radalert = function() { console.log('Suppressed radalert'); return false; };
          if (window.radconfirm) window.radconfirm = function() { console.log('Suppressed radconfirm'); return false; };
          if (window.confirm) {
            const oldConfirm = window.confirm;
            window.confirm = function(msg) {
              if (msg.includes('đóng ứng dụng') || msg.includes('chưa lưu')) return true;
              return oldConfirm(msg);
            };
          }
        `;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
      } catch (e) {}
    };
    patchVnEduPopups();

    while (keepScrolling && loopProtect < 40) {
      loopProtect++;
      let filledInThisPass = 0;

      let selector = "textarea, input[type='text'], input:not([type]), div[contenteditable='true']";
      let allTextareas = Array.from(
        document.querySelectorAll(selector)
      );
      visibleTextareas = allTextareas.filter((ta) => {
        if (ta.offsetWidth === 0 || ta.offsetHeight === 0) return false;
        if (ta.tagName.toLowerCase() === "input") {
             if (ta.offsetWidth < 50) return false;
             if (ta.maxLength > 0 && ta.maxLength <= 15) return false;
        }
        let p = ta.closest("tr, [role='row']");
        if (p && p.innerText.toLowerCase().includes("nhập vào đây và enter")) return false;
        if (ta.placeholder && ta.placeholder.toLowerCase().includes("nhập vào đây và enter")) return false;
        if (ta.value && ta.value.toLowerCase().includes("nhập vào đây và enter")) return false;
        let rect = ta.getBoundingClientRect();
        return (
          rect.width >= 50 &&
          getComputedStyle(ta).visibility !== "hidden" &&
          !ta.disabled &&
          !ta.readOnly
        );
      });

      let rowToTextareas = new Map();
      for (let ta of visibleTextareas) {
        let row = ta.closest("tr, [role='row']");
        if (!row) continue;
        if (!rowToTextareas.has(row)) rowToTextareas.set(row, []);
        rowToTextareas.get(row).push(ta);
      }

      let finalTargets = [];
      for (let tas of rowToTextareas.values()) {
        let actualTAs = tas;
        
        // If the row contains both INPUT and TEXTAREA, assume INPUT is "Mã nhận xét" and filter it out.
        let hasTextarea = actualTAs.some(ta => ta.tagName.toLowerCase() === "textarea" || ta.tagName.toLowerCase() === "div");
        if (hasTextarea) {
           actualTAs = actualTAs.filter(ta => ta.tagName.toLowerCase() !== "input");
        }

        if (actualTAs.length > 1) {
          // In SMAS 5.3.2 (HK2), there are two textareas per row. We must fill both!
          if (actualTAs.length > 1) {
            actualTAs[0].dataset.targetRole = "GVBM";
            actualTAs[1].dataset.targetRole = "HOC_BA_GVBM";
            finalTargets.push(...actualTAs);
          } else if (actualTAs.length === 1) {
            if (is532) actualTAs[0].dataset.targetRole = "GVBM";
            finalTargets.push(actualTAs[0]);
          }
        } else if (actualTAs.length === 1) {
          if (is532) actualTAs[0].dataset.targetRole = "GVBM";
          finalTargets.push(actualTAs[0]);
        }
      }
      visibleTextareas = finalTargets;
      for (let i = 0; i < visibleTextareas.length; i++) {
        let oNoiDung = visibleTextareas[i];

        // Check if already processed OR already has content that looks like ours
        let val = (
          oNoiDung.tagName.toLowerCase() === "div"
            ? oNoiDung.innerText
            : oNoiDung.value || ""
        ).trim();
        if (val.length > 10 && loopProtect > 1) continue;

        let row = oNoiDung.closest("tr, [role='row']");
        if (!row) continue;
        let studentKey = "";
        let rowCellsA = row.cells ? Array.from(row.cells) : Array.from(row.querySelectorAll("td, [role='cell']"));
        if (rowCellsA.length > 0) {
          for (let c = 0; c < Math.min(rowCellsA.length, 4); c++) {
            studentKey += (rowCellsA[c].innerText || "").trim() + "_";
          }
        }
        let key = studentKey;
        let visibleTds = Array.from(row.querySelectorAll("td, [role='cell']")).filter(
          (td) => td.offsetWidth > 0,
        );
        let tdNoiDung = oNoiDung.closest("td, [role='cell']");
        let idxNoiDung = visibleTds.indexOf(tdNoiDung);
        
        if (key) {
           key += `_${idxNoiDung}`;
        }
        if (key && processedRows.has(key)) continue;
        if (key) processedRows.add(key);

        try {
          if (idxNoiDung < 1) continue;

          let mucDatDuoc = "";
          let oMaNX = null;
          let currentManualCode = "";

          if (
            isVnEdu &&
            !window.location.href.includes("5.3.2") &&
            !textToCheckRole.includes("5.3.2")
          ) {
            // vnEdu "Sổ nhận xét" & "Sổ điểm" logic
            let colMap = [];

            // First try to find explicit header text mapping by scanning header rows
            let headerRow = Array.from(document.querySelectorAll("tr")).find(
              (r) =>
                r.innerText.includes("Họ và tên") ||
                r.innerText.includes("STT"),
            );
            if (headerRow) {
              let ths = Array.from(headerRow.querySelectorAll("th, td"));
              for (let th of ths) {
                if (th.offsetWidth > 0 || th.offsetHeight > 0) {
                  let span = parseInt(th.getAttribute("colspan")) || 1;
                  let text = th.innerText.toUpperCase().replace(/\s+/g, " ");
                  for (let s = 0; s < span; s++) colMap.push(text);
                }
              }
            }

            let targetColIdx = -1;
            if (colMap.length > 0) {
              let evalHeaders = [
                "TB CẢ NĂM",
                "TBCN",
                "TB CN",
                "XL CN",
                "XL CK2",
                "KT CK2",
                "XL GK2",
                "KT GK2",
                "XL CK1",
                "KT CK1",
                "XL GK1",
                "KT GK1",
                "XL",
                "KT",
                "ĐTBMHK",
                "TBHK 2",
                "TBHK2",
                "TBHK 1",
                "TBHK1",
                "ĐĐGCK",
                "ĐĐG CK",
                "ĐĐGGK",
                "ĐĐG GK",
                "ĐĐG GK1",
                "ĐĐG GK2",
              ];

              for (let ext of evalHeaders) {
                for (let c = 0; c < colMap.length; c++) {
                  if (c === idxNoiDung) continue;
                  if (colMap[c].includes(ext)) {
                    targetColIdx = c;
                    break;
                  }
                }
                if (targetColIdx !== -1) break;
              }

              if (targetColIdx !== -1 && targetColIdx < visibleTds.length) {
                let cellText = visibleTds[targetColIdx].innerText
                  .trim()
                  .toUpperCase();
                if (!cellText && visibleTds[targetColIdx].textContent) {
                  cellText = visibleTds[targetColIdx].textContent
                    .trim()
                    .toUpperCase();
                }
                let inputs = Array.from(
                  visibleTds[targetColIdx].querySelectorAll("input"),
                ).filter((i) => i.type !== "hidden");
                let inputDiem = inputs.length > 0 ? inputs[0] : null;
                mucDatDuoc =
                  inputDiem &&
                  inputDiem.value !== undefined &&
                  inputDiem.value.trim()
                    ? inputDiem.value.trim().toUpperCase()
                    : cellText;
              }
            }

            // Fallback for Sổ nhận xét if nothing matched (search forward for levels)
            if (targetColIdx === -1 && idxNoiDung + 1 < visibleTds.length) {
              for (let c = idxNoiDung + 1; c < visibleTds.length; c++) {
                let cellText = visibleTds[c].innerText.trim().toUpperCase();
                if (!cellText && visibleTds[c].textContent) {
                  cellText = visibleTds[c].textContent.trim().toUpperCase();
                }
                let inputs = Array.from(
                  visibleTds[c].querySelectorAll("input"),
                ).filter((i) => i.type !== "hidden");
                let inputDiem = inputs.length > 0 ? inputs[0] : null;
                let val =
                  inputDiem &&
                  inputDiem.value !== undefined &&
                  inputDiem.value.trim()
                    ? inputDiem.value.trim().toUpperCase()
                    : cellText;

                let possibleVals = [val, cellText];
                for (let pv of possibleVals) {
                  if (
                    pv &&
                    ([
                      "T",
                      "H",
                      "C",
                      "Đ",
                      "K",
                      "G",
                      "TB",
                      "Y",
                      "CĐ",
                      "HTT",
                      "HT",
                      "CHT",
                    ].includes(pv) ||
                      (!isNaN(parseFloat(pv.replace(",", "."))) &&
                        parseFloat(pv.replace(",", ".")) <= 10 && pv.match(/^[0-9]+([.,][0-9]+)?$/)))
                  ) {
                    mucDatDuoc = pv;
                    break;
                  }
                }
                if (mucDatDuoc) break;
              }
            }

            // Fallback for Sổ điểm if nothing found (search backward for any score)
            if (targetColIdx === -1 && !mucDatDuoc && idxNoiDung > 1) {
              for (let c = idxNoiDung - 1; c >= 1; c--) {
                let cellText = visibleTds[c].innerText.trim().toUpperCase();
                if (!cellText && visibleTds[c].textContent) {
                  cellText = visibleTds[c].textContent.trim().toUpperCase();
                }
                let inputs = Array.from(
                  visibleTds[c].querySelectorAll("input"),
                ).filter((i) => i.type !== "hidden" && (!i.className || (typeof i.className === 'string' && !i.className.includes("hidden"))));
                let inputDiem = inputs.length > 0 ? inputs[0] : null;
                let val =
                  inputDiem &&
                  inputDiem.value !== undefined &&
                  inputDiem.value.trim()
                    ? inputDiem.value.trim().toUpperCase()
                    : cellText;

                if (
                  val &&
                  !isNaN(parseFloat(val.replace(",", "."))) &&
                  parseFloat(val.replace(",", ".")) <= 10 &&
                  val.match(/^[0-9]+([.,][0-9]+)?$/)
                ) {
                  mucDatDuoc = val;
                  break;
                }
              }
            }

            // Mới thêm: Ưu tiên điểm số (chỉ áp dụng ở HK2)
            if (mucDatDuoc && isNaN(parseFloat(mucDatDuoc.replace(",", "."))) && detectedHocKy === "Học kỳ 2" && !isGiuaKy) {
                // Đang là đánh giá chữ (T/H/C/Đ...), cố gắng tìm kiếm lấy điểm số
                let foundNumeric = false;
                
                let colsToCheck = [];
                for (let c = 1; c < visibleTds.length; c++) {
                    if (c !== idxNoiDung) colsToCheck.push(c);
                }
                // Sort by distance to idxNoiDung to prioritize closer columns
                colsToCheck.sort((a, b) => Math.abs(a - idxNoiDung) - Math.abs(b - idxNoiDung));

                for (let c of colsToCheck) {
                    let cellText = visibleTds[c].innerText.trim().toUpperCase();
                    let inputs = Array.from(visibleTds[c].querySelectorAll("input, .rcbInput")).filter(i => i.type !== "hidden" && (!i.className || (typeof i.className === 'string' && !i.className.includes("hidden"))));
                    let inputDiem = inputs.length > 0 ? inputs[0] : null;
                    let val = inputDiem && inputDiem.value !== undefined && inputDiem.value.trim() ? inputDiem.value.trim().toUpperCase() : cellText;
                    if (val && !isNaN(parseFloat(val.replace(",", "."))) && parseFloat(val.replace(",", ".")) <= 10 && val.match(/^[0-9]+([.,][0-9]+)?$/)) {
                        mucDatDuoc = val;
                        foundNumeric = true;
                        break;
                    }
                }
                
                if (!foundNumeric && !isGiuaKy && capHoc === "TH" && role === "GVBM" && !is532) {
                    const s = subject ? subject.toLowerCase() : "";
                    const isGraded = s.includes("tiếng việt") || s.includes("toán") || s.includes("khoa học") || s.includes("lịch sử") || s.includes("địa lí") || s.includes("địa lý") || s.includes("ngoại ngữ") || s.includes("tiếng anh") || s.includes("tin học") || s.includes("công nghệ");
                    if (isGraded) {
                        mucDatDuoc = ""; // Bắt buộc lấy điểm đối với môn có chấm điểm
                    }
                }
            }

            // FINAL fallback for VnEdu SMAS-style 5.3.2 tables
            if (!mucDatDuoc && idxNoiDung >= 2) {
              let tdMaNX = visibleTds[idxNoiDung - 1];
              let tdDiem = visibleTds[idxNoiDung - 2];
              oMaNX = tdMaNX
                ? tdMaNX.querySelector('input:not([type="hidden"])')
                : null;
              let inputsDiem = tdDiem.querySelectorAll("input");
              let inputDiem =
                Array.from(inputsDiem).find((i) => i.type !== "hidden") || null;
              if (inputDiem) {
                mucDatDuoc = inputDiem.value.trim().toUpperCase();
              } else {
                mucDatDuoc = tdDiem.innerText.trim().toUpperCase();
              }
              currentManualCode = oMaNX ? oMaNX.value.trim() : "";
            }
          } else {
            if (idxNoiDung < 1) continue; 
            
            // Scan backwards to find the score column, similar to VnEdu fallback
            let possibleMatches = [];
            for (let c = idxNoiDung - 1; c >= 1; c--) {
              let cellText = visibleTds[c].innerText.trim().toUpperCase();
              if (!cellText && visibleTds[c].textContent) {
                cellText = visibleTds[c].textContent.trim().toUpperCase();
              }
              let inputs = Array.from(visibleTds[c].querySelectorAll("input, .rcbInput")).filter((i) => i.type !== "hidden" && (!i.className || (typeof i.className === 'string' && !i.className.includes("hidden"))));
              let inputDiem = inputs.length > 0 ? inputs[0] : null;
              let val = inputDiem && inputDiem.value !== undefined && inputDiem.value.trim() ? inputDiem.value.trim().toUpperCase() : cellText;
              
              if (
                val && (
                  ["T", "H", "C", "K", "Đ", "CĐ", "TỐT", "KHÁ", "ĐẠT", "CHƯA ĐẠT", "HTT", "HT", "CHT"].includes(val) ||
                  (!isNaN(parseFloat(val.replace(",", "."))) && parseFloat(val.replace(",", ".")) <= 10 && val.match(/^[0-9]+([.,][0-9]+)?$/))
                )
              ) {
                possibleMatches.push({ val: val, c: c });
              }
            }
            
            if (possibleMatches.length > 0) {
              let bestMatch = possibleMatches[0];
              
              // Nếu xuất hiện cả điểm số và mức đánh giá, ưu tiên lấy điểm số (đặc biệt khi ở HK2)
              let numericMatch = possibleMatches.find(m => !isNaN(parseFloat(m.val.replace(",", "."))) && m.val.match(/^[0-9]+([.,][0-9]+)?$/));
              let letterMatch = possibleMatches.find(m => ["T", "H", "C", "K", "Đ", "CĐ", "TỐT", "KHÁ", "ĐẠT", "CHƯA ĐẠT", "HTT", "HT", "CHT"].includes(m.val));

              if (numericMatch && detectedHocKy === "Học kỳ 2" && !isGiuaKy) {
                bestMatch = numericMatch;
              } else if (!numericMatch && detectedHocKy === "Học kỳ 2" && !isGiuaKy && capHoc === "TH" && role === "GVBM" && !is532) {
                const s = subject ? subject.toLowerCase() : "";
                const isGraded = s.includes("tiếng việt") || s.includes("toán") || s.includes("khoa học") || s.includes("lịch sử") || s.includes("địa lí") || s.includes("địa lý") || s.includes("ngoại ngữ") || s.includes("tiếng anh") || s.includes("tin học") || s.includes("công nghệ");
                if (isGraded) {
                  bestMatch = { val: "", c: bestMatch.c }; // Bắt buộc lấy điểm số đối với các môn tính điểm
                }
              } else if (isGiuaKy && letterMatch) {
                bestMatch = letterMatch;
              }
              
              mucDatDuoc = bestMatch.val;
              let c = bestMatch.c;
              
              // Mã NX is usually the cell right after the score
              if (c + 1 < idxNoiDung) {
                let tdMaNX = visibleTds[c + 1];
                oMaNX = tdMaNX ? tdMaNX.querySelector('input:not([type="hidden"])') : null;
                currentManualCode = oMaNX ? oMaNX.value.trim() : "";
              }
            }
          }

          if (!mucDatDuoc) {
            const roleNoScore =
              role === "HOC_BA_GVCN" ||
              role === "HIEU_TRUONG" ||
              role === "DGTX" ||
              (role === "GVBM" && is532) ||
              currentManualCode;
            if (!roleNoScore) {
              console.warn(
                `Hàng ${i}: Cột Mức đánh giá trống hoặc không có dữ liệu. Bỏ qua.`,
              );
              skippedNoScore++;
              continue;
            }
          }

          let timKiemKhoNhanXet = (muc, manualCode, poolToUse) => {
            if (!poolToUse) return null;
            if (manualCode) {
              let mCodeUpper = manualCode.toUpperCase();
              for (const [lvl, conf] of Object.entries(poolToUse)) {
                if (conf.code && conf.code.toUpperCase() === mCodeUpper) {
                  return {
                    noiDungNhanXet: getRandom(conf.comments),
                    maNX: conf.code || "",
                  };
                }
              }
            }
            if (!muc) {
              let allComments = [];
              for (let p of Object.values(poolToUse)) {
                if (p && p.comments)
                  allComments = allComments.concat(p.comments);
              }
              if (allComments.length > 0) {
                return { noiDungNhanXet: getRandom(allComments), maNX: "" };
              }
              return null;
            }
            let diem = parseFloat(muc.replace(",", "."));
            let isSo = !isNaN(diem) && /^\d/.test(muc);
            for (const [lvl, conf] of Object.entries(poolToUse)) {
              if (
                ["T", "H", "C", "K", "Đ"].includes(lvl) &&
                poolToUse["Tốt"]
              )
                continue;
              if (isSo) {
                if (diem >= (conf.min ?? -1) && diem <= (conf.max ?? 11)) {
                  return {
                    noiDungNhanXet: getRandom(conf.comments),
                    maNX: conf.code || "",
                  };
                }
              } else {
                let target = (conf.mucDG || conf.code || lvl).toUpperCase();
                let m = muc.toUpperCase();
                if (target === m || lvl.toUpperCase() === m) {
                  return {
                    noiDungNhanXet: getRandom(conf.comments),
                    maNX: conf.code || "",
                  };
                }
                const groupT = [
                  "T",
                  "HTT",
                  "T\u1ED0T",
                  "HO\xC0N TH\xC0NH T\u1ED0T",
                ];
                const groupH = ["H", "HT", "HO\xC0N TH\xC0NH", "KH\xC1", "\u0110", "\u0110\u1EA0T"];
                const groupC = [
                  "C",
                  "CHT",
                  "CH\u01AFA HO\xC0N TH\xC0NH",
                  "CH\u01AFA \u0110\u1EA0T",
                  "C\u0110"
                ];
                if (
                  groupT.includes(m) &&
                  (groupT.includes(target) ||
                    groupT.includes(lvl.toUpperCase()))
                )
                  return {
                    noiDungNhanXet: getRandom(conf.comments),
                    maNX: conf.code || "",
                  };
                if (
                  groupH.includes(m) &&
                  (groupH.includes(target) ||
                    groupH.includes(lvl.toUpperCase()))
                )
                  return {
                    noiDungNhanXet: getRandom(conf.comments),
                    maNX: conf.code || "",
                  };
                if (
                  groupC.includes(m) &&
                  (groupC.includes(target) ||
                    groupC.includes(lvl.toUpperCase()))
                )
                  return {
                    noiDungNhanXet: getRandom(conf.comments),
                    maNX: conf.code || "",
                  };
              }
            }
            return null;
          };
          
          let currentPool = commentsPool;
          if (oNoiDung.dataset.targetRole === "GVBM") {
            currentPool = gvbmPool;
          }          
          let matchedData = timKiemKhoNhanXet(mucDatDuoc, currentManualCode, currentPool);
          if (matchedData) {
            let tenHS = "Em";
            let rowCellsB = row.cells ? Array.from(row.cells) : Array.from(row.querySelectorAll("td, [role='cell']"));
            if (rowCellsB.length > 0) {
              for (let c = 1; c < Math.min(rowCellsB.length, 4); c++) {
                let tdItem = rowCellsB[c];
                let txt = tdItem ? tdItem.innerText.trim() : "";
                if (
                  txt &&
                  isNaN(parseFloat(txt)) &&
                  txt.includes(" ") &&
                  !txt.match(/^[0-9\/]+$/)
                ) {
                  tenHS = txt.split(" ").pop();
                  break;
                }
              }
            }
            let finalComment = matchedData.noiDungNhanXet
              .replace(/{HocSinh}/g, tenHS)
              .replace(/{Môn}/g, subject);
            if (oNoiDung.tagName.toLowerCase() === "div") {
              oNoiDung.innerText = finalComment;
            } else {
              oNoiDung.value = finalComment;
            }
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
            if (oNoiDung.tagName.toLowerCase() === 'textarea' && nativeTextAreaValueSetter) {
                nativeTextAreaValueSetter.call(oNoiDung, finalComment);
            } else if (oNoiDung.tagName.toLowerCase() === 'input' && nativeInputValueSetter) {
                nativeInputValueSetter.call(oNoiDung, finalComment);
            }
            oNoiDung.dispatchEvent(new Event("input", { bubbles: true }));
            oNoiDung.dispatchEvent(new Event("change", { bubbles: true }));
            oNoiDung.dispatchEvent(new Event("blur", { bubbles: true }));
            let dienMa = config.autoFillCode !== false;
            if (oMaNX && dienMa && matchedData.maNX) {
              oMaNX.value = matchedData.maNX;
              if (oMaNX.tagName.toLowerCase() === 'input' && nativeInputValueSetter) {
                  nativeInputValueSetter.call(oMaNX, matchedData.maNX);
              }
              oMaNX.dispatchEvent(new Event("input", { bubbles: true }));
              oMaNX.dispatchEvent(new Event("change", { bubbles: true }));
              oMaNX.dispatchEvent(new Event("blur", { bubbles: true }));
            }
            if (studentKey && !successfulRows.has(studentKey)) {
              successfulRows.add(studentKey);
              successCount++;
            } else if (!studentKey) {
              successCount++;
            }
            filledInThisPass++;
            if (filledInThisPass % 15 === 0)
              await new Promise((r) => setTimeout(r, 10));
          } else {
            console.warn(
              `Hàng ${i}: Không tìm thấy lời phê phù hợp cho mức ${mucDatDuoc}`,
            );
          }
        } catch (e) {
          console.error(`L\u1ED7i t\u1EA1i h\xE0ng ${i}:`, e);
        }
      }

      if (filledInThisPass === 0) {
        emptyPassCount++;
        if (emptyPassCount > 1) keepScrolling = false;
        else {
          let containers = Array.from(document.querySelectorAll('*')).filter(el => {
             if (el.tagName === 'BODY' || el.tagName === 'HTML') return false;
             const style = getComputedStyle(el);
             return el.scrollHeight > el.clientHeight + 10 && 
                    (style.overflowY === 'auto' || style.overflowY === 'scroll');
          });
          if (containers.length === 0) {
              containers = document.querySelectorAll(
                ".rgDataDiv, .RadGrid, div[style*='overflow'], .x-grid-view, .x-grid3-scroller, .x-scroller, .x-panel-body"
              );
          }
          containers.forEach((c) => {
            c.scrollTop += 800;
            c.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
          window.scrollBy(0, 800);
          
          let lastElement = visibleTextareas[visibleTextareas.length - 1];
          if (lastElement) {
             lastElement.scrollIntoView({ behavior: "instant", block: "end" });
          }
          
          await new Promise((r) => setTimeout(r, 600));
        }
      } else {
        emptyPassCount = 0;
        let lastElement = visibleTextareas[visibleTextareas.length - 1];
        if (lastElement) {
          lastElement.scrollIntoView({ behavior: "instant", block: "end" });
          let trs = Array.from(document.querySelectorAll("tbody tr")).filter(
            (tr) => tr.offsetHeight > 0,
          );
          if (trs.length > 0)
            trs[trs.length - 1].scrollIntoView({
              behavior: "instant",
              block: "end",
            });

          let containers = Array.from(document.querySelectorAll('*')).filter(el => {
             if (el.tagName === 'BODY' || el.tagName === 'HTML') return false;
             const style = getComputedStyle(el);
             return el.scrollHeight > el.clientHeight + 10 && 
                    (style.overflowY === 'auto' || style.overflowY === 'scroll');
          });
          if (containers.length === 0) {
              containers = document.querySelectorAll(
                ".rgDataDiv, .RadGrid, div[style*='overflow'], .x-grid-view, .x-grid3-scroller, .x-scroller, .x-panel-body"
              );
          }
          containers.forEach((c) => {
            if (c.scrollHeight > c.clientHeight) {
              c.scrollTop += 600;
              c.dispatchEvent(new Event("scroll", { bubbles: true }));
            }
          });
          window.scrollBy(0, 600);

          await new Promise((r) => setTimeout(r, 600));
        } else {
          keepScrolling = false;
        }
      }
    } // end while

    fillCount = successCount;
    if (fillCount === 0) {
      let row =
        visibleTextareas.length > 0 ? visibleTextareas[0].closest("tr, [role='row']") : null;
      let debugMuc = "none";
      let debugIdx = "?";
      if (row) {
        let visibleTds = Array.from(row.querySelectorAll("td, [role='cell']")).filter(
          (c) => c.offsetWidth > 0,
        );
        let tdNoiDung = visibleTextareas[0].closest("td, [role='cell']");
        let idxNoiDung = visibleTds.indexOf(tdNoiDung);
        debugIdx = idxNoiDung;
        if (idxNoiDung >= 0) {
          let nextVals = [];
          for (
            let c = idxNoiDung + 1;
            c < visibleTds.length && c <= idxNoiDung + 3;
            c++
          ) {
            let t = visibleTds[c].textContent.trim();
            let inp = visibleTds[c].querySelector("input");
            let iv = inp
              ? inp.value !== undefined
                ? inp.value.trim()
                : "no_value"
              : "no_input";
            let itype = inp ? inp.getAttribute("type") : "none";
            let h = visibleTds[c].innerHTML
              .replace(/\s+/g, " ")
              .trim()
              .substring(0, 50);
            nextVals.push(`td${c}:[${t}|${iv}|T:${itype}|${h}]`);
          }
          debugMuc = nextVals.join(", ");
        }
      }
      throw new Error(
        `Không tìm thấy cột Điểm để nhận xét môn \"${subject}\". Bạn cần phải vào điểm cho HS trước.`,
      );
    }
    
    let resSubject = subject;
    if ((capHoc === "THCS" || capHoc === "THPT") && role === "HOC_BA_GVBM" && is532) {
      resSubject = `${subject} (${detectedHocKy} + Học bạ)`;
    } else if (capHoc === "THCS" || capHoc === "THPT") {
      resSubject = `${subject} (${detectedHocKy})`;
    }
    
    return { count: fillCount, detectedMon: resSubject };
  }
  async function dienNhanXetVNEDUNLPC(config, commentsPool) {
    let allTextareas = Array.from(
      document.querySelectorAll("textarea, input[type='text'], input:not([type]), div[contenteditable='true']")
    );
    let textareas = allTextareas.filter((ta) => {
      if (ta.offsetWidth === 0 || ta.offsetHeight === 0) return false;
      let rect = ta.getBoundingClientRect();
      let placeholder = ta.getAttribute("placeholder") || "";
      if (placeholder.toLowerCase().includes("tìm kiếm")) return false;
      return (
        rect.width >= 50 &&
        getComputedStyle(ta).visibility !== "hidden" &&
        !ta.disabled &&
        !ta.readOnly &&
        ta.className.indexOf("search") === -1 // Avoid search inputs
      );
    });

    if (textareas.length === 0) {
      throw new Error("Không tìm thấy ô nhập liệu nào. Vui lòng thử click vào một học sinh ở bên trái.");
    }

    let itemsOrderParams = [
      { group: "Năng lực chung", name: "Nhận xét chung" },
      { group: "Năng lực chung", name: "Tự chủ và tự học" },
      { group: "Năng lực chung", name: "Giao tiếp và hợp tác" },
      { group: "Năng lực chung", name: "GQVĐ và sáng tạo" },

      { group: "Năng lực đặc thù", name: "Nhận xét năng lực đặc thù" },
      { group: "Năng lực đặc thù", name: "Ngôn ngữ" },
      { group: "Năng lực đặc thù", name: "Tính toán" },
      { group: "Năng lực đặc thù", name: "Khoa học" },
      { group: "Năng lực đặc thù", name: "Công nghệ" },
      { group: "Năng lực đặc thù", name: "Tin học" },
      { group: "Năng lực đặc thù", name: "Thẩm mĩ" },
      { group: "Năng lực đặc thù", name: "Thể chất" },
      
      { group: "Phẩm chất", name: "Nhận xét chung" },
      { group: "Phẩm chất", name: "Yêu nước" },
      { group: "Phẩm chất", name: "Nhân ái" },
      { group: "Phẩm chất", name: "Chăm chỉ" },
      { group: "Phẩm chất", name: "Trung thực" },
      { group: "Phẩm chất", name: "Trách nhiệm" }
    ];

    let filledCount = 0;
    
    for (let i = 0; i < textareas.length; i++) {
        let ta = textareas[i];
        
        let matchedItem = null;
        let tempWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        tempWalker.currentNode = ta;
        
        let validTexts = [];
        let checks = 0;
        while (tempWalker.previousNode() && checks < 20) {
            let t = tempWalker.currentNode.nodeValue.trim();
            if (t.length >= 2) {
                validTexts.push(t.toLowerCase());
                if (validTexts.length >= 6) break; 
            }
            checks++;
        }
        
        for (let tLower of validTexts) {
            for (let item of itemsOrderParams) {
                if (tLower.includes(item.name.toLowerCase())) {
                    if (item.name === "Nhận xét chung") {
                        let isPhamChat = validTexts.some(x => x.includes("phẩm chất") || x.includes("yêu nước"));
                        let isNangLuc = validTexts.some(x => x.includes("năng lực") || x.includes("tự chủ"));
                        if (isPhamChat && !isNangLuc) {
                             matchedItem = itemsOrderParams.find(x => x.name === "Nhận xét chung" && x.group === "Phẩm chất");
                        } else if (isNangLuc && !isPhamChat) {
                             matchedItem = itemsOrderParams.find(x => x.name === "Nhận xét chung" && x.group === "Năng lực chung");
                        } else {
                             matchedItem = itemsOrderParams.find(x => x.name === "Nhận xét chung" && x.group === "Năng lực chung");
                        }
                    } else {
                        matchedItem = item;
                    }
                    break;
                }
            }
            if (matchedItem) break;
        }

        let currentVal = ta.tagName.toLowerCase() === "div" ? ta.innerText.trim() : ta.value.trim();
        if (currentVal || !matchedItem) continue;

        let groupData = commentsPool[matchedItem.group];
        if (groupData) {
            let itemData = groupData[matchedItem.name];
            if (itemData && itemData.comments && itemData.comments.length > 0) {
                let randomComment = itemData.comments[Math.floor(Math.random() * itemData.comments.length)];
                if (config && config.removeTrailingPunctuation) {
                  randomComment = randomComment.replace(/[,.;:!\s]+$/, "");
                }

                if (ta.tagName.toLowerCase() === "div") {
                  ta.innerText = randomComment;
                } else {
                  ta.value = randomComment;
                }
                ta.dispatchEvent(new Event("input", { bubbles: true }));
                ta.dispatchEvent(new Event("change", { bubbles: true }));
                ta.dispatchEvent(new Event("blur", { bubbles: true }));
                filledCount++;
            }
        }
    }
    
    if (filledCount === 0) {
       throw new Error("Tất cả các ô hiển thị đã có nội dung (hoặc không tìm thấy ô trống hợp lệ). Để điền lại, vui lòng xóa nội dung hiện tại.");
    }
    return { count: 1, detectedMon: "Học bạ NLPC" };
  }

  async function dienNhanXetHocBaRandom(config, commentsPool, subject) {
    let allComments = [];
    if (Array.isArray(commentsPool)) {
      allComments = commentsPool;
    } else {
      for (let p of Object.values(commentsPool)) {
        if (p && p.comments) allComments = allComments.concat(p.comments);
      }
    }
    if (allComments.length === 0) {
      throw new Error(
        "Kh\xF4ng c\xF3 l\u1EDDi ph\xEA n\xE0o trong c\u1EA5u h\xECnh d\xE0nh cho ch\u1EE9c n\u0103ng n\xE0y.",
      );
    }

    let totalSuccessCount = 0;
    let keepScrolling = true;
    let loopProtect = 0;
    let emptyPassCount = 0;
    let processedRows = new Set();
    let visibleTextareas = [];
    const isVnEdu = window.location.hostname.includes("vnedu");

    while (keepScrolling && loopProtect < 30) {
      loopProtect++;
      let selector = "textarea, input[type='text'], input:not([type]), div[contenteditable='true']";
      let allTextareas = Array.from(
        document.querySelectorAll(selector)
      );
      visibleTextareas = allTextareas.filter((ta) => {
        if (ta.offsetWidth === 0 || ta.offsetHeight === 0) return false;
        if (ta.tagName.toLowerCase() === "input") {
             if (ta.offsetWidth < 50) return false;
             if (ta.maxLength > 0 && ta.maxLength <= 15) return false;
        }
        let p = ta.closest("tr, [role='row']");
        if (p && p.innerText.toLowerCase().includes("nhập vào đây và enter")) return false;
        if (ta.placeholder && ta.placeholder.toLowerCase().includes("nhập vào đây và enter")) return false;
        if (ta.value && ta.value.toLowerCase().includes("nhập vào đây và enter")) return false;
        let rect = ta.getBoundingClientRect();
        return (
          rect.width >= 50 &&
          getComputedStyle(ta).visibility !== "hidden" &&
          !ta.disabled &&
          !ta.readOnly
        );
      });

      let filledInThisPass = 0;

      for (let i = 0; i < visibleTextareas.length; i++) {
        let oNoiDung = visibleTextareas[i];
        let row = oNoiDung.closest("tr, [role='row']");
        if (!row) continue;
        
        try {
          let currentVal =
            oNoiDung.tagName.toLowerCase() === "div"
              ? oNoiDung.innerText.trim()
              : oNoiDung.value.trim();
          if (currentVal) continue;
          
          let tenHS = "Em";
          let studentKey = "";
          let rowCellsA = row.cells ? Array.from(row.cells) : Array.from(row.querySelectorAll("td, [role='cell']"));
        if (rowCellsA.length > 0) {
          for (let c = 0; c < Math.min(rowCellsA.length, 4); c++) {
              let tdItem = rowCellsA[c];
              let txt = tdItem ? tdItem.innerText.trim() : "";
              if (c > 0 && txt && isNaN(parseFloat(txt)) && txt.includes(" ") && !txt.match(/^[0-9\/]+$/) && tenHS === "Em") {
                tenHS = txt.split(" ").pop();
              }
              studentKey += txt + "_";
            }
          }

          let randomComment =
            allComments[Math.floor(Math.random() * allComments.length)];
          let finalComment = randomComment
            .replace(/{HocSinh}/g, tenHS)
            .replace(/{Môn}/g, subject || "H\u1ECDc b\u1EA1");

          if (config && config.removeTrailingPunctuation) {
            finalComment = finalComment.replace(/[,.;:!\s]+$/, "");
          }

          if (oNoiDung.tagName.toLowerCase() === "div") {
            oNoiDung.innerText = finalComment;
          } else {
            oNoiDung.value = finalComment;
          }
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
          const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
          if (oNoiDung.tagName.toLowerCase() === 'textarea' && nativeTextAreaValueSetter) {
              nativeTextAreaValueSetter.call(oNoiDung, finalComment);
          } else if (oNoiDung.tagName.toLowerCase() === 'input' && nativeInputValueSetter) {
              nativeInputValueSetter.call(oNoiDung, finalComment);
          }
          oNoiDung.dispatchEvent(new Event("input", { bubbles: true }));
          oNoiDung.dispatchEvent(new Event("change", { bubbles: true }));
          oNoiDung.dispatchEvent(new Event("blur", { bubbles: true }));
          filledInThisPass++;
          if (studentKey && !processedRows.has(studentKey)) {
             processedRows.add(studentKey);
             totalSuccessCount++;
          } else if (!studentKey) {
             totalSuccessCount++;
          }
          if (filledInThisPass % 15 === 0)
            await new Promise((r) => setTimeout(r, 10));
        } catch (e) {
          console.error(`Lỗi tại hàng Học bạ ${i}:`, e);
        }
      } // end for

      if (filledInThisPass === 0) {
        emptyPassCount++;
        if (emptyPassCount > 1) keepScrolling = false;
        else {
          let containers = Array.from(document.querySelectorAll('*')).filter(el => {
             if (el.tagName === 'BODY' || el.tagName === 'HTML') return false;
             const style = getComputedStyle(el);
             return el.scrollHeight > el.clientHeight + 10 && 
                    (style.overflowY === 'auto' || style.overflowY === 'scroll');
          });
          if (containers.length === 0) {
              containers = document.querySelectorAll(
                ".rgDataDiv, .RadGrid, div[style*='overflow'], .x-grid-view, .x-grid3-scroller, .x-scroller, .x-panel-body"
              );
          }
          containers.forEach((c) => {
            c.scrollTop += 800;
            c.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
          // Also try scrolling window
          window.scrollBy(0, 800);
          
          let lastElement = visibleTextareas[visibleTextareas.length - 1];
          if (lastElement) {
             lastElement.scrollIntoView({ behavior: "instant", block: "end" });
          }

          await new Promise((r) => setTimeout(r, 600));
        }
      } else {
        emptyPassCount = 0;
        let lastElement = visibleTextareas[visibleTextareas.length - 1];
        if (lastElement) {
          lastElement.scrollIntoView({ behavior: "instant", block: "end" });
          let trs = Array.from(document.querySelectorAll("tbody tr")).filter(
            (tr) => tr.offsetHeight > 0,
          );
          if (trs.length > 0)
            trs[trs.length - 1].scrollIntoView({
              behavior: "instant",
              block: "end",
            });

          let containers = Array.from(document.querySelectorAll('*')).filter(el => {
             if (el.tagName === 'BODY' || el.tagName === 'HTML') return false;
             const style = getComputedStyle(el);
             return el.scrollHeight > el.clientHeight + 10 && 
                    (style.overflowY === 'auto' || style.overflowY === 'scroll');
          });
          if (containers.length === 0) {
              containers = document.querySelectorAll(
                ".rgDataDiv, .RadGrid, div[style*='overflow'], .x-grid-view, .x-grid3-scroller, .x-scroller, .x-panel-body"
              );
          }
          containers.forEach((c) => {
            if (c.scrollHeight > c.clientHeight) {
              c.scrollTop += 600;
              c.dispatchEvent(new Event("scroll", { bubbles: true }));
            }
          });
          
          window.scrollBy(0, 600);

          await new Promise((r) => setTimeout(r, 600)); // wait for dom
        } else {
          keepScrolling = false;
        }
      }
    } // end while

    if (totalSuccessCount === 0) {
      throw new Error(
        "Không tìm thấy ô nhập Điểm/Nhận xét trống. (Có thể bạn chưa nhập điểm hoặc đã điền hết).",
      );
    }
    return { count: totalSuccessCount, detectedMon: "H\u1ECDc b\u1EA1 GVCN" };
  }
  async function dienNhanXetNLPCAsync(config, commentsPool) {
    let successCount = 0;
    let visibleRows = Array.from(document.querySelectorAll("tbody tr, [role='row']")).filter((row) => row.offsetHeight > 0);
    const getRandom = (arr) => arr && arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : "";
    let timKiemKhoNhanXet532 = (muc, manualCode) => {
      if (manualCode) {
        let mCodeUpper = manualCode.toUpperCase();
        for (const [lvl, conf] of Object.entries(commentsPool)) {
          if (conf.code && conf.code.toUpperCase() === mCodeUpper) {
            return { noiDungNhanXet: getRandom(conf.comments), maNX: conf.code || "" };
          }
        }
      }
      if (!muc) return null;
      for (const [lvl, conf] of Object.entries(commentsPool)) {
        if (["T", "H", "C", "K", "Đ"].includes(lvl) && commentsPool["Tốt"]) continue;
        let target = (conf.mucDG || conf.code || lvl).toUpperCase();
        let m = muc.toUpperCase();
        if (target === m || lvl.toUpperCase() === m) {
          return { noiDungNhanXet: getRandom(conf.comments), maNX: conf.code || "" };
        }
        const groupT = ["T", "HTT", "T\u1ED0T", "HO\xC0N TH\xC0NH T\u1ED0T"];
        const groupH = ["\u0110", "H", "HT", "HO\xC0N TH\xC0NH", "KH\xC1", "\u0110\u1EA0T"];
        const groupC = ["C", "CHT", "CH\u01AFA HO\xC0N TH\xC0NH", "CH\u01AFA \u0110\u1EA0T"];
        if (groupT.includes(m) && (groupT.includes(target) || groupT.includes(lvl.toUpperCase()))) return { noiDungNhanXet: getRandom(conf.comments), maNX: conf.code || "" };
        if (groupH.includes(m) && (groupH.includes(target) || groupH.includes(lvl.toUpperCase()))) return { noiDungNhanXet: getRandom(conf.comments), maNX: conf.code || "" };
        if (groupC.includes(m) && (groupC.includes(target) || groupC.includes(lvl.toUpperCase()))) return { noiDungNhanXet: getRandom(conf.comments), maNX: conf.code || "" };
      }
      return null;
    };
    for (let row of visibleRows) {
      try {
        let visibleTds = Array.from(row.querySelectorAll('td, [role="cell"]')).filter((td) => td.offsetWidth > 0);
let editables = [];
        for (let i = 0; i < visibleTds.length; i++) {
           let els = Array.from(visibleTds[i].querySelectorAll('input:not([type="hidden"]), textarea, div[contenteditable="true"]'));
           let validEls = els.filter(e => e.offsetWidth > 0 || e.offsetHeight > 0 || (e.closest('.k-dropdown-wrap') !== null) || window.getComputedStyle(e).display !== 'none');
           let el = validEls.length > 0 ? validEls[0] : els[0];
           if (el) editables.push({td: visibleTds[i], el: el, index: i});
        }

        if (editables.length < 3) continue;

        let actualTAs = [];
        let actualMas = [];
        let hasMa = false;
        
        // SMAS 5.3.2 might hide column headers inside multiple tables or weird UI.
        // We look for 'Mã' in table header or body
        let headerText = (document.querySelector('thead') ? document.querySelector('thead').innerText : "").toLowerCase();
        let bodyText = document.body.innerText.toLowerCase();
        if (headerText.includes("mã nhận xét") || bodyText.includes("mã nhận xét")) {
            hasMa = true;
        }

        if (hasMa && editables.length >= 6) {
            actualMas = [
                editables[editables.length - 6].el, 
                editables[editables.length - 4].el, 
                editables[editables.length - 2].el
            ];
            actualTAs = [
                editables[editables.length - 5].el, 
                editables[editables.length - 3].el, 
                editables[editables.length - 1].el
            ];
        } else if (editables.length >= 3) {
            actualTAs = [
                editables[editables.length - 3].el, 
                editables[editables.length - 2].el, 
                editables[editables.length - 1].el
            ];
            actualMas = [null, null, null];
        } else {
            continue;
        }

        let numTextAreas = hasMa ? 6 : 3;
        let gradingEditables = editables.slice(0, editables.length - numTextAreas);

        let len = gradingEditables.length;
        let split1 = Math.floor(len / 3);
        let split2 = Math.floor((len * 2) / 3);

        let group1 = gradingEditables.slice(0, split1);
        let group2 = gradingEditables.slice(split1, split2);
        let group3 = gradingEditables.slice(split2);

        const getMaj = (group) => {
            let c = { "T": 0, "Đ": 0, "C": 0 };
            group.forEach(item => {
                let text = (item.el.value || item.el.innerText || item.td.innerText).trim().toUpperCase();
                if (text === "H" || text.includes("ĐẠT") || text === "HT") text = "Đ";
                if (text.includes("TỐT") || text === "HTT") text = "T";
                if (text.includes("CẦN") || text.includes("CHƯA") || text === "CHT") text = "C";
                
                if (c[text] !== undefined) c[text]++;
                else if (text.includes("T")) c["T"]++;
                else if (text.includes("Đ")) c["Đ"]++;
                else if (text.includes("C")) c["C"]++;
            });
            if (c["T"] === 0 && c["Đ"] === 0 && c["C"] === 0) return Math.random() < 0.8 ? "T" : "H"; // Default
            let m = "T", mx = -1;
            for (let k of ["T", "Đ", "C"]) { if (c[k] > mx) { mx = c[k]; m = k; } }
            return m;
        };

        let majNLChung = getMaj(group1);
        let majNLDacThu = getMaj(group2);
        let majPhamChat = getMaj(group3);

        let mapping = [
          { ta: actualTAs[0], maj: majNLChung, maBox: actualMas[0] },
          { ta: actualTAs[1], maj: majNLDacThu, maBox: actualMas[1] },
          { ta: actualTAs[2], maj: majPhamChat, maBox: actualMas[2] }
        ];

        let tenHS = "Em";
        // SMAS uses frozen tables, try to find the row from the other table if available
        let rowIdx = visibleRows.indexOf(row);
        let allTrsObj = document.querySelectorAll('tbody tr, [role="row"]');
        let potentialTrs = Array.from(allTrsObj).filter(r => r.offsetHeight > 0);
        // It's split mechanically in half usually
        let half = Math.floor(potentialTrs.length / 2);
        let leftRow = rowIdx < half ? potentialTrs[rowIdx] : potentialTrs[rowIdx - half];
        if (!leftRow) leftRow = row;

        let leftRowCells = leftRow ? (leftRow.cells ? Array.from(leftRow.cells) : Array.from(leftRow.querySelectorAll('td, [role="cell"]'))) : [];
        if (leftRowCells.length > 0) {
            for (let c = 1; c < Math.min(leftRowCells.length, 4); c++) {
              let txt = leftRowCells[c].innerText.trim();
              if (txt && isNaN(parseFloat(txt)) && txt.includes(" ") && !txt.match(/^[0-9\/\-]+$/)) {
                let parts = txt.split(" ");
                tenHS = parts[parts.length - 1]; // get first name
                break;
              }
            }
        }

        mapping.forEach((item) => {
          let inputMa = item.maBox;
          let currentManualCode = inputMa ? (inputMa.value || inputMa.innerText || "").trim() : "";

          let matchedData = timKiemKhoNhanXet532(item.maj, currentManualCode);
          if (matchedData) {
            let finalText = matchedData.noiDungNhanXet.replace(/{HocSinh}/g, tenHS).replace(/{Môn}/g, "");
            
            if (item.ta.tagName && item.ta.tagName.toLowerCase() === "div") {
                item.ta.innerText = finalText;
            } else {
                item.ta.value = finalText;
            }
            
            // Try to force value setting on React/Angular/Vue inputs
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
            if (item.ta.tagName.toLowerCase() === 'textarea' && nativeTextAreaValueSetter) {
                nativeTextAreaValueSetter.call(item.ta, finalText);
            } else if (item.ta.tagName.toLowerCase() === 'input' && nativeInputValueSetter) {
                nativeInputValueSetter.call(item.ta, finalText);
            }
            
            item.ta.dispatchEvent(new Event("input", { bubbles: true }));
            item.ta.dispatchEvent(new Event("change", { bubbles: true }));
            item.ta.dispatchEvent(new Event("blur", { bubbles: true }));
            item.ta.dispatchEvent(new KeyboardEvent('keyup',  {'key': 'Enter'}));
            
            let dienMa = config.autoFillCode !== false;
            if (inputMa && dienMa && matchedData.maNX) {
              if (inputMa.tagName && inputMa.tagName.toLowerCase() === 'div') {
                  inputMa.innerText = matchedData.maNX;
              } else {
                  inputMa.value = matchedData.maNX;
              }
              if (nativeInputValueSetter && inputMa.tagName.toLowerCase() === 'input') {
                  nativeInputValueSetter.call(inputMa, matchedData.maNX);
              }
              inputMa.dispatchEvent(new Event("input", { bubbles: true }));
              inputMa.dispatchEvent(new Event("change", { bubbles: true }));
              inputMa.dispatchEvent(new Event("blur", { bubbles: true }));
              inputMa.dispatchEvent(new KeyboardEvent('keyup',  {'key': 'Enter'}));
            }
            successCount++;
          }
        });
      } catch (e) {
        console.error("L\u1ED7i h\xE0ng 5.3.2:", e);
      }
    }
    if (successCount === 0) {
      throw new Error("Kh\xF4ng t\xECm th\u1EA5y \xF4 nh\u1EADn x\xE9t (textarea) h\u1EE3p l\u1EC7 tr\xEAn m\xE0n h\xECnh 5.3.2 ho\u1EB7c d\u1EEF li\u1EC7u/\u0111i\u1EC3m s\u1ED1 b\u1ECB thi\u1EBFu.");
    }
    return { count: Math.ceil(successCount / 3), detectedMon: "N\u0103ng l\u1EF1c & Ph\u1EA9m ch\u1EA5t" };
  }

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  const fillCell = async (td, value) => {
    if (!td || !value) return;

    // Cuộn ô hiển thị giữa màn hình để tránh lỗi click hụt
    td.scrollIntoView({ block: "center", behavior: "instant" });

    td.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    td.click();
    td.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    await sleep(150);

    let editor = td.querySelector(
      'input.rcbInput, textarea.riTextBox, input[type="text"]',
    );
    let clientState = td.querySelector(
      'input[type="hidden"][id$="_ClientState"]',
    );

    if (editor) {
      editor.focus();
      editor.value = value;
      editor.dispatchEvent(new Event("input", { bubbles: true }));

      // GIẢ LẬP NHẤN ENTER ĐỂ CHỐT COMBOBOX
      editor.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          keyCode: 13,
          bubbles: true,
        }),
      );
      editor.dispatchEvent(new Event("change", { bubbles: true }));

      if (clientState) {
        try {
          let state = clientState.value ? JSON.parse(clientState.value) : {};
          state.text = value;
          state.value = value;
          state.validationText = value;
          state.valueAsString = value;
          state.lastSetTextBoxValue = value;
          clientState.value = JSON.stringify(state);
        } catch (e) {}
      }
      editor.dispatchEvent(new Event("blur", { bubbles: true }));
    }
    await sleep(50);
  };

  async function dienNhanXetDGTXAsync(
    config,
    dbDGTX,
    capHoc,
    fallbackSubject,
    khoiLop,
  ) {
    let successCount = 0;

    // 1. ĐỌC HỆ TỌA ĐỘ
    let currentKhoi = "Khối " + (khoiLop || "1");
    let currentMon = fallbackSubject || "Tiếng Việt";
    let currentThang = "Tháng 8";

    let allInputs = Array.from(
      document.querySelectorAll('.rcbInput, input[type="text"]'),
    ).map((el) => el.value.trim());

    let khoiMatch = allInputs.find((val) => val.includes("Khối"));
    if (khoiMatch) currentKhoi = khoiMatch;

    let knownSubs = [
      "Tiếng Việt",
      "Toán",
      "Đạo đức",
      "Tự nhiên",
      "Xã hội",
      "Nghệ thuật",
      "Thể chất",
      "trải nghiệm",
      "tổng hợp",
      "hđgd",
      "hoạt động giáo dục",
      "ngoại ngữ",
      "tiếng anh",
    ];
    let monMatch = allInputs.find((val) =>
      knownSubs.some((s) => val.toLowerCase().includes(s.toLowerCase())),
    );
    if (monMatch) currentMon = monMatch;

    if (currentMon.toLowerCase().includes("hđgd")) currentMon = "HĐGD";
    else if (currentMon.toLowerCase().includes("hoạt động giáo dục"))
      currentMon = "HĐGD";
    else if (currentMon.toLowerCase().includes("tổng hợp"))
      currentMon = "Tổng hợp";

    let thangMatch = allInputs.find((val) =>
      val.match(/(\d{1,2})\s*-\s*\d{4}/),
    );
    if (thangMatch) {
      let m = thangMatch.match(/(\d{1,2})\s*-\s*\d{4}/);
      if (m) currentThang = "Tháng " + parseInt(m[1], 10);
    } else {
      let directThang = allInputs.find((val) =>
        val.toLowerCase().includes("tháng"),
      );
      if (directThang) {
        let m2 = directThang.match(/\d+/);
        if (m2) currentThang = "Tháng " + m2[0];
      }
    }

    console.log(
      `[Hệ tọa độ] Khối: ${currentKhoi} | Môn: ${currentMon} | Tháng: ${currentThang}`,
    );

    // Dynamic grid column discovery
    let headerRows = Array.from(
      document.querySelectorAll(".RadGrid thead tr"),
    );
    let headers =
      headerRows.length > 0
        ? Array.from(headerRows[headerRows.length - 1].querySelectorAll("th"))
        : [];
    let colIndices = {
      monMa: -1,
      monNd: -1,
      nlcMa: -1,
      nlcNd: -1,
      nldMa: -1,
      nldNd: -1,
      pcMa: -1,
      pcNd: -1,
    };

    headers.forEach((th, idx) => {
      let txt = th.innerText.toLowerCase();
      let headerTextCombined = txt;
      headerRows.forEach((row) => {
        headerTextCombined += " " + row.innerText.toLowerCase();
      });

      if (txt.includes("mã nhận xét") || txt.includes("mã nx")) {
        if (
          headerTextCombined.includes("môn học") ||
          headerTextCombined.includes("hđgd")
        ) {
          if (colIndices.monMa === -1) colIndices.monMa = idx;
          else if (colIndices.nlcMa === -1) colIndices.nlcMa = idx;
          else if (colIndices.nldMa === -1) colIndices.nldMa = idx;
          else if (colIndices.pcMa === -1) colIndices.pcMa = idx;
        } else if (headerTextCombined.includes("chung")) {
          colIndices.nlcMa = idx;
        } else if (headerTextCombined.includes("đặc thù")) {
          colIndices.nldMa = idx;
        } else if (headerTextCombined.includes("phẩm chất")) {
          colIndices.pcMa = idx;
        }
      } else if (txt.includes("nội dung") || txt.includes("nhận xét")) {
        if (
          headerTextCombined.includes("môn học") ||
          headerTextCombined.includes("hđgd")
        ) {
          colIndices.monNd = idx;
        } else if (headerTextCombined.includes("chung")) {
          colIndices.nlcNd = idx;
        } else if (headerTextCombined.includes("đặc thù")) {
          colIndices.nldNd = idx;
        } else if (headerTextCombined.includes("phẩm chất")) {
          colIndices.pcNd = idx;
        } else {
          // Fallback by order
          if (colIndices.monNd === -1) colIndices.monNd = idx;
          else if (colIndices.nlcNd === -1) colIndices.nlcNd = idx;
          else if (colIndices.nldNd === -1) colIndices.nldNd = idx;
          else if (colIndices.pcNd === -1) colIndices.pcNd = idx;
        }
      }
    });

    if (colIndices.monMa === -1 && headers.length >= 5) colIndices.monMa = 3;
    if (colIndices.monNd === -1 && headers.length >= 5) colIndices.monNd = 4;

    console.log("[Grid] Column detection:", colIndices);

    const timKiemKhoNhanXet534 = (muc, type, khoi, mon, thang, manualCode) => {
      let suffix = "";
      let mThang = thang.match(/\d+/);
      if (mThang) suffix = "_Thang" + parseInt(mThang[0], 10);
      else suffix = thang ? "_" + thang.replace(/\s/g, "") : "";

      let validMuc = muc === "Đ" || muc === "H" ? "H" : muc;

      let findPool = (searchSuffix, isStrict = true, ignoreSubject = false) => {
        let matchedKey = null;
        let monLower = ignoreSubject ? "" : mon.toLowerCase();

        for (let k in dbDGTX) {
          let kLower = k.toLowerCase();
          if (isStrict) {
            if (searchSuffix && !k.endsWith(searchSuffix)) continue;
            if (!searchSuffix && k.includes("_Thang")) continue;
          }

          let monMatch = false;
          if (!monLower) monMatch = true;
          else if (monLower.includes("tổng hợp")) {
            if (
              type === "MON_HOC" &&
              kLower.includes("sổ tổng hợp - môn học") &&
              (kLower.includes("môn học và hoạt động giáo dục") ||
                kLower.endsWith(
                  "_thang" + parseInt(mThang ? mThang[0] : 0, 10),
                ) ||
                kLower.endsWith(suffix.toLowerCase()))
            )
              monMatch = true;
            else if (
              type === "NL_CHUNG" &&
              kLower.includes("sổ tổng hợp - năng lực chung") &&
              kLower.includes("nhận xét năng lực chung")
            )
              monMatch = true;
            else if (
              type === "NL_DAC_THU" &&
              kLower.includes("sổ tổng hợp - năng lực đặc thù") &&
              kLower.includes("nhận xét năng lực đặc thù")
            )
              monMatch = true;
            else if (
              type === "PHAM_CHAT" &&
              kLower.includes("sổ tổng hợp - phẩm chất") &&
              kLower.includes("nhận xét phẩm chất")
            )
              monMatch = true;

            if (!monMatch && kLower.includes("tổng hợp")) {
              if (
                type === "MON_HOC" &&
                (kLower.includes("sổ tổng hợp - môn học") ||
                  kLower.includes("sổ tổng hợp - hđgd"))
              )
                monMatch = true;
              else if (
                type === "NL_CHUNG" &&
                (kLower.includes("sổ tổng hợp - năng lực chung") ||
                  kLower.includes("sổ tổng hợp - nl chung"))
              )
                monMatch = true;
              else if (
                type === "NL_DAC_THU" &&
                (kLower.includes("sổ tổng hợp - năng lực đặc thù") ||
                  kLower.includes("sổ tổng hợp - nl đặc thù"))
              )
                monMatch = true;
              else if (
                type === "PHAM_CHAT" &&
                (kLower.includes("sổ tổng hợp - phẩm chất") ||
                  kLower.includes("sổ tổng hợp - pham chat"))
              )
                monMatch = true;
            }
          } else {
            if (kLower.includes(monLower)) monMatch = true;
            else if (
              monLower.includes("tiếng việt") &&
              kLower.includes("tiếng việt")
            )
              monMatch = true;
          }

          if (monMatch) {
            if (type === "MON_HOC") {
              if (kLower.includes("môn học") || kLower.includes("hđgd")) {
                matchedKey = k;
                break;
              }
              // For THCS/THPT or normal keys that don't have "môn học" in the key name
              if (
                !kLower.includes("năng lực") &&
                !kLower.includes("phẩm chất")
              ) {
                matchedKey = k;
                break;
              }
            }
            if (
              type === "NL_CHUNG" &&
              (kLower.includes("năng lực chung") || kLower.includes("nl chung"))
            ) {
              matchedKey = k;
              break;
            }
            if (
              type === "NL_DAC_THU" &&
              (kLower.includes("năng lực đặc thù") ||
                kLower.includes("nl đặc thù"))
            ) {
              matchedKey = k;
              break;
            }
            if (
              type === "PHAM_CHAT" &&
              (kLower.includes("phẩm chất") || kLower.includes("pham chat"))
            ) {
              matchedKey = k;
              break;
            }
          }
        }
        if (!matchedKey) return null;
        let pool = dbDGTX[matchedKey];
        if (!pool) return null;

        if (manualCode) {
          let mCodeUpper = manualCode.toUpperCase();
          for (let levelKey in pool) {
            if (["T", "H", "C", "K", "Đ"].includes(levelKey) && pool["Tốt"])
              continue;
            let lvlConf = pool[levelKey];
            if (
              lvlConf &&
              lvlConf.code &&
              lvlConf.code.toUpperCase() === mCodeUpper
            ) {
              return { pool: lvlConf };
            }
          }
        }

        let p = null;
        if (validMuc === "T") p = pool["Tốt"] || pool["T"];
        else if (validMuc === "H") {
          let hasKha =
            pool["Khá"] &&
            pool["Khá"].comments &&
            pool["Khá"].comments.length > 0;
          let hasDat =
            pool["Đạt"] &&
            pool["Đạt"].comments &&
            pool["Đạt"].comments.length > 0;
          if (hasKha && hasDat)
            p = Math.random() > 0.5 ? pool["Khá"] : pool["Đạt"];
          else if (hasKha) p = pool["Khá"];
          else if (hasDat) p = pool["Đạt"];
          else p = pool["H"] || pool["Khá"];
        } else if (validMuc === "C") p = pool["Chưa Đạt"] || pool["C"];
        else p = pool[validMuc] || pool[muc];

        if (!p || !p.comments || p.comments.length === 0) return null;
        return { pool: p };
      };

      let result = findPool(suffix, true, false);
      if (!result) result = findPool("", true, false);
      if (!result) result = findPool(suffix, false, false);
      if (!result && type !== "MON_HOC") result = findPool(suffix, true, true);
      if (!result) {
        const getRandom = (arr) =>
          arr && arr.length > 0
            ? arr[Math.floor(Math.random() * arr.length)]
            : "";
        // Last resort generic lookup for the accurate TYPE
        for (let k in dbDGTX) {
          let kLower = k.toLowerCase();
          let typeMatch = false;
          if (type === "MON_HOC") typeMatch = true;
          if (type === "NL_CHUNG" && kLower.includes("chung")) typeMatch = true;
          if (
            type === "NL_DAC_THU" &&
            (kLower.includes("đặc thù") || kLower.includes("năng lực"))
          )
            typeMatch = true;
          if (type === "PHAM_CHAT" && kLower.includes("phẩm chất"))
            typeMatch = true;

          if (typeMatch) {
            let p = dbDGTX[k][validMuc];
            if (p && p.comments.length > 0)
              return {
                noiDungNhanXet: getRandom(p.comments),
                maNX: p.code || "",
              };
          }
        }
        // Absolute last resort
        for (let k in dbDGTX) {
          let p = dbDGTX[k][validMuc];
          if (p && p.comments.length > 0)
            return {
              noiDungNhanXet: getRandom(p.comments),
              maNX: p.code || "",
            };
        }
        return null;
      }

      const getRandom = (arr) =>
        arr && arr.length > 0
          ? arr[Math.floor(Math.random() * arr.length)]
          : "";
      return {
        noiDungNhanXet: getRandom(result.pool.comments),
        maNX: result.pool.code || "",
      };
    };

    let trs = Array.from(
      document.querySelectorAll(
        ".RadGrid tbody tr.rgRow, .RadGrid tbody tr.rgAltRow",
      ),
    );
    let finalTasks = [];
    let knownSubsList = [
      "Tiếng Việt",
      "Toán",
      "Đạo đức",
      "Tự nhiên và Xã hội",
      "Khoa học",
      "Lịch sử",
      "Địa lí",
      "Ngoại ngữ",
      "Tiếng Anh",
      "Tin học",
      "Công nghệ",
      "Giáo dục thể chất",
      "Âm nhạc",
      "Mĩ thuật",
      "Hoạt động trải nghiệm",
      "Hoạt động trải nghiệm, hướng nghiệp",
      "Nội dung giáo dục địa phương",
      "Nghệ thuật",
    ];

    trs.forEach((tr, index) => {
      let tds = Array.from(tr.querySelectorAll("td"));
      if (tds.length < 5) return;

      let monMaTd =
        tr.querySelector("td.maNoiDungMonHocHDGD") ||
        (colIndices.monMa !== -1 ? tds[colIndices.monMa] : tds[3]);
      if (!monMaTd) return;

      let monMaInput = monMaTd.querySelector("input");
      let valText = (monMaInput ? monMaInput.value : monMaTd.innerText || "")
        .trim()
        .toUpperCase();
      let level = "";
      if (valText.includes("Đ") || valText.includes("H")) level = "H";
      else if (valText.includes("T")) level = "T";
      else if (valText.includes("C")) level = "C";

      let tenHS = "Em";
      if (tds) {
        for (let c = 1; c < Math.min(tds.length, 4); c++) {
          let txt = tds[c].innerText.trim();
          if (
            txt &&
            isNaN(parseFloat(txt)) &&
            txt.includes(" ") &&
            !txt.match(/^[0-9\/]+$/)
          ) {
            tenHS = txt.split(" ").pop();
            break;
          }
        }
      }
      if (!level) level = Math.random() > 0.2 ? "T" : "H";

      // Try to extract the specific subject from the row (for "Sổ tổng hợp" tables where multiple subjects are listed per student)
      let rowSubject = null;
      if (currentMon.toLowerCase().includes("tổng hợp")) {
        let rowText = "";
        tds.forEach((td, i) => {
          if (i > 1) rowText += " " + td.innerText;
        });
        let found = knownSubsList.find((s) =>
          rowText.toLowerCase().includes(s.toLowerCase()),
        );
        if (found) rowSubject = found;
      }

      finalTasks.push({ rowIndex: index, level, tenHS, tr, rowSubject });
    });

    // 3. ĐÓNG GÓI DỮ LIỆU JSON ĐỂ ĐIỀN SIÊU TỐC
    let fillData = [];
    for (let task of finalTasks) {
      let { level, tenHS, rowSubject } = task;
      let monToUse = rowSubject || currentMon;

      let tds = Array.from(task.tr.querySelectorAll("td"));
      let monMaTd =
        task.tr.querySelector("td.maNoiDungMonHocHDGD") ||
        (colIndices.monMa !== -1 ? tds[colIndices.monMa] : tds[3]);
      let nlcMaTd = colIndices.nlcMa !== -1 ? tds[colIndices.nlcMa] : null;
      let nldMaTd = colIndices.nldMa !== -1 ? tds[colIndices.nldMa] : null;
      let pcMaTd = colIndices.pcMa !== -1 ? tds[colIndices.pcMa] : null;

      let monMaManual =
        monMaTd && monMaTd.querySelector("input")
          ? monMaTd.querySelector("input").value.trim()
          : "";
      let nlcMaManual =
        nlcMaTd && nlcMaTd.querySelector("input")
          ? nlcMaTd.querySelector("input").value.trim()
          : "";
      let nldMaManual =
        nldMaTd && nldMaTd.querySelector("input")
          ? nldMaTd.querySelector("input").value.trim()
          : "";
      let pcMaManual =
        pcMaTd && pcMaTd.querySelector("input")
          ? pcMaTd.querySelector("input").value.trim()
          : "";

      let dMon = timKiemKhoNhanXet534(
        level,
        "MON_HOC",
        currentKhoi,
        monToUse,
        currentThang,
        monMaManual,
      );
      let dNLC = timKiemKhoNhanXet534(
        level,
        "NL_CHUNG",
        currentKhoi,
        monToUse,
        currentThang,
        nlcMaManual,
      );
      let dNLD = timKiemKhoNhanXet534(
        level,
        "NL_DAC_THU",
        currentKhoi,
        monToUse,
        currentThang,
        nldMaManual,
      );
      let dPC = timKiemKhoNhanXet534(
        level,
        "PHAM_CHAT",
        currentKhoi,
        monToUse,
        currentThang,
        pcMaManual,
      );

      // Cleanup functions for leftover variables
      const cleanContent = (str) =>
        str
          ? str
              .replace(/{HocSinh}/g, tenHS)
              .replace(/{Môn}/g, monToUse || "")
              .replace(/\\$?\\{m\\}/g, "")
              .replace(/[ \t\r]+/g, " ")
              .trim()
          : "";

      // Fallback logic
      let monNd = dMon
        ? cleanContent(dMon.noiDungNhanXet)
        : "Em hoàn thành tốt nội dung học tập.";
      let nlcNd = dNLC
        ? cleanContent(dNLC.noiDungNhanXet)
        : "Em có ý thức rèn luyện tốt.";
      let nldNd = dNLD ? cleanContent(dNLD.noiDungNhanXet) : nlcNd;
      let pcNd = dPC ? cleanContent(dPC.noiDungNhanXet) : nlcNd;

      // If it's a generic table (only single column) but we know what type the user requested from the dropdown
      let requestedTypeLower = (
        fallbackSubject ||
        currentMon ||
        ""
      ).toLowerCase();
      if (colIndices.nlcNd === -1 && colIndices.pcNd === -1) {
        if (requestedTypeLower.includes("chung")) monNd = nlcNd;
        else if (requestedTypeLower.includes("đặc thù")) monNd = nldNd;
        else if (requestedTypeLower.includes("phẩm chất")) monNd = pcNd;
      }

      fillData.push({
        rowIndex: task.rowIndex,
        level: level,
        monNd,
        nlcNd,
        nldNd,
        pcNd,
        monMa: dMon ? dMon.maNX : "",
        nlcMa: dNLC ? dNLC.maNX : "",
        nldMa: dNLD ? dNLD.maNX : "",
        pcMa: dPC ? dPC.maNX : "",
        dienMaNX: config.autoFillCode !== false,
      });
      successCount++;
    }

    // 4. TIÊM API VÀO TRANG WEB SỬ DỤNG FILE INJECT.JS ĐỂ VƯỢT CSP
    const eventName = "Telerik_Fast_Fill_Result_" + Date.now();
    const bridgeId = "bot-data-bridge-super-fast";

    // Dọn dẹp bridge cũ nếu có
    let oldBridge = document.getElementById(bridgeId);
    if (oldBridge) oldBridge.remove();

    let bridge = document.createElement("div");
    bridge.id = bridgeId;
    bridge.style.display = "none";
    bridge.innerText = JSON.stringify({ fillData, colIndices, eventName });
    document.body.appendChild(bridge);

    const telerikResult = await new Promise((resolve) => {
      const handler = (e) => {
        document.removeEventListener(eventName, handler);
        resolve(e.detail);
      };
      document.addEventListener(eventName, handler);

      // Timeout 3s
      setTimeout(() => {
        document.removeEventListener(eventName, handler);
        resolve({ status: "TIMEOUT" });
      }, 3000);

      let script = document.createElement("script");
      script.src = chrome.runtime.getURL("inject.js");
      script.onload = function () {
        this.remove();
      };
      (document.head || document.documentElement).appendChild(script);
    });

    if (telerikResult && telerikResult.status === "OK") {
      return { count: successCount, detectedMon: currentMon };
    } else {
      throw new Error(
        "Lỗi điền siêu tốc: " +
          (telerikResult.message ||
            "Quá thời gian phản hồi hoặc bị chặn bởi CSP."),
      );
    }
  }

  // Inject floating widget
  if (window === window.top) {
    const injectWidget = () => {
      // Avoid injecting multiple times
      if (document.getElementById("tlnx-floating-widget")) return;

      const pageText = document.body.innerText.toLowerCase();
      const isGradingPage =
        pageText.includes("5.3.") ||
        pageText.includes("nhận xét") ||
        pageText.includes("giáo viên bộ môn") ||
        pageText.includes("đánh giá") ||
        window.location.hostname.includes("csdl") ||
        window.location.hostname.includes("vnedu") ||
        window.location.hostname.includes("edu.vn");

      if (!isGradingPage) return;

      const widget = document.createElement("div");
      widget.id = "tlnx-floating-widget";
      widget.style.cssText = `position: fixed; top: 0px; left: 50%; transform: translateX(-50%); z-index: 2147483647; background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 4px 8px 4px 12px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); display: flex; align-items: center; gap: 8px; font-family: Arial, system-ui, -apple-system, sans-serif; font-size: 14px; transition: all 0.3s ease; border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); flex-wrap: wrap; max-width: 320px; cursor: move;`;

      // Integrated Big Run Button (replacing Brand + Run Button)
      const btnRun = document.createElement("button");
      const imgLogo = `
        <svg style="width: 18px; height: 18px; margin-right: 4px; border-radius: 4px;" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="k-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fef08a" />
              <stop offset="20%" stop-color="#facc15" />
              <stop offset="100%" stop-color="#eab308" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="512" height="512" rx="100" ry="100" fill="url(#k-logo-grad)" />
          <rect x="16" y="16" width="480" height="480" rx="84" ry="84" fill="none" stroke="#fef08a" stroke-width="12" stroke-opacity="0.8" />
          <text x="256" y="375" font-family="Arial, sans-serif" font-weight="900" font-size="340" fill="#ffffff" text-anchor="middle" dominant-baseline="alphabetic">K</text>
        </svg>
      `.replace(/\n/g, '').trim();
      btnRun.innerHTML = `${imgLogo}<span style="white-space: nowrap; font-weight: 700; margin: 0 4px;">CHẠY TỰ ĐỘNG ĐIỀN</span><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px;display:block;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
      btnRun.style.cssText = `background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 9999px; padding: 4px 10px; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275); margin-right: 4px; font-size: 11px;`;
      btnRun.onmouseover = () => {
        btnRun.style.background = "rgba(255,255,255,0.25)";
        btnRun.style.transform = "scale(1.02)";
      };
      btnRun.onmouseout = () => {
        btnRun.style.background = "rgba(255,255,255,0.15)";
        btnRun.style.transform = "scale(1)";
      };
      btnRun.onmousedown = () => {
        btnRun.style.transform = "scale(0.92)";
      };
      btnRun.onmouseup = () => {
        btnRun.style.transform = "scale(1.02)";
      };

      // Settings dropdown container
      const settingsContainer = document.createElement("div");
      settingsContainer.style.cssText = `display: none; width: 100%; flex-direction: row; align-items: center; gap: 8px; margin-top: 4px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.2); cursor: default;`;

      // Settings toggle arrow
      const btnSettings = document.createElement("button");
      btnSettings.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>`;
      btnSettings.style.cssText = `background: transparent; color: white; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; opacity: 0.8; transition: transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s; border-radius: 50%;`;
      btnSettings.onmouseover = () => {
        btnSettings.style.opacity = "1";
        btnSettings.style.background = "rgba(255,255,255,0.1)";
      };
      btnSettings.onmouseout = () => {
        btnSettings.style.opacity = "0.8";
        btnSettings.style.background = "transparent";
      };
      btnSettings.onmousedown = () => {
        btnSettings.style.transform = settingsOpen ? "scale(0.85) rotate(180deg)" : "scale(0.85)";
      };
      btnSettings.onmouseup = () => {
        btnSettings.style.transform = settingsOpen ? "scale(1) rotate(180deg)" : "scale(1)";
      };

      // Control Checkbox (Điền mã NX)
      const labelCheckbox = document.createElement("label");
      labelCheckbox.style.cssText = `display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; user-select: none; opacity: 0.9; margin-left: 4px;`;
      labelCheckbox.innerHTML = `<input type="checkbox" id="tlnx-auto-fill-code" style="cursor: pointer; accent-color: #3b82f6;"> Điền mã NX`;

      chrome.storage.local.get(["autoFillCode"], (res) => {
        const checkbox = labelCheckbox.querySelector("#tlnx-auto-fill-code");
        checkbox.checked =
          res.autoFillCode !== undefined ? res.autoFillCode : true;
        checkbox.onchange = (e) => {
          chrome.storage.local.set({ autoFillCode: e.target.checked });
        };
      });

      // Settings Link (Cấu hình)
      const btnEdit = document.createElement("button");
      btnEdit.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Sửa`;
      btnEdit.style.cssText = `background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 9999px; padding: 4px 8px; font-weight: 600; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275); white-space: nowrap; margin-left: 4px;`;
      btnEdit.onmouseover = () => {
        btnEdit.style.background = "rgba(255,255,255,0.25)";
        btnEdit.style.transform = "scale(1.05)";
      };
      btnEdit.onmouseout = () => {
        btnEdit.style.background = "rgba(255,255,255,0.15)";
        btnEdit.style.transform = "scale(1)";
      };
      btnEdit.onmousedown = () => {
        btnEdit.style.transform = "scale(0.92)";
      };
      btnEdit.onmouseup = () => {
        btnEdit.style.transform = "scale(1.05)";
      };

      // Status / Topup button
      const btnTopup = document.createElement("button");
      btnTopup.innerHTML = `Đăng nhập`;
      btnTopup.style.cssText = `background: #fbbf24; color: #78350f; border: 1px solid #f59e0b; border-radius: 9999px; padding: 4px 8px; font-weight: 700; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 3px; transition: all 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275); white-space: nowrap; margin-left: auto;`;
      btnTopup.onmouseover = () => {
        btnTopup.style.background = "#f59e0b";
        btnTopup.style.transform = "scale(1.05)";
      };
      btnTopup.onmouseout = () => {
        btnTopup.style.background = "#fbbf24";
        btnTopup.style.transform = "scale(1)";
      };
      btnTopup.onmousedown = () => {
        btnTopup.style.transform = "scale(0.92)";
      };
      btnTopup.onmouseup = () => {
        btnTopup.style.transform = "scale(1.05)";
      };
      btnTopup.onclick = (e) => {
        e.stopPropagation();
        if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ action: "openAuth" });
        } else {
          if (typeof chrome !== "undefined" && chrome.tabs) {
            chrome.runtime.sendMessage({ action: "openAuth" });
          } else {
            window.open(chrome.runtime.getURL("auth-ui.html"), "_blank");
          }
        }
      };

      const lblPoints = document.createElement("span");
      lblPoints.style.cssText = `font-size: 11px; font-weight: 600; color: #fbbf24; margin-left: auto; display: flex; align-items: center; gap: 4px; cursor: pointer; transition: transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275);`;
      lblPoints.innerHTML = `Đang tải...`;
      
      lblPoints.onmousedown = () => {
        lblPoints.style.transform = "scale(0.9)";
      };
      lblPoints.onmouseup = () => {
        lblPoints.style.transform = "scale(1)";
      };

      btnEdit.onclick = (e) => {
        e.stopPropagation();
        if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ action: "openOptions" });
        } else {
          if (typeof chrome !== "undefined" && chrome.tabs) {
            // content scripts cannot use chrome.tabs, use chrome.runtime.sendMessage to open
            chrome.runtime.sendMessage({ action: "openOptions" });
          } else {
            window.open(chrome.runtime.getURL("options.html"), "_blank");
          }
        }
      };

      lblPoints.onclick = (e) => {
        e.stopPropagation();
        if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ action: "openAuth" });
        } else {
          if (typeof chrome !== "undefined" && chrome.tabs) {
            chrome.runtime.sendMessage({ action: "openAuth" });
          } else {
            window.open(chrome.runtime.getURL("auth-ui.html"), "_blank");
          }
        }
      };

      settingsContainer.appendChild(labelCheckbox);
      settingsContainer.appendChild(btnEdit);

      const whiteDiamondSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 0 3px rgba(255,255,255,1));"><path d="M12 2L2 9L12 22L22 9L12 2Z" fill="white"/><path d="M12 2V22M2 9H22M12 2L7 9L12 22" stroke="#e2e8f0" stroke-width="1"/></svg>`;

      let settingsOpen = false;
      btnSettings.onclick = (e) => {
        e.stopPropagation();
        settingsOpen = !settingsOpen;
        btnSettings.style.transform = settingsOpen
          ? "rotate(180deg)"
          : "rotate(0deg)";
        settingsContainer.style.display = settingsOpen ? "flex" : "none";
        widget.style.borderRadius = settingsOpen ? "16px" : "9999px";
      };

      let updatePointsUI = () => {};
      if (typeof chrome !== "undefined" && chrome.storage) {
        updatePointsUI = (authState) => {
          if (authState && authState.uid !== "guest") {
            const credits = authState.credits || 0;
            const points = authState.points || 0;
            const yearsText = credits > 0 ? `${credits} năm` : "0 năm";
            
            // Show points if they exist, otherwise show years
            if (points > 0) {
              lblPoints.innerHTML = `<span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${points} lượt</span> <span style="opacity:0.8; font-size:10px;">|</span> ${yearsText} ${whiteDiamondSvg}`;
            } else {
              lblPoints.innerHTML = `${yearsText} ${whiteDiamondSvg}`;
            }
            
            lblPoints.style.display = 'flex';
            btnTopup.style.display = 'none';
          } else {
            lblPoints.style.display = 'none';
            btnTopup.style.display = 'flex';
            btnTopup.innerHTML = `Đăng nhập`;
          }
        };

        chrome.storage.local.get(["authState"], (res) => {
          updatePointsUI(res.authState);
        });

        chrome.storage.onChanged.addListener((changes, namespace) => {
          if (namespace === "local") {
            if (changes.authState) {
              updatePointsUI(changes.authState.newValue);
            }
            if (changes.autoFillCode) {
              const checkbox = labelCheckbox.querySelector("#tlnx-auto-fill-code");
              if (checkbox) checkbox.checked = changes.autoFillCode.newValue;
            }
          }
        });
      }

      btnRun.onclick = (e) => {
        e.stopPropagation();
        const originalContent = btnRun.innerHTML;
        btnRun.innerHTML = `<span style="white-space: nowrap; font-weight: 700; margin: 0 4px;">Đang chạy...</span>`;
        btnRun.style.pointerEvents = "none";
        btnRun.style.opacity = "0.7";

        chrome.storage.local.get(["authState", "autoFillCode"], (res) => {
          if (
            !res.authState ||
            (!res.authState.uid && res.authState.uid !== "guest")
          ) {
            const origBg = btnRun.style.background;
            const origBc = btnRun.style.borderColor;
            btnRun.innerHTML = `<span style="white-space: nowrap; font-weight: 700; margin: 0 4px;">Vui lòng Đăng nhập trên Tiện ích</span>`;
            btnRun.style.background = "#eab308";
            btnRun.style.borderColor = "#ca8a04";
            setTimeout(() => {
              btnRun.innerHTML = originalContent;
              btnRun.style.background = origBg;
              btnRun.style.borderColor = origBc;
              btnRun.style.pointerEvents = "auto";
              btnRun.style.opacity = "1";
            }, 3000);
            return;
          }
          if (
            res.authState &&
            res.authState.uid !== "guest" &&
            (res.authState.credits || 0) <= 0 &&
            (res.authState.points || 0) <= 0
          ) {
            const origBg = btnRun.style.background;
            const origBc = btnRun.style.borderColor;
            btnRun.innerHTML = `<span style="white-space: nowrap; font-weight: 700; margin: 0 4px;">Hết Hạn! Nâng cấp trên Tiện ích</span>`;
            btnRun.style.background = "#ef4444";
            btnRun.style.borderColor = "#dc2626";
            setTimeout(() => {
              btnRun.innerHTML = originalContent;
              btnRun.style.background = origBg;
              btnRun.style.borderColor = origBc;
              btnRun.style.pointerEvents = "auto";
              btnRun.style.opacity = "1";
            }, 3000);
            return;
          }

          // Deduct visually right away for instant feedback
          if (res.authState && res.authState.uid !== "guest") {
            const p = res.authState.points || 0;
            const c = res.authState.credits || 0;
            
            if (p > 0 || c > 0) {
              // Prioritize points first
              if (p > 0) {
                res.authState.points -= 1;
              } else {
                // Should we deduct from credits? Only if points are 0.
                // If they have credits (years), we actually don't NEED to deduct anything if it's unlimited?
                // But the user said: "với tài khoản có cả số lượt nhật xét thì hệ thống sẽ trừ lượt nhận xét trước. khi nào hết lượt với kiểm tra xem số năm nhận xét còn thời gian hay không."
                // This implies credits (years) are UNLIMITED turns within that time.
                // So if they have credits, we don't need to decrement anything besides points.
              }
              
              res.authState.pendingDeduction =
                (res.authState.pendingDeduction || 0) + 1;
              chrome.storage.local.set({ authState: res.authState });
              updatePointsUI(res.authState);
            }
          }

          const autoFillCode =
            res.autoFillCode !== undefined ? res.autoFillCode : true;
          fillCommentsAsync({ method: "template", autoFillCode })
            .then((result) => {
              btnRun.innerHTML = `<span style="white-space: nowrap; font-weight: 700; margin: 0 4px;">Thành công (${result.count})</span>`;
              btnRun.style.background = "#10b981";
              btnRun.style.borderColor = "#059669";
              setTimeout(() => {
                btnRun.innerHTML = originalContent;
                btnRun.style.background = "rgba(255,255,255,0.15)";
                btnRun.style.borderColor = "rgba(255,255,255,0.3)";
                btnRun.style.pointerEvents = "auto";
                btnRun.style.opacity = "1";
              }, 3000);
            })
            .catch((err) => {
              // Rollback visual deduction on error
              if (res.authState && res.authState.uid !== "guest") {
                // If we deducted a point, add it back
                res.authState.points = (res.authState.points || 0) + 1;
                res.authState.pendingDeduction = Math.max(
                  0,
                  (res.authState.pendingDeduction || 0) - 1,
                );
                chrome.storage.local.set({ authState: res.authState });
                updatePointsUI(res.authState);
              }

              btnRun.innerHTML = `<span style="white-space: nowrap; font-weight: 700; margin: 0 4px; font-size: 11px;">Lỗi: ${err.message}</span>`;
              btnRun.style.background = "#ef4444";
              btnRun.style.borderColor = "#dc2626";
              setTimeout(() => {
                btnRun.innerHTML = originalContent;
                btnRun.style.background = "rgba(255,255,255,0.15)";
                btnRun.style.borderColor = "rgba(255,255,255,0.3)";
                btnRun.style.pointerEvents = "auto";
                btnRun.style.opacity = "1";
              }, 5000);
            });
        });
      };

      const btnClose = document.createElement("button");
      btnClose.innerHTML = "&times;";
      btnClose.style.cssText = `background: transparent; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0; line-height: 1; opacity: 0.6; transition: opacity 0.2s; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%;`;
      btnClose.onmouseover = () => {
        btnClose.style.opacity = "1";
        btnClose.style.background = "rgba(255,255,255,0.1)";
      };
      btnClose.onmouseout = () => {
        btnClose.style.opacity = "0.6";
        btnClose.style.background = "transparent";
      };
      btnClose.onclick = (e) => {
        e.stopPropagation();
        widget.remove();
      };

      const topRow = document.createElement("div");
      topRow.style.cssText = `display: flex; align-items: center; gap: 8px; width: 100%;`;
      topRow.appendChild(btnRun);
      topRow.appendChild(lblPoints);
      topRow.appendChild(btnTopup);
      topRow.appendChild(btnSettings);
      topRow.appendChild(btnClose);

      widget.appendChild(topRow);
      widget.appendChild(settingsContainer);

      let isDragging = false;
      let startX, startY, initialX, initialY;

      widget.onmousedown = (e) => {
        if (
          e.target.tagName.toLowerCase() === "button" ||
          e.target.tagName.toLowerCase() === "input" ||
          e.target.closest("button")
        )
          return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = widget.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        widget.style.transition = "none";
        e.preventDefault();
      };

      document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let newX = initialX + dx;
        let newY = initialY + dy;

        const maxW = window.innerWidth - widget.offsetWidth;
        const maxH = window.innerHeight - widget.offsetHeight;
        if (newX < 0) newX = 0;
        if (newX > maxW) newX = maxW;
        if (newY < 0) newY = 0;
        if (newY > maxH) newY = maxH;

        widget.style.right = "auto";
        widget.style.bottom = "auto";
        widget.style.left = newX + "px";
        widget.style.top = newY + "px";
      });

      document.addEventListener("mouseup", () => {
        if (isDragging) {
          isDragging = false;
          widget.style.transition = "opacity 0.3s ease";
        }
      });

      document.body.appendChild(widget);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", injectWidget);
    } else {
      setTimeout(injectWidget, 1000); // Wait a bit for page to render fully
    }
    
    // Ensure widget stays alive in Single Page Applications (like VnEdu) where DOM is heavily modified
    setInterval(() => {
      if (!document.getElementById("tlnx-floating-widget")) {
        injectWidget();
      }
    }, 1500);
  }
})();
