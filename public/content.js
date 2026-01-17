// content.js - Production Grade: Smart Polling + Shadow DOM
console.log("🚀 Swades Extractor: Robust SPA Engine Active");

// --- MODULE 4: SHADOW DOM INDICATOR (Style Isolation) --- [cite: 10, 54]
function showStatusToast(message, type = "info") {
  const existing = document.getElementById('swades-status-host');
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = 'swades-status-host';
  const shadow = host.attachShadow({mode: 'open'});
  const bgColor = type === 'error' ? '#e74c3c' : '#0176D3';
  
  const style = document.createElement('style');
  style.textContent = `
    .toast {
      position: fixed; top: 24px; right: 24px; z-index: 999999;
      background: ${bgColor}; color: white; padding: 16px 28px;
      border-radius: 12px; font-family: system-ui, sans-serif;
      font-weight: 700; font-size: 14px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      display: flex; align-items: center; gap: 12px;
      animation: slideIn 0.3s ease-out; border: 1px solid rgba(255,255,255,0.2);
    }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  `;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${type === 'error' ? '⚠️' : '⚡'}</span><span>${message}</span>`;
  shadow.appendChild(style);
  shadow.appendChild(toast);
  document.body.appendChild(host);
  setTimeout(() => { host.style.opacity = '0'; setTimeout(() => host.remove(), 500); }, 3000);
}

// Helper to find data based on label
function getField(labelName) {
  const allFields = document.querySelectorAll('.slds-form-element');
  for (let field of allFields) {
    const label = field.querySelector('.test-id__field-label');
    if (label && label.innerText.trim().includes(labelName)) {
      const value = field.querySelector('.test-id__field-value');
      return value ? value.innerText.trim() : "N/A";
    }
  }
  return "N/A";
}

// Track URL changes for SPA stability
let lastKnownUrl = "";
let urlChangeTime = 0;

setInterval(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastKnownUrl && currentUrl.includes("/lightning/r/")) {
    lastKnownUrl = currentUrl;
    urlChangeTime = Date.now();
  }
}, 100);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "EXTRACT_DATA") {
    const url = window.location.href;
    const urlId = url.split('/r/')[1]?.split('/')[1];

    if (!url.includes("/lightning/r/")) {
      showStatusToast("Please open a specific record detail page.", "error");
      sendResponse(null);
      return;
    }

    showStatusToast("Syncing Salesforce DOM..."); // Visual feedback [cite: 55]

    let attempts = 0;
    const maxAttempts = 30; 
    const minWaitAfterUrlChange = 1000; 
    let stableNameCount = 0;
    let previousName = "";

    const pollInterval = setInterval(() => {
      attempts++;
      const timeSinceUrlChange = Date.now() - urlChangeTime;
      
      let currentName = null;
      const nameSelectors = ['slot[name="primaryField"] lightning-formatted-name', '.slds-page-header__title', 'h1.slds-page-header__title'];
      
      for (let selector of nameSelectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText?.trim()) {
          currentName = element.innerText.trim();
          break;
        }
      }

      const nameFromField = getField("Name");
      const finalName = nameFromField !== "N/A" ? nameFromField : currentName;
      const hasDetailsContent = document.querySelectorAll('.slds-form-element').length > 5;
      const headerMatchesField = currentName === nameFromField || nameFromField === "N/A";
      const hasValidName = finalName && !finalName.includes("All Open Leads") && finalName.length > 3;
      
      if (finalName === previousName && finalName) stableNameCount++;
      else stableNameCount = 0;
      
      const isDataReady = (timeSinceUrlChange >= minWaitAfterUrlChange) && hasValidName && (stableNameCount >= 3) && hasDetailsContent && headerMatchesField;

      if (isDataReady || attempts >= maxAttempts) {
        clearInterval(pollInterval);
        
        let type = "unknown";
        if (url.includes("/Lead/")) type = "leads";
        else if (url.includes("/Contact/")) type = "contacts";
        else if (url.includes("/Account/")) type = "accounts";
        else if (url.includes("/Opportunity/")) type = "opportunities";

        const data = {
          id: urlId,
          name: finalName || "Unknown",
          type: type,
          url: url,
          email: getField("Email"),
          phone: getField("Phone"),
          company: getField(["Company", "Account Name"]),
          status: getField(["Status", "Lead Status", "Stage"]),
          amount: getField("Amount"),
          probability: getField("Probability (%)")
        };

        showStatusToast(`Success: Captured ${data.name}`); // Final success indicator [cite: 55]
        sendResponse(data);
      }
      previousName = finalName;
    }, 400);
  }
  return true; 
});