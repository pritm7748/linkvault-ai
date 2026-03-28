// popup.js
const API_URL = "http://linkvault-ai.vercel.app/api/extension"; // Change to your Vercel URL in production

document.addEventListener('DOMContentLoaded', async () => {
  const statusDiv = document.getElementById('status');
  const imagesContainer = document.getElementById('images-container');
  const pageInfoDiv = document.getElementById('page-info');
  const saveTabBtn = document.getElementById('save-tab-btn');
  const btnText = document.getElementById('btn-text');
  const btnIconContainer = document.getElementById('btn-icon-container');
  
  const highlightSection = document.getElementById('highlight-section');
  const pageSection = document.getElementById('page-section');
  const highlightContent = document.getElementById('highlight-content');
  const saveHighlightBtn = document.getElementById('save-highlight-btn');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  pageInfoDiv.textContent = tab.title;

  // --- 1. SMART PLATFORM DETECTION ---
  const url = tab.url.toLowerCase();
  let platform = 'article';
  let themeColor = '#1c1917'; // Default dark
  let actionText = 'Save Article & Summarize';

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    platform = 'youtube';
    themeColor = '#ef4444'; // YouTube Red
    actionText = 'Save Video & Transcript';
    btnIconContainer.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>`;
  } else if (url.includes('x.com') || url.includes('twitter.com')) {
    platform = 'twitter';
    themeColor = '#1d9bf0'; // Twitter Blue
    actionText = 'Save X Thread';
    btnIconContainer.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>`;
  } else if (url.includes('instagram.com')) {
    platform = 'instagram';
    themeColor = '#e1306c'; // IG Pink
    actionText = 'Save Instagram Post';
    btnIconContainer.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
  } else {
    btnIconContainer.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;
  }

  // Apply contextual UI
  saveTabBtn.style.backgroundColor = themeColor;
  btnText.textContent = actionText;

  // --- 2. EXTRACT CONTENT ---
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (currentPlatform) => {
        const selection = window.getSelection().toString().trim();
        let text = "";
        
        // Deep extraction based on platform
        if (currentPlatform === 'twitter') {
           const tweets = document.querySelectorAll('[data-testid="tweetText"]');
           tweets.forEach((tweet, index) => { text += `Tweet ${index + 1}: ${tweet.innerText}\n\n`; });
        } else if (currentPlatform === 'instagram') {
           // Grab the IG caption (usually in an h1 or span)
           const caption = document.querySelector('h1')?.innerText || document.querySelector('span[dir="auto"]')?.innerText || "";
           text = caption ? `Instagram Caption: ${caption}` : document.body.innerText;
        } else {
           text = document.body.innerText;
        }
        
        text = text.substring(0, 15000); 
        
        const images = Array.from(document.images)
          .filter(img => img.width > 150 && img.height > 150 && img.src.startsWith('http'))
          .map(img => img.src)
          .slice(0, 6);

        return { title: document.title, text: text, selection: selection, images: [...new Set(images)] };
      },
      args: [platform]
    });

    // Handle UI States
    if (result.selection && result.selection.length > 0) {
        highlightSection.style.display = 'block';
        pageSection.style.display = 'none'; 
        highlightContent.textContent = result.selection;
        saveHighlightBtn.onclick = () => saveContent(tab, 'note', result.selection, result.selection);
    }

    if (result.images.length > 0) {
      imagesContainer.innerHTML = '';
      result.images.forEach(imgSrc => {
        const imgEl = document.createElement('img');
        imgEl.src = imgSrc;
        imgEl.className = 'img-thumbnail';
        imgEl.onclick = () => saveContent(tab, 'image', imgSrc, "");
        imagesContainer.appendChild(imgEl);
      });
    } else {
      imagesContainer.innerHTML = '<div class="empty-state">No notable images found.</div>';
    }

    // Attach platform-specific type to standard save
    saveTabBtn.onclick = () => saveContent(tab, platform, tab.url, result.text);

  } catch (err) {
    updateStatus("Failed to read page.", "error");
  }

  // --- 3. UNIVERSAL SAVE FUNCTION ---
  async function saveContent(tab, type, content, pageText) {
    updateStatus("Processing with AI...", "loading");
    saveTabBtn.disabled = true;
    saveHighlightBtn.disabled = true;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: type, // This will now be 'twitter', 'youtube', 'article', etc.
          content: content,
          sourceUrl: tab.url,
          title: tab.title,
          pageText: pageText
        }),
        credentials: "include"
      });

      if (response.ok) {
        updateStatus("Saved successfully!", "success");
        setTimeout(() => window.close(), 1500);
      } else {
        const err = await response.json();
        updateStatus(err.error || "Authentication required.", "error");
        saveTabBtn.disabled = false;
        saveHighlightBtn.disabled = false;
      }
    } catch (err) {
      updateStatus("Network Error. Is LinkVault running?", "error");
      saveTabBtn.disabled = false;
      saveHighlightBtn.disabled = false;
    }
  }

  function updateStatus(msg, state) {
    statusDiv.innerHTML = state === 'loading' 
      ? `<svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3"></circle></svg> ${msg}`
      : msg;
    statusDiv.className = `status-bar status-${state}`;
    statusDiv.style.opacity = '1';
  }
});