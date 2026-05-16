import { generateAllSampleData } from "../shared.js";

chrome.runtime.onInstalled.addListener(() => {
    console.log("Trợ lý Nhận xét Pro Installed!");
    chrome.storage.local.get(["commentsData"], (result) => {
        if (!result.commentsData || Object.keys(result.commentsData).length === 0) {
            chrome.storage.local.set({ commentsData: generateAllSampleData() });
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openOptions") {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
        }
        sendResponse({ success: true });
    } else if (request.action === "openAuth") {
        chrome.tabs.create({ url: chrome.runtime.getURL('auth-ui.html') });
        sendResponse({ success: true });
    } else if (request.action === "getDefaultData") {
        chrome.storage.local.get(["commentsData"], (result) => {
            if (!result.commentsData || Object.keys(result.commentsData).length === 0) {
                const newData = generateAllSampleData();
                chrome.storage.local.set({ commentsData: newData }, () => {
                    sendResponse({ data: newData });
                });
            } else {
                sendResponse({ data: result.commentsData });
            }
        });
        return true; 
    } else if (request.action === "closeCurrentTab") {
        if (sender.tab) {
            chrome.tabs.remove(sender.tab.id);
        }
        sendResponse({ success: true });
    } else if (request.action === "executeTelerikBatch") {
        if (sender.tab && sender.tab.id) {
            chrome.scripting.executeScript({
                target: { tabId: sender.tab.id },
                world: "MAIN",
                func: (data, colMap, eventName) => {
                    // PATCH VNEDU POPUPS IN MAIN WORLD
                    if (window.radalert) window.radalert = function() { return false; };
                    if (window.radconfirm) window.radconfirm = function() { return false; };
                    if (window.confirm) {
                        var oldConfirm = window.confirm;
                        window.confirm = function(msg) {
                            if (msg.includes('đóng ứng dụng') || msg.includes('chưa lưu')) return true;
                            return oldConfirm(msg);
                        };
                    }
                    
                    try {
                        var gridEl = document.querySelector('.RadGrid');
                        if (!gridEl) throw new Error("Không tìm thấy lưới dữ liệu!");
                        
                        var grid = window.$find(gridEl.id);
                        if (!grid) throw new Error("Không kết nối được API Telerik!");
                        
                        var batchManager = grid.get_batchEditingManager();
                        if (!batchManager) throw new Error("Hệ thống chưa bật chế độ Batch Edit!");
                        
                        var trs = Array.from(document.querySelectorAll('.RadGrid tbody tr.rgRow, .RadGrid tbody tr.rgAltRow'));
                        
                        data.forEach(function(item) {
                            var tr = trs[item.rowIndex];
                            if (!tr) return;
                            var tds = Array.from(tr.querySelectorAll('td'));
                            
                            var map = {
                                monMa: tr.querySelector('td.maNoiDungMonHocHDGD') || (colMap.monMa !== -1 ? tds[colMap.monMa] : null),
                                monNd: tr.querySelector('td.noiDungMonHocHDGD') || (colMap.monNd !== -1 ? tds[colMap.monNd] : null),
                                nlcMa: tr.querySelector('td.maNoiDungNangLucChung') || (colMap.nlcMa !== -1 ? tds[colMap.nlcMa] : null),
                                nlcNd: tr.querySelector('td.noiDungNangLucChung') || (colMap.nlcNd !== -1 ? tds[colMap.nlcNd] : null),
                                nldMa: tr.querySelector('td.maNoiDungNangLucDacThu') || (colMap.nldMa !== -1 ? tds[colMap.nldMa] : null),
                                nldNd: tr.querySelector('td.noiDungNangLucDacThu') || (colMap.nldNd !== -1 ? tds[colMap.nldNd] : null),
                                pcMa:  tr.querySelector('td.maNoiDungPhamChatChuYeu') || (colMap.pcMa !== -1 ? tds[colMap.pcMa] : null),
                                pcNd:  tr.querySelector('td.noiDungPhamChatChuYeu') || (colMap.pcNd !== -1 ? tds[colMap.pcNd] : null)
                            };

                            if (item.dienMaNX) {
                                if (map.monMa && item.monMa) batchManager.changeCellValue(map.monMa, item.monMa);
                                if (map.nlcMa && item.nlcMa) batchManager.changeCellValue(map.nlcMa, item.nlcMa);
                                if (map.nldMa && item.nldMa) batchManager.changeCellValue(map.nldMa, item.nldMa);
                                if (map.pcMa && item.pcMa)  batchManager.changeCellValue(map.pcMa, item.pcMa);
                            }
                            
                            if (map.monNd && item.monNd) batchManager.changeCellValue(map.monNd, item.monNd);
                            if (map.nlcNd && item.nlcNd) batchManager.changeCellValue(map.nlcNd, item.nlcNd);
                            if (map.nldNd && item.nldNd) batchManager.changeCellValue(map.nldNd, item.nldNd);
                            if (map.pcNd && item.pcNd) batchManager.changeCellValue(map.pcNd, item.pcNd);
                        });

                        document.dispatchEvent(new CustomEvent(eventName, { detail: { status: "OK" } }));
                    } catch(e) {
                        console.error("Batch Fill Error:", e);
                        document.dispatchEvent(new CustomEvent(eventName, { detail: { status: "ERROR", message: e.message } }));
                    }
                },
                args: [request.config.fillData, request.config.colIndices, request.config.eventName]
            }).catch(err => {
                console.error("Script injection failed:", err);
            });
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: "No active tab" });
        }
    }
});