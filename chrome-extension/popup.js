document.getElementById('save-tab-btn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  const btn = document.getElementById('save-tab-btn');
  
  btn.disabled = true;
  statusDiv.textContent = "Saving...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const payload = {
      type: "link",
      content: tab.url,
      title: tab.title,
      sourceUrl: tab.url
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
      statusDiv.textContent = "Saved successfully!";
      statusDiv.style.color = "green";
      setTimeout(() => window.close(), 1500);
    } else {
      const err = await response.json();
      statusDiv.textContent = "Error: " + (err.error || "Please Log In");
      statusDiv.style.color = "red";
      btn.disabled = false;
    }

  } catch (err) {
    statusDiv.textContent = "Connection Error";
    statusDiv.style.color = "red";
    btn.disabled = false;
  }
});