document.getElementById('save-tab-btn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  const btn = document.getElementById('save-tab-btn');
  
  btn.disabled = true;
  statusDiv.textContent = "Analyzing & Saving...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 1. SCRAPE PAGE CONTENT
    // We execute a script in the active tab to get the text content
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Simple scraper: Get the document title and the body text
        return {
          title: document.title,
          text: document.body.innerText.substring(0, 8000) // Limit text to avoid huge payloads
        };
      }
    });

    // 2. Prepare Payload with the Scraped Text
    const payload = {
      type: "link",
      content: tab.url, // The URL
      sourceUrl: tab.url,
      title: result.title || tab.title,
      pageText: result.text // The actual content for Gemini
    };

    // FIX: Pointing to Production
    const API_URL = "https://linkvault-ai.vercel.app/api/extension";
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include" 
    });

    if (response.ok) {
      statusDiv.textContent = "Saved to Vault!";
      statusDiv.style.color = "green";
      setTimeout(() => window.close(), 1500);
    } else {
      const err = await response.json();
      statusDiv.textContent = "Error: " + (err.error || "Please Log In");
      statusDiv.style.color = "red";
      btn.disabled = false;
    }

  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Error. Check Console.";
    statusDiv.style.color = "red";
    btn.disabled = false;
  }
});