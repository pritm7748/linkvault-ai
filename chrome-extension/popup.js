// chrome-extension/popup.js

// CONFIG
const API_URL = "https://linkvault-ai.vercel.app/api/extension";

document.addEventListener('DOMContentLoaded', async () => {
  const statusDiv = document.getElementById('status');
  const imagesContainer = document.getElementById('images-container');
  const pageInfoDiv = document.getElementById('page-info');
  const saveTabBtn = document.getElementById('save-tab-btn');

  // 1. Get Active Tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  pageInfoDiv.textContent = tab.title;

  // 2. INJECT SCRIPT TO GET CONTENT & IMAGES
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // --- THIS RUNS INSIDE THE WEBPAGE ---
        
        // A. Get Page Text
        const text = document.body.innerText.substring(0, 8000);
        
        // B. Get Images (Filter out tiny icons)
        const images = Array.from(document.images)
          .filter(img => img.width > 100 && img.height > 100 && img.src.startsWith('http'))
          .map(img => img.src)
          .slice(0, 9); // Limit to top 9 to keep popup clean

        // Return unique images only
        return {
          title: document.title,
          text: text,
          images: [...new Set(images)] 
        };
      }
    });

    // 3. RENDER IMAGES IN POPUP
    if (result.images.length > 0) {
      imagesContainer.innerHTML = ''; // Clear "Scanning..." text
      
      result.images.forEach(imgSrc => {
        const imgEl = document.createElement('img');
        imgEl.src = imgSrc;
        imgEl.className = 'img-thumbnail';
        imgEl.title = "Click to Save to Vault";
        
        // Handle Image Click
        imgEl.onclick = () => saveImage(imgSrc, tab.url);
        
        imagesContainer.appendChild(imgEl);
      });
    } else {
      imagesContainer.innerHTML = '<div style="grid-column: span 3; text-align: center; color: #a8a29e; font-size: 12px;">No large images found.</div>';
    }

    // 4. HANDLE "SAVE PAGE" CLICK
    saveTabBtn.onclick = () => savePage(tab, result.text);

  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Could not access page content.";
    statusDiv.className = "status-error";
  }

  // --- HELPER: Save Page ---
  async function savePage(tab, pageText) {
    updateStatus("Analyzing & Saving...", "neutral");
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

  // --- HELPER: Save Image ---
  async function saveImage(imgUrl, pageUrl) {
    updateStatus("Saving Image...", "neutral");
    
    await sendToApi({
      type: "image",
      content: imgUrl, // The Image URL
      sourceUrl: pageUrl,
      title: "Image from " + (new URL(pageUrl).hostname),
      pageText: "" // No text needed for image
    });
  }

  // --- HELPER: API Call ---
  async function sendToApi(payload) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
      });

      if (response.ok) {
        updateStatus("Saved to Vault!", "success");
        setTimeout(() => window.close(), 1500);
      } else {
        const err = await response.json();
        updateStatus("Error: " + (err.error || "Please Log In"), "error");
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