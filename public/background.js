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
        return true; // Keep the message channel open for sendResponse
    } else if (request.action === "closeCurrentTab") {
        if (sender.tab) {
            chrome.tabs.remove(sender.tab.id);
        }
        sendResponse({ success: true });
    }
});