# Salesforce CRM Data Extractor 🚀

A high-performance Chrome Extension built with **React.js**, **TailwindCSS**, and **Manifest V3** to extract and manage Salesforce CRM data seamlessly. This project was developed as part of a technical assessment to demonstrate advanced DOM manipulation and local storage architecture.

---

## 🛠️ Technology Stack

- **Frontend**: React.js with TailwindCSS for a modern, responsive popup dashboard
- **API**: Chrome Extension APIs (`tabs`, `runtime`, `storage`)
- **Manifest**: Version 3 (service worker + content scripts)
- **Styling**: Shadow DOM for style isolation of injected page UI (extraction indicators)
- **Persistence**: `chrome.storage.local` for local data management

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone 
cd SF-EXTRACTOR
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Project
```bash
npm run build
```

### 4. Load into Chrome
1. Open `chrome://extensions/` in your browser
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** and select the `dist` folder from this project
4. The extension icon should now appear in your Chrome toolbar

---

## 🧠 DOM Selection Strategy

Salesforce Lightning Experience uses a **Single Page Application (SPA)** architecture with dynamic DOM rendering. To handle this, my extension uses:

### Smart Polling Mechanism
Instead of a one-time scrape, the script polls the DOM every **400ms** to verify if the record data is fully loaded and matches the current URL ID. This prevents "stale data" issues during navigation between records.

### URL Change Detection
A background monitor tracks URL changes and enforces a **minimum 1-second wait** after navigation to ensure Salesforce has updated the display before extraction begins.

### Label-Based Mapping
Since Salesforce labels vary across objects (e.g., "Company" in Leads vs "Account Name" in Contacts/Accounts), I implemented a universal field finder that searches for multiple label variations:
```javascript
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
```

### Verification Loop
The extractor waits until:
- The page has waited minimum time after URL change (1000ms)
- The displayed name is stable for 3 consecutive checks (1.2 seconds)
- Mandatory fields are rendered in the Details tab
- Header name matches the field name (page fully synced)

This ensures **high data integrity** even in Salesforce's dynamic SPA environment.

---

## 💾 Storage Schema

Data is managed using `chrome.storage.local` with a structured schema to handle deduplication and persistence.

### Structure
```json
{
  "salesforce_data": {
    "leads": [
      { 
        "id": "00Q...", 
        "name": "John Doe", 
        "company": "Acme Corp", 
        "status": "Working - Contacted",
        "email": "john@acme.com",
        "phone": "(555) 123-4567"
      }
    ],
    "contacts": [
      { 
        "id": "003...", 
        "name": "Jane Smith", 
        "account": "Global Industries",
        "email": "jane@global.com"
      }
    ],
    "accounts": [
      { 
        "id": "001...", 
        "name": "Tech Solutions Inc", 
        "industry": "Technology"
      }
    ],
    "opportunities": [
      { 
        "id": "006...", 
        "name": "Q1 Enterprise Deal", 
        "stage": "Proposal/Price Quote", 
        "probability": "75",
        "amount": "$50,000"
      }
    ],
    "tasks": [
      { 
        "id": "00T...", 
        "subject": "Follow up call", 
        "status": "Not Started"
      }
    ],
    "lastSync": 1737110000000
  }
}
```

### Key Features
- **Deduplication**: Records are indexed by their unique Salesforce ID. New extractions update existing entries rather than creating duplicates
- **Type Grouping**: Different CRM objects (Leads, Contacts, Accounts, Opportunities, Tasks) are stored in separate arrays
- **Stage Grouping**: Opportunities are dynamically grouped by their Stage in the dashboard UI
- **Persistence**: Data remains available across browser sessions and page refreshes

---

## 📺 Demo Video



---

## 📂 Project Structure
```
salesforce-extractor/
├── src/
│   ├── components/          # React components for popup dashboard
│   ├── App.jsx             # Main React app component
│   └── index.jsx           # React entry point
├── public/
│   ├── content.js          # Main extraction engine (Module 1)
│   ├── background.js       # Service worker for extension
│   ├── manifest.json       # Extension configuration
│   └── icons/              # Extension icons
├── dist/                   # Build output (generated)
├── package.json
└── README.md
```

---

## 🎯 Key Features

### Module 1: Data Extraction
- ✅ Extract Leads, Contacts, Accounts, Opportunities, and Tasks
- ✅ Smart polling with URL change detection
- ✅ Handles Salesforce SPA navigation seamlessly
- ✅ No manual refresh required

### Module 2: Local Storage
- ✅ Persistent storage using `chrome.storage.local`
- ✅ Automatic deduplication by Salesforce ID
- ✅ Data survives browser restarts

### Module 3: Dashboard
- ✅ Modern React.js + TailwindCSS UI
- ✅ Tab-based navigation for different object types
- ✅ Grouped view for Opportunities by Stage
- ✅ Search and filter capabilities
- ✅ Export to CSV functionality

---

## 🔒 Permissions

The extension requires the following permissions:
- `storage` - For local data persistence
- `activeTab` - To extract data from current Salesforce page
- `scripting` - To inject content scripts

---

## 🐛 Known Issues & Future Improvements

- [ ] Add support for custom Salesforce objects
- [ ] Implement real-time sync indicators
- [ ] Add data export to JSON/Excel formats
- [ ] Support for bulk extraction across list views

---

## 🙏 Acknowledgments

Built as part of a technical assessment to demonstrate:
- Advanced DOM manipulation in dynamic SPAs
- Chrome Extension development with Manifest V3
- React.js state management and UI design
- Data persistence and architecture patterns