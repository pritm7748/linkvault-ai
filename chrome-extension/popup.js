// chrome-extension/popup.js

const API_URL = "https://linkvault-ai.vercel.app/api/extension";

document.addEventListener('DOMContentLoaded', async () => {
  const statusDiv = document.getElementById('status');
  const imagesContainer = document.getElementById('images-container');
  const pageInfoDiv = document.getElementById('page-info');
  const saveTabBtn = document.getElementById('save-tab-btn');
  
  // New Elements
  const highlightSection = document.getElementById('highlight-section');
  const pageSection = document.getElementById('page-section');
  const highlightContent = document.getElementById('highlight-content');
  const saveHighlightBtn = document.getElementById('save-highlight-btn');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  pageInfoDiv.textContent = tab.title;

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // 1. Get Selected Text
        const selection = window.getSelection().toString().trim();
        
        // 2. Get Page Text
        const text = document.body.innerText.substring(0, 8000);
        
        // 3. Get Images
        const images = Array.from(document.images)
          .filter(img => img.width > 100 && img.height > 100 && img.src.startsWith('http'))
          .map(img => img.src)
          .slice(0, 9);

        return {
          title: document.title,
          text: text,
          selection: selection,
          images: [...new Set(images)] 
        };
      }
    });

    // --- LOGIC: SHOW HIGHLIGHT UI IF TEXT SELECTED ---
    if (result.selection && result.selection.length > 0) {
        highlightSection.style.display = 'block';
        pageSection.style.display = 'none'; // Hide standard page save
        highlightContent.textContent = result.selection;
        
        saveHighlightBtn.onclick = () => saveHighlight(tab, result.selection);
    }

    // Render Images
    if (result.images.length > 0) {
      imagesContainer.innerHTML = '';
      result.images.forEach(imgSrc => {
        const imgEl = document.createElement('img');
        imgEl.src = imgSrc;
        imgEl.className = 'img-thumbnail';
        imgEl.title = "Click to Save Image";
        imgEl.onclick = () => saveImage(imgSrc, tab.url);
        imagesContainer.appendChild(imgEl);
      });
    } else {
      imagesContainer.innerHTML = '<div style="grid-column: span 3; text-align: center; color: #a8a29e; font-size: 12px;">No large images found.</div>';
    }

    // Handle Standard Page Save
    saveTabBtn.onclick = () => savePage(tab, result.text);

  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Error accessing page content.";
    statusDiv.className = "status-error";
  }

  // --- ACTIONS ---

  async function saveHighlight(tab, selection) {
    updateStatus("Saving Highlight...", "neutral");
    saveHighlightBtn.disabled = true;

    await sendToApi({
      type: "note", // We use 'note' so it displays nicely
      content: selection,
      sourceUrl: tab.url,
      title: "Highlight: " + tab.title,
      pageText: selection // Context for AI Summary
    });
    
    saveHighlightBtn.disabled = false;
  }

  async function savePage(tab, pageText) {
    updateStatus("Analyzing Page...", "neutral");
    saveTabBtn.disabled = true;
    await sendToApi({
      type: "link",
      content: tab.url,
      sourceUrl: tab.url,
      title: tab.title,
      pageText: pageText
    });
    saveTabBtn.disabled = false;
  }

  async function saveImage(imgUrl, pageUrl) {
    updateStatus("Saving Image...", "neutral");
    await sendToApi({
      type: "image",
      content: imgUrl,
      sourceUrl: pageUrl,
      title: "Image from " + (new URL(pageUrl).hostname),
      pageText: ""
    });
  }

  async function sendToApi(payload) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
      });

      if (response.ok) {
        updateStatus("Saved!", "success");
        setTimeout(() => window.close(), 1500);
      } else {
        const err = await response.json();
        updateStatus("Error: " + (err.error || "Log in required"), "error");
      }
    } catch (err) {
      updateStatus("Network Error", "error");
    }
  }

  function updateStatus(msg, type) {
    statusDiv.textContent = msg;
    statusDiv.className = type === 'success' ? 'status-success' : type === 'error' ? 'status-error' : '';
  }
});