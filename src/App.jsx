import React, { useState, useEffect } from 'react';

function App() {
  const [data, setData] = useState({
    leads: [], contacts: [], accounts: [], opportunities: [], tasks: [], lastSync: null
  });
  const [activeTab, setActiveTab] = useState('leads');
  const [status, setStatus] = useState('Idle');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    chrome.storage.local.get("salesforce_data", (result) => {
      if (result.salesforce_data) setData(result.salesforce_data);
    });
  }, []);

  const handleExtract = async () => {
    setStatus('Scanning DOM...');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_DATA" }, (response) => {
      if (response) {
        chrome.storage.local.get("salesforce_data", (result) => {
          let currentData = result.salesforce_data || { ...data };
          let list = currentData[response.type] || [];
          const existingIndex = list.findIndex(item => item.id === response.id);
          
          if (existingIndex > -1) list[existingIndex] = response;
          else list.push(response);

          currentData[response.type] = list;
          currentData.lastSync = Date.now();

          chrome.storage.local.set({ "salesforce_data": currentData }, () => {
            setData(currentData);
            setStatus('Extraction Successful!');
            setTimeout(() => setStatus('Idle'), 3000);
          });
        });
      } else {
        setStatus('Error: Field not found');
      }
    });
  };

  const deleteRecord = (type, id) => {
    const newData = { ...data };
    newData[type] = newData[type].filter(item => item.id !== id);
    chrome.storage.local.set({ "salesforce_data": newData }, () => setData(newData));
  };

  const filteredItems = (data[activeTab] || []).filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.company && item.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Grouping Opportunities by Stage (Assessment Requirement)
  const renderOpportunities = () => {
    const stages = [...new Set(filteredItems.map(item => item.status))];
    return stages.map(stage => (
      <div key={stage} className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
          <h3 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">{stage}</h3>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 rounded-full">
            {filteredItems.filter(i => i.status === stage).length}
          </span>
        </div>
        <div className="space-y-3">
          {filteredItems.filter(item => item.status === stage).map(item => (
            <RecordCard key={item.id} item={item} type="opportunities" onDelete={deleteRecord} />
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="w-[420px] h-[580px] bg-[#F3F4F6] flex flex-col font-sans text-slate-800 shadow-2xl overflow-hidden">
      {/* Header Section */}
      <header className="bg-[#0176D3] p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-white text-xl font-black tracking-tight">Swades CRM</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></div>
              <p className="text-[10px] text-blue-100 font-medium uppercase">
                {data.lastSync ? `Synced ${new Date(data.lastSync).toLocaleTimeString()}` : 'No Sync Data'} [cite: 51]
              </p>
            </div>
          </div>
          <button 
            onClick={handleExtract}
            className="bg-white text-[#0176D3] hover:bg-blue-50 px-4 py-2 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="text-sm">⚡</span> Extract [cite: 50]
          </button>
        </div>
      </header>

      {/* Modern Tabs Navigation */}
      <nav className="flex bg-white border-b px-2 overflow-x-auto scrollbar-hide">
        {['leads', 'contacts', 'accounts', 'opportunities', 'tasks'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => {setActiveTab(tab); setSearchQuery('');}}
            className={`px-4 py-3 capitalize text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab ? 'border-[#0176D3] text-[#0176D3]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab} [cite: 47]
          </button>
        ))}
      </nav>

      {/* Search & Feedback Section */}
      <div className="p-4 space-y-3 bg-white border-b">
        <div className="relative">
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`} 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all"
          />
          <span className="absolute left-3 top-3 text-slate-400 text-sm">🔍</span> [cite: 48]
        </div>
        <div className={`text-[11px] font-bold text-center px-2 py-1 rounded-md transition-all ${
          status.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
        }`}>
          {status}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 bg-[#F8FAFC]">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40">
            <span className="text-4xl mb-2">📁</span>
            <p className="text-sm font-medium">No records found in {activeTab}</p>
          </div>
        ) : (
          activeTab === 'opportunities' ? renderOpportunities() : 
          <div className="space-y-3">
            {filteredItems.map(item => (
              <RecordCard key={item.id} item={item} type={activeTab} onDelete={deleteRecord} />
            ))}
          </div>
        )}
      </main>

      <footer className="p-3 bg-white border-t text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
        Swades AI Assessment Build • Jan 2026
      </footer>
    </div>
  );
}

// Styled Card Component for Records
const RecordCard = ({ item, item: { name, company, email, phone, status, amount, probability }, type, onDelete }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group hover:shadow-md hover:border-blue-300 transition-all animate-in fade-in slide-in-from-bottom-2">
    <button 
      onClick={() => onDelete(type, item.id)} 
      className="absolute top-3 right-3 text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      title="Delete Record"
    >
      <span className="text-lg">✕</span> [cite: 49]
    </button>
    
    <div className="pr-6">
      <h4 className="font-extrabold text-slate-900 text-sm leading-tight mb-1 truncate">{name} [cite: 15]</h4>
      <p className="text-[11px] text-blue-600 font-bold mb-3 truncate">
        {company || 'No Organization Listed'} [cite: 15]
      </p>
      
      <div className="grid grid-cols-1 gap-1.5 border-t pt-3 border-slate-50">
        {email && <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">📧 {email}</div>}
        {phone && <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">📞 {phone}</div>}
        
        {type === 'opportunities' && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-md border border-emerald-100 shadow-sm">
              ${amount || '0'} [cite: 15, 52]
            </span>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2 py-1 rounded-md border border-indigo-100 shadow-sm">
              {probability || '0'}% Prob [cite: 15, 52]
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default App;