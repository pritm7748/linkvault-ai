// FIX: Pointing to your deployed App
const API_URL = "https://linkvault-ai.vercel.app/api/extension";

// 1. Create Right-Click Menus
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-image",
    title: "Save Image to LinkVault",
    contexts: ["image"]
  });

  chrome.contextMenus.create({
    id: "save-note",
    title: "Save Selection as Note",
    contexts: ["selection"]
  });
});

// 2. Handle Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-image") {
    handleSave(tab, {
      type: "image",
      content: info.srcUrl,
      title: tab.title || "Saved Image",
      sourceUrl: tab.url
    });
  } 
  
  if (info.menuItemId === "save-note") {
    handleSave(tab, {
      type: "note",
      content: info.selectionText,
      title: "Note from " + (tab.title || "Web"),
      sourceUrl: tab.url
    });
  }
});

// 3. Send Data to Next.js API
async function handleSave(tab, payload) {
  try {
    chrome.action.setBadgeText({ text: "...", tabId: tab.id });

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include" // This passes your login cookies!
    });

    if (response.ok) {
      chrome.action.setBadgeText({ text: "OK", tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({ color: "#22c55e", tabId: tab.id });
    } else {
      chrome.action.setBadgeText({ text: "ERR", tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({ color: "#ef4444", tabId: tab.id });
    }

    setTimeout(() => {
      chrome.action.setBadgeText({ text: "", tabId: tab.id });
    }, 3000);

  } catch (error) {
    console.error("Network error:", error);
    chrome.action.setBadgeText({ text: "ERR", tabId: tab.id });
  }
}