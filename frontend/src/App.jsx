import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calculator, Users, Settings, LogOut, Snowflake, Eye, FileText, FileSpreadsheet, IndianRupee, Percent } from 'lucide-react';
import seetechLogo from './assets/seetech-logo.png';

const API_URL = 'http://localhost:3001/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Auth state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Main data state
  const [customers, setCustomers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [activeRateCard, setActiveRateCard] = useState(null);
  const [configs, setConfigs] = useState({});
  const [pumpModels, setPumpModels] = useState([]);
  
  // Rate Card History (Admin panel)
  const [rateCards, setRateCards] = useState([]);

  // Survey Form inputs
  const [surveyCustomer, setSurveyCustomer] = useState('');
  const [surveyW, setSurveyW] = useState(2400);
  const [surveyD, setSurveyD] = useState(1500);
  const [surveyH, setSurveyH] = useState(1800);
  const [surveyThickness, setSurveyThickness] = useState(100);
  const [surveyConfigType, setSurveyConfigType] = useState('3-face');
  const [selectedFaces, setSelectedFaces] = useState(['Back', 'Left', 'Right']);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [submitStatusType, setSubmitStatusType] = useState('draft');

  // Modals state
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState(null);
  
  // Live Estimate State
  const [liveEstimate, setLiveEstimate] = useState({ totalPads: 0, frameBars: 0, pattiBars: 0, plateSheets: 0, requiredFlowLPH: 0, grandTotal: 0, pumpModelName: 'None' });


  // New Customer Form inputs
  const [custName, setCustName] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custContact, setCustContact] = useState('');
  const [custEmail, setCustEmail] = useState('');

  // Admin Rate Card Form inputs
  const [rcVersion, setRcVersion] = useState('');
  
  // Evaporative Cooling Pad 7090(NTK)
  const [rcPadH, setRcPadH] = useState(2000);
  const [rcPadW, setRcPadW] = useState(1180);
  const [rcPadD, setRcPadD] = useState(100);
  const [rcPadQty, setRcPadQty] = useState(20);
  const [rcPadCost, setRcPadCost] = useState(3000);

  // Aluminium Frame - Bottom Plate
  const [rcBottomPlateH, setRcBottomPlateH] = useState(1828);
  const [rcBottomPlateW, setRcBottomPlateW] = useState(3048);
  const [rcBottomPlateD, setRcBottomPlateD] = useState(100);
  const [rcBottomPlateQty, setRcBottomPlateQty] = useState(10);
  const [rcBottomPlateCost, setRcBottomPlateCost] = useState(2800);

  // Aluminium Frame - Side Plate
  const [rcSidePlateH, setRcSidePlateH] = useState(1828);
  const [rcSidePlateW, setRcSidePlateW] = useState(3048);
  const [rcSidePlateD, setRcSidePlateD] = useState(100);
  const [rcSidePlateQty, setRcSidePlateQty] = useState(44);
  const [rcSidePlateCost, setRcSidePlateCost] = useState(700);

  // Aluminium Suport Patti
  const [rcSupportPattiH, setRcSupportPattiH] = useState(1828);
  const [rcSupportPattiW, setRcSupportPattiW] = useState(8500);
  const [rcSupportPattiD, setRcSupportPattiD] = useState(100);
  const [rcSupportPattiQty, setRcSupportPattiQty] = useState(16);
  const [rcSupportPattiCost, setRcSupportPattiCost] = useState(0);

  const [rcLphMultiplier, setRcLphMultiplier] = useState(4);
  const [adminPumps, setAdminPumps] = useState([]);
  const [adminPlumbingBands, setAdminPlumbingBands] = useState([]);

  // Fetch API wrapper
  const fetchWithAuth = async (url, options = {}) => {
    options.headers = options.headers || {};
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, options);
    if (response.status === 401) {
      handleLogout();
      throw new Error("Session expired");
    }
    return response;
  };

  useEffect(() => {
    if (token) {
      loadInitialData();
    }
  }, [token]);

  const loadInitialData = async () => {
    try {
      // 1. Fetch active configs
      let res = await fetchWithAuth(`${API_URL}/configs`);
      const cfg = await res.json();
      setConfigs(cfg);

      // 2. Fetch active rate card
      res = await fetchWithAuth(`${API_URL}/rate-cards/active`);
      const rc = await res.json();
      setActiveRateCard(rc);

      // Initialize admin card edit values
      // 1. Evaporative Cooling Pad 7090(NTK)
      setRcPadW(parseFloat(cfg.padSheetWidth) || 1180);
      setRcPadH(parseFloat(cfg.padSheetHeight) || 2000);
      setRcPadD(parseFloat(cfg.padSheetDepth) || 100);
      setRcPadQty(parseFloat(cfg.padReqQty) || 20);
      setRcPadCost(rc.cooling_pad_unit_cost || 3000);

      // 2. Aluminium Frame - Bottom Plate
      setRcBottomPlateW(parseFloat(cfg.bottomPlateWidth) || 3048);
      setRcBottomPlateH(parseFloat(cfg.bottomPlateHeight) || 1828);
      setRcBottomPlateD(parseFloat(cfg.bottomPlateDepth) || 100);
      setRcBottomPlateQty(parseFloat(cfg.bottomPlateReqQty) || 10);
      setRcBottomPlateCost(rc.plate_cost_per_sheet || 2800);

      // 3. Aluminium Frame - Side Plate
      setRcSidePlateW(parseFloat(cfg.sidePlateWidth) || 3048);
      setRcSidePlateH(parseFloat(cfg.sidePlateHeight) || 1828);
      setRcSidePlateD(parseFloat(cfg.sidePlateDepth) || 100);
      setRcSidePlateQty(parseFloat(cfg.sidePlateReqQty) || 44);
      setRcSidePlateCost(rc.aluminium_cost_per_bar || 700);

      // 4. Aluminium Suport Patti
      setRcSupportPattiW(parseFloat(cfg.supportPattiWidth) || 8500);
      setRcSupportPattiH(parseFloat(cfg.supportPattiHeight) || 1828);
      setRcSupportPattiD(parseFloat(cfg.supportPattiDepth) || 100);
      setRcSupportPattiQty(parseFloat(cfg.supportPattiReqQty) || 16);
      setRcSupportPattiCost(rc.support_patti_cost_per_bar || 0);

      setRcLphMultiplier(rc.lph_multiplier || 4);
      setAdminPlumbingBands(rc.plumbingCostBands || []);

      // 3. Fetch active pumps
      res = await fetchWithAuth(`${API_URL}/pump-models`);
      const pumps = await res.json();
      setPumpModels(pumps);
      setAdminPumps(pumps.map(p => ({ modelName: p.modelName, capacityLPH: p.capacityLPH, cost: p.cost })));

      // 4. Load dynamic listings
      loadCustomers();
      loadQuotations();
    } catch (e) {
      console.error("Data load error:", e);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/customers`);
      const data = await res.json();
      setCustomers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadQuotations = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/quotations`);
      const data = await res.json();
      setQuotations(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadRateCards = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/rate-cards`);
      const data = await res.json();
      setRateCards(data);
    } catch (e) {
      console.error(e);
    }
  };

  // --- Auth Handlers ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentPage('dashboard');
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // --- Visual Box Selector Handlers ---
  const handleConfigTypeChange = (val) => {
    setSurveyConfigType(val);
    if (val === '4-face') {
      setSelectedFaces(['Front', 'Back', 'Left', 'Right']);
    } else if (val === '3-face') {
      setSelectedFaces(['Back', 'Left', 'Right']);
    } else if (val === '2-opposite') {
      setSelectedFaces(['Front', 'Back']);
    } else if (val === '2-adjacent') {
      setSelectedFaces(['Back', 'Left']);
    }
  };

  const toggleFace = (faceName) => {
    let list = [...selectedFaces];
    if (list.includes(faceName)) {
      list = list.filter(f => f !== faceName);
    } else {
      list.push(faceName);
    }
    setSelectedFaces(list);

    // Auto-detect config type dropdown match
    if (list.length === 4) {
      setSurveyConfigType('4-face');
    } else if (list.length === 3 && list.includes('Left') && list.includes('Right') && list.includes('Back')) {
      setSurveyConfigType('3-face');
    } else if (list.length === 2) {
      const isOpp = (list.includes('Front') && list.includes('Back')) || (list.includes('Left') && list.includes('Right'));
      setSurveyConfigType(isOpp ? '2-opposite' : '2-adjacent');
    }
  };

  // --- Real-time Estimation Engine (Server-side) ---
  useEffect(() => {
    if (!token || selectedFaces.length === 0) return;
    
    const fetchLiveEstimate = async () => {
      try {
        const body = {
          inputSnapshot: {
            H: parseFloat(surveyH),
            W: parseFloat(surveyW),
            D: parseFloat(surveyD),
            faces: selectedFaces,
            faceSelectionType: surveyConfigType,
            thickness: parseFloat(surveyThickness)
          }
        };
        const response = await fetchWithAuth(`${API_URL}/quotations/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await response.json();
        if (response.ok && data.outputSnapshot) {
          setLiveEstimate({
            totalPads: data.outputSnapshot.pads?.totalPads || 0,
            frameBars: data.outputSnapshot.frame?.barsNeeded || 0,
            pattiBars: data.outputSnapshot.patti?.barsNeeded || 0,
            plateSheets: data.outputSnapshot.plates?.sheetsNeeded || 0,
            requiredFlowLPH: data.outputSnapshot.pumpPlumbing?.requiredFlowLPH || 0,
            pumpModelName: data.outputSnapshot.pumpPlumbing?.selectedPump?.modelName || 'None',
            grandTotal: data.outputSnapshot.grandTotal || 0
          });
        }
      } catch (err) {
        console.error("Error fetching live estimate:", err);
      }
    };

    // Debounce the fetch slightly to avoid spamming the backend
    const timeoutId = setTimeout(fetchLiveEstimate, 300);
    return () => clearTimeout(timeoutId);
  }, [surveyW, surveyD, surveyH, surveyThickness, surveyConfigType, selectedFaces, token]);


  // --- Survey Form submission ---
  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    if (!surveyCustomer) return alert("Please select a customer.");
    if (selectedFaces.length === 0) return alert("Please select at least 1 cooling face.");

    const body = {
      customerId: parseInt(surveyCustomer),
      status: submitStatusType,
      inputSnapshot: {
        H: parseFloat(surveyH),
        W: parseFloat(surveyW),
        D: parseFloat(surveyD),
        faces: selectedFaces,
        faceSelectionType: surveyConfigType,
        thickness: parseFloat(surveyThickness)
      }
    };

    try {
      const response = await fetchWithAuth(`${API_URL}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Open Modal details
      handleOpenQuoteDetails(data.id);
      setCurrentPage('dashboard');
    } catch (err) {
      alert("Error generating quote: " + err.message);
    }
  };

  // --- Customer Addition ---
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetchWithAuth(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: custName,
          siteAddress: custAddress,
          contactNumber: custContact,
          email: custEmail
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setCustomerModalOpen(false);
      setCustName('');
      setCustAddress('');
      setCustContact('');
      setCustEmail('');
      loadCustomers();
    } catch (err) {
      alert("Error adding customer: " + err.message);
    }
  };

  // --- Rate Card Save ---
  const handleRateCardSubmit = async (e) => {
    e.preventDefault();

    const body = {
      versionLabel: rcVersion,
      effectiveDate: new Date().toISOString().slice(0, 10),
      isActive: true,
      coolingPadUnitCost: parseFloat(rcPadCost),
      aluminiumCostPerBar: parseFloat(rcSidePlateCost),
      plateCostPerSheet: parseFloat(rcBottomPlateCost),
      supportPattiCostPerBar: parseFloat(rcSupportPattiCost),
      wastageFactor: 0.07, // constant fallback
      lphMultiplier: parseFloat(rcLphMultiplier),
      plumbingCostBands: adminPlumbingBands
    };

    try {
      // 1. Save new versioned RateCard
      let response = await fetchWithAuth(`${API_URL}/rate-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // 2. Save/Update Config keys
      await fetchWithAuth(`${API_URL}/configs/padSheetWidth`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: rcPadW }) });
      await fetchWithAuth(`${API_URL}/configs/padSheetHeight`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: rcPadH }) });
      await fetchWithAuth(`${API_URL}/configs/padSheetDepth`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: rcPadD }) });
      await fetchWithAuth(`${API_URL}/configs/padReqQty`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: rcPadQty }) });

      await fetchWithAuth(`${API_URL}/configs/bottomPlateWidth`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: rcBottomPlateW }) });
      await fetchWithAuth(`${API_URL}/configs/bottomPlateHeight`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: rcBottomPlateH }) });
      await fetchWithAuth(`${API_URL}/configs/bottomPlateDepth`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: rcBottomPlateD }) });
      await fetchWithAuth(`${API_URL}/configs/bottomPlateReqQty`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: rcBottomPlateQty }) });

      await fetchWithAuth(`${API_URL}/configs/sidePlateWidth`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: rcSidePlateW }) });
      await fetchWithAuth(`${API_URL}/configs/sidePlateHeight`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: rcSidePlateH }) });
      await fetchWithAuth(`${API_URL}/configs/sidePlateDepth`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: rcSidePlateD }) });
      await fetchWithAuth(`${API_URL}/configs/sidePlateReqQty`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: rcSidePlateQty }) });

      await fetchWithAuth(`${API_URL}/configs/supportPattiWidth`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: rcSupportPattiW }) });
      await fetchWithAuth(`${API_URL}/configs/supportPattiHeight`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: rcSupportPattiH }) });
      await fetchWithAuth(`${API_URL}/configs/supportPattiDepth`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: rcSupportPattiD }) });
      await fetchWithAuth(`${API_URL}/configs/supportPattiReqQty`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: rcSupportPattiQty }) });

      // Compat configuration aliases for the core engine:
      await fetchWithAuth(`${API_URL}/configs/aluminiumStockLength`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: rcSidePlateW }) });
      await fetchWithAuth(`${API_URL}/configs/plateStockSize`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ value: `${rcBottomPlateW}x${rcBottomPlateH}` }) });

      // 3. Save Pump Models
      // Delete old pump models and write new ones to maintain clean state
      // (For Phase 1 simplicity, we just post to API)
      for (const pump of adminPumps) {
        // Find existing pump to edit or create new
        const existing = pumpModels.find(p => p.modelName === pump.modelName);
        if (existing) {
          await fetchWithAuth(`${API_URL}/pump-models/${existing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...pump, isActive: true })
          });
        } else {
          await fetchWithAuth(`${API_URL}/pump-models`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...pump, isActive: true })
          });
        }
      }

      alert("Configuration successfully saved & activated!");
      setRcVersion('');
      loadInitialData();
      loadRateCards();
    } catch (err) {
      alert("Error saving rate card: " + err.message);
    }
  };

  // --- Quote Viewer ---
  const handleOpenQuoteDetails = async (quoteId) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/quotations/${quoteId}`);
      const data = await res.json();
      setSelectedQuoteDetail(data);
      setQuoteModalOpen(true);
    } catch (e) {
      console.error(e);
      alert("Error fetching quote details");
    }
  };

  const handleDownloadPdf = (quoteId) => {
    window.open(`${API_URL}/quotations/${quoteId}/pdf`, '_blank');
  };

  const handleToggleAdminActiveCard = async (cardId) => {
    try {
      await fetchWithAuth(`${API_URL}/rate-cards/${cardId}/activate`, { method: 'POST' });
      loadInitialData();
      loadRateCards();
    } catch (e) {
      alert("Error activating rate card: " + e.message);
    }
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
    if (page === 'admin') loadRateCards();
  };

  const handleDuplicateQuote = () => {
    if (!selectedQuoteDetail || !selectedQuoteDetail.inputSnapshot) return;
    const inp = selectedQuoteDetail.inputSnapshot;
    setSurveyCustomer(selectedQuoteDetail.customerId || selectedQuoteDetail.customer_id);
    setSurveyW(inp.W || 0);
    setSurveyD(inp.D || 0);
    setSurveyH(inp.H || 0);
    setSurveyThickness(inp.thickness || 100);
    setSurveyConfigType(inp.faceSelectionType || '3-face');
    setSelectedFaces(inp.faces || []);
    setQuoteModalOpen(false);
    navigateTo('survey');
  };

  // --- LOGIN PANEL VIEW ---
  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">Adiabatic Cooler Quatation</div>
          <div className="login-subtitle">Adiabatic System Automated Quotations</div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" required placeholder="engineer@example.com" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" required placeholder="••••••••" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />
            </div>
            <button type="submit" className="btn">Log In</button>
          </form>
          {loginError && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '1.25rem' }}>{loginError}</div>}
        </div>
      </div>
    );
  }

  // Filter quotations
  const now = new Date();
  const filteredQuotations = quotations.filter(q => {
    let match = true;
    if (searchQuery && !q.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) match = false;
    if (statusFilter !== 'all' && q.status !== statusFilter) match = false;
    if (dateFilter === 'this-month') {
      const d = new Date(q.created_at);
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) match = false;
    }
    return match;
  });

  const quotesThisMonth = quotations.filter(q => {
    const d = new Date(q.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const totalValueThisMonth = quotations
    .filter(q => {
      const d = new Date(q.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && q.status !== 'draft';
    })
    .reduce((sum, q) => sum + (q.outputSnapshot?.grandTotal || 0), 0);

  return (
    <div className="app-wrapper">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="sidebar-brand" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'center' }}>
          <img src={seetechLogo} alt="Seetech" style={{ maxWidth: '100%', maxHeight: '50px', objectFit: 'contain' }} />
        </div>
        <nav className="nav-menu">
          <div className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => navigateTo('dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </div>
          <div className={`nav-item ${currentPage === 'survey' ? 'active' : ''}`} onClick={() => navigateTo('survey')}>
            <Calculator size={18} /> New Survey
          </div>
          <div className={`nav-item ${currentPage === 'customers' ? 'active' : ''}`} onClick={() => navigateTo('customers')}>
            <Users size={18} /> Customers
          </div>
          {user && user.role === 'admin' && (
            <div className={`nav-item ${currentPage === 'admin' ? 'active' : ''}`} onClick={() => navigateTo('admin')}>
              <Settings size={18} /> Rate Cards & Config
            </div>
          )}
        </nav>

        <div className="user-profile">
          <div className="user-avatar">{user?.name ? user.name.charAt(0) : 'U'}</div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}><LogOut size={16} /> Log Out</button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        
        {/* VIEW A: DASHBOARD */}
        {currentPage === 'dashboard' && (
          <section>
            <div className="page-header">
              <div className="page-title">
                <h1>Quotation Dashboard</h1>
                <p>Welcome back! Select a quote to view breakdown or build a new estimate.</p>
              </div>
              <button className="btn btn-sm" style={{ width: 'auto' }} onClick={() => navigateTo('survey')}>+ New Survey</button>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
  <div className="metric-icon" style={{ backgroundColor: 'rgba(56, 95, 168, 0.1)', color: '#385FA8' }}><FileSpreadsheet size={28} /></div>
  <div className="metric-info">
    <div className="metric-title">Quotes This Month</div>
    <div className="metric-value">{quotesThisMonth}</div>
  </div>
</div>
              <div className="metric-card">
  <div className="metric-icon" style={{ backgroundColor: 'rgba(80, 184, 64, 0.1)', color: '#50B840' }}><IndianRupee size={28} /></div>
  <div className="metric-info">
    <div className="metric-title">Total Value This Month</div>
    <div className="metric-value">₹{totalValueThisMonth.toFixed(2)}</div>
  </div>
</div>
              <div className="metric-card">
  <div className="metric-icon" style={{ backgroundColor: 'rgba(77, 77, 77, 0.1)', color: '#4D4D4D' }}><Percent size={28} /></div>
  <div className="metric-info">
    <div className="metric-title">Active Rate Version</div>
    <div className="metric-value" style={{ fontSize: '1.1rem' }}>{activeRateCard ? activeRateCard.versionLabel : 'N/A'}</div>
  </div>
</div>
            </div>

            <div className="table-container">
              <div className="table-header-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <h2>Recent Estimates</h2>
                <input type="text" className="search-box" style={{ flex: 1 }} placeholder="Search by customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <select className="search-box" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="final">Final</option>
                </select>
                <select className="search-box" style={{ width: 'auto' }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                  <option value="all">All Time</option>
                  <option value="this-month">This Month</option>
                </select>
              </div>
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Quote ID</th>
                    <th>Date Created</th>
                    <th>Customer Name</th>
                    <th>Selected Face Configuration</th>
                    <th>Status</th>
                    <th>Est. Grand Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotations.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No quotations match your filters.</td></tr>
                  ) : (
                    filteredQuotations.map(q => (
                      <tr key={q.id}>
                        <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>Q-{(q.id)}</td>
                        <td>{new Date(q.created_at).toLocaleDateString()}</td>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{q.customer_name}</td>
                        <td style={{ fontSize: '0.85rem' }}>{q.inputSnapshot?.faceSelectionType} ({(q.inputSnapshot?.faces || []).join(', ')})</td>
                        <td>
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: q.status === 'final' ? 'var(--success)' : '#e2e8f0', color: q.status === 'final' ? '#fff' : 'var(--text-secondary)' }}>
                            {q.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--success)' }}>₹{(q.outputSnapshot?.grandTotal || 0).toFixed(2)}</td>
                        <td style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary btn-sm" style={{ width: 'auto' }} onClick={() => handleOpenQuoteDetails(q.id)}><Eye size={16} style={{ marginRight: "0.25rem" }} /> View</button>
                          <button className="btn btn-sm" style={{ width: 'auto', backgroundColor: 'var(--accent-primary)', color: 'white' }} onClick={() => handleDownloadPdf(q.id)}><FileText size={16} style={{ marginRight: "0.25rem" }} /> PDF</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* VIEW B: NEW SURVEY CALCULATOR */}
        {currentPage === 'survey' && (
          <section>
            <div className="page-header">
              <div className="page-title">
                <h1>Site Survey Calculator</h1>
                <p>Configure measurements and live preview calculated cost estimates.</p>
              </div>
            </div>

            <div className="two-col-grid">
              <div className="table-container" style={{ padding: '2rem', backgroundColor: 'var(--bg-secondary)' }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Inputs Sizing Survey</h2>
                <form onSubmit={handleSurveySubmit}>
                  
                  <div className="form-group">
                    <label>Select Customer</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select value={surveyCustomer} onChange={(e) => setSurveyCustomer(e.target.value)} required>
                        <option value="">-- Choose customer --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <button type="button" className="btn btn-secondary btn-sm" style={{ width: 'auto' }} onClick={() => setCustomerModalOpen(true)}>+ Add</button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Width (W) - mm</label>
                      <input type="number" required min="100" value={surveyW} onChange={(e) => setSurveyW(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                      <label>Depth (D) - mm</label>
                      <input type="number" required min="100" value={surveyD} onChange={(e) => setSurveyD(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                      <label>Height (H) - mm</label>
                      <input type="number" required min="100" value={surveyH} onChange={(e) => setSurveyH(parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Pad Thickness</label>
                    <select value={surveyThickness} onChange={(e) => setSurveyThickness(parseFloat(e.target.value) || 100)} required>
                      <option value="100">100 mm</option>
                      <option value="150">150 mm</option>
                      <option value="200">200 mm</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Configuration Type</label>
                    <select value={surveyConfigType} onChange={(e) => handleConfigTypeChange(e.target.value)} required>
                      <option value="3-face">3 Faces (U-Shape - Open Front)</option>
                      <option value="4-face">4 Faces (Full Wrap)</option>
                      <option value="2-opposite">2 Opposite Faces (Front/Back)</option>
                      <option value="2-adjacent">2 Adjacent Faces (Back/Left)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-secondary" onClick={() => setSubmitStatusType('draft')}>Save as Draft</button>
                    <button type="submit" className="btn" onClick={() => setSubmitStatusType('final')}>Generate Quotation</button>
                  </div>
                </form>
              </div>

              {/* Live Preview Side Column */}
              <div>
                <div className="geometry-preview">
                  <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Visual Face Preview</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click face elements directly to customize selection:</p>
                  
                  <div className="box-diagram">
                    <div className={`face-element face-front ${selectedFaces.includes('Front') ? 'selected' : ''}`} onClick={() => toggleFace('Front')}>FRONT</div>
                    <div className={`face-element face-back ${selectedFaces.includes('Back') ? 'selected' : ''}`} onClick={() => toggleFace('Back')}>BACK</div>
                    <div className={`face-element face-left ${selectedFaces.includes('Left') ? 'selected' : ''}`} onClick={() => toggleFace('Left')}>LEFT</div>
                    <div className={`face-element face-right ${selectedFaces.includes('Right') ? 'selected' : ''}`} onClick={() => toggleFace('Right')}>RIGHT</div>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Corner Posts Count: <strong style={{ color: 'var(--text-primary)' }}>
                      {surveyConfigType === '2-adjacent' ? 3 : 4}
                    </strong>
                  </div>
                </div>

                {/* Estimate panel */}
                <div className="table-container" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '1rem', textTransform: 'uppercase' }}>Live Estimate</h3>
                  <table style={{ width: '100%', fontSize: '0.9rem', lineHeight: 2.2 }}>
                    <tbody>
                      <tr>
                        <td style={{ color: 'var(--text-secondary)' }}>Total Cooling Pads:</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{liveEstimate.totalPads} sheet(s)</td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--text-secondary)' }}>Aluminium Frame (bars):</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{liveEstimate.frameBars} pcs</td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--text-secondary)' }}>Support Patti (bars):</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{liveEstimate.pattiBars} pcs</td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--text-secondary)' }}>Plate Sheeting (sheets):</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{liveEstimate.plateSheets} sheets</td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--text-secondary)' }}>Flow rate required:</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{liveEstimate.requiredFlowLPH.toFixed(0)} LPH</td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--text-secondary)' }}>Selected pump model:</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{liveEstimate.pumpModelName}</td>
                      </tr>
                      <tr style={{ borderTop: '1px solid var(--border-color)', fontWeight: 700, fontSize: '1.1rem' }}>
                        <td style={{ color: 'var(--text-primary)', paddingTop: '0.5rem' }}>Estimated Total:</td>
                        <td style={{ textAlign: 'right', color: 'var(--accent-primary)', paddingTop: '0.5rem' }}>₹{liveEstimate.grandTotal.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* VIEW C: CUSTOMERS DIRECTORY */}
        {currentPage === 'customers' && (
          <section>
            <div className="page-header">
              <div className="page-title">
                <h1>Customer Directory</h1>
                <p>Manage customer billing information and site delivery parameters.</p>
              </div>
              <button className="btn btn-sm" style={{ width: 'auto' }} onClick={() => setCustomerModalOpen(true)}>+ Add Customer</button>
            </div>

            <div className="table-container">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Site Address</th>
                    <th>Contact Phone</th>
                    <th>Email Address</th>
                    <th>Date Added</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No customers registered.</td></tr>
                  ) : (
                    customers.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                        <td>{c.site_address}</td>
                        <td>{c.contact_number || 'N/A'}</td>
                        <td>{c.email || 'N/A'}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* VIEW D: ADMIN SETTINGS PANEL */}
        {currentPage === 'admin' && (
          <section>
            <div className="page-header">
              <div className="page-title">
                <h1>Configurations & Rate Card Manager</h1>
                <p>Update base material sizing constants, price version controls, and wastage calculations.</p>
              </div>
            </div>

            <div className="two-col-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
              <div className="table-container" style={{ padding: '2rem', backgroundColor: 'var(--bg-secondary)' }}>
                <h2 style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Create New Rate Card Version</h2>
                <form onSubmit={handleRateCardSubmit}>
                  
                  <div className="form-group">
                    <label>Version Label</label>
                    <input type="text" required placeholder="e.g. July 2026 Adjustments" value={rcVersion} onChange={(e) => setRcVersion(e.target.value)} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                    
                    {/* Item 1: Evaporative Cooling Pad 7090(NTK) */}
                    <div className="product-input-card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--accent-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Evaporative Cooling Pad 7090(NTK)</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Height (mm)</span>
                          <input type="number" required placeholder="Height" value={rcPadH} onChange={(e) => setRcPadH(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Width (mm)</span>
                          <input type="number" required placeholder="Width" value={rcPadW} onChange={(e) => setRcPadW(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Depth (mm)</span>
                          <input type="number" required placeholder="Depth" value={rcPadD} onChange={(e) => setRcPadD(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Req. Qty</span>
                          <input type="number" required placeholder="Req.Qty" value={rcPadQty} onChange={(e) => setRcPadQty(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Rate (₹)</span>
                          <input type="number" step="0.01" required placeholder="Rate" value={rcPadCost} onChange={(e) => setRcPadCost(parseFloat(e.target.value) || 0)} />
                        </div>
                      </div>
                    </div>

                    {/* Item 2: Aluminium Frame - Bottom Plate */}
                    <div className="product-input-card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--accent-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Aluminium Frame - Bottom Plate</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Height (mm)</span>
                          <input type="number" required placeholder="Height" value={rcBottomPlateH} onChange={(e) => setRcBottomPlateH(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Width (mm)</span>
                          <input type="number" required placeholder="Width" value={rcBottomPlateW} onChange={(e) => setRcBottomPlateW(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Depth (mm)</span>
                          <input type="number" required placeholder="Depth" value={rcBottomPlateD} onChange={(e) => setRcBottomPlateD(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Req. Qty</span>
                          <input type="number" required placeholder="Req.Qty" value={rcBottomPlateQty} onChange={(e) => setRcBottomPlateQty(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Rate (₹)</span>
                          <input type="number" step="0.01" required placeholder="Rate" value={rcBottomPlateCost} onChange={(e) => setRcBottomPlateCost(parseFloat(e.target.value) || 0)} />
                        </div>
                      </div>
                    </div>

                    {/* Item 3: Aluminium Frame - Side Plate */}
                    <div className="product-input-card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--accent-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Aluminium Frame - Side Plate</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Height (mm)</span>
                          <input type="number" required placeholder="Height" value={rcSidePlateH} onChange={(e) => setRcSidePlateH(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Width (mm)</span>
                          <input type="number" required placeholder="Width" value={rcSidePlateW} onChange={(e) => setRcSidePlateW(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Depth (mm)</span>
                          <input type="number" required placeholder="Depth" value={rcSidePlateD} onChange={(e) => setRcSidePlateD(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Req. Qty</span>
                          <input type="number" required placeholder="Req.Qty" value={rcSidePlateQty} onChange={(e) => setRcSidePlateQty(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Rate (₹)</span>
                          <input type="number" step="0.01" required placeholder="Rate" value={rcSidePlateCost} onChange={(e) => setRcSidePlateCost(parseFloat(e.target.value) || 0)} />
                        </div>
                      </div>
                    </div>

                    {/* Item 4: Aluminium Suport Patti */}
                    <div className="product-input-card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--accent-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Aluminium Suport Patti</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Height (mm)</span>
                          <input type="number" required placeholder="Height" value={rcSupportPattiH} onChange={(e) => setRcSupportPattiH(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Width (mm)</span>
                          <input type="number" required placeholder="Width" value={rcSupportPattiW} onChange={(e) => setRcSupportPattiW(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Depth (mm)</span>
                          <input type="number" required placeholder="Depth" value={rcSupportPattiD} onChange={(e) => setRcSupportPattiD(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Req. Qty</span>
                          <input type="number" required placeholder="Req.Qty" value={rcSupportPattiQty} onChange={(e) => setRcSupportPattiQty(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Rate (₹)</span>
                          <input type="number" step="0.01" required placeholder="Rate" value={rcSupportPattiCost} onChange={(e) => setRcSupportPattiCost(parseFloat(e.target.value) || 0)} />
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Required flow rate multiplier (LPH / sqft)</label>
                    <input type="number" step="0.1" required value={rcLphMultiplier} onChange={(e) => setRcLphMultiplier(parseFloat(e.target.value) || 0)} />
                  </div>

                  {/* Pumps edit */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <h3>Active Pump models</h3>
                      <button type="button" className="btn btn-secondary btn-sm" style={{ width: 'auto' }} onClick={() => setAdminPumps([...adminPumps, { modelName: '', capacityLPH: 0, cost: 0 }])}>+ Add Pump</button>
                    </div>
                    <table className="app-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Model Name</th>
                          <th>Capacity (LPH)</th>
                          <th>Cost (₹)</th>
                          <th>Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminPumps.map((p, idx) => (
                          <tr key={idx}>
                            <td><input type="text" className="table-input" value={p.modelName} onChange={(e) => {
                              const list = [...adminPumps];
                              list[idx].modelName = e.target.value;
                              setAdminPumps(list);
                            }} required /></td>
                            <td><input type="number" className="table-input" value={p.capacityLPH} onChange={(e) => {
                              const list = [...adminPumps];
                              list[idx].capacityLPH = parseFloat(e.target.value) || 0;
                              setAdminPumps(list);
                            }} required /></td>
                            <td><input type="number" step="0.01" className="table-input" value={p.cost} onChange={(e) => {
                              const list = [...adminPumps];
                              list[idx].cost = parseFloat(e.target.value) || 0;
                              setAdminPumps(list);
                            }} required /></td>
                            <td><button type="button" className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setAdminPumps(adminPumps.filter((_, i) => i !== idx))}>🗑</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Plumbing cost bands */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <h3>Plumbing Cost Bands</h3>
                      <button type="button" className="btn btn-secondary btn-sm" style={{ width: 'auto' }} onClick={() => setAdminPlumbingBands([...adminPlumbingBands, { minFlowLPH: 0, maxFlowLPH: 0, cost: 0 }])}>+ Add Band</button>
                    </div>
                    <table className="app-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Min Flow (LPH)</th>
                          <th>Max Flow (LPH)</th>
                          <th>Cost (₹)</th>
                          <th>Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminPlumbingBands.map((b, idx) => (
                          <tr key={idx}>
                            <td><input type="number" className="table-input" value={b.minFlowLPH} onChange={(e) => {
                              const list = [...adminPlumbingBands];
                              list[idx].minFlowLPH = parseFloat(e.target.value) || 0;
                              setAdminPlumbingBands(list);
                            }} required /></td>
                            <td><input type="number" className="table-input" value={b.maxFlowLPH} onChange={(e) => {
                              const list = [...adminPlumbingBands];
                              list[idx].maxFlowLPH = parseFloat(e.target.value) || 0;
                              setAdminPlumbingBands(list);
                            }} required /></td>
                            <td><input type="number" step="0.01" className="table-input" value={b.cost} onChange={(e) => {
                              const list = [...adminPlumbingBands];
                              list[idx].cost = parseFloat(e.target.value) || 0;
                              setAdminPlumbingBands(list);
                            }} required /></td>
                            <td><button type="button" className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setAdminPlumbingBands(adminPlumbingBands.filter((_, i) => i !== idx))}>🗑</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button type="submit" className="btn" style={{ marginTop: '2rem' }}>Save and Activate Card</button>
                </form>
              </div>

              {/* Version History Side Column */}
              <div className="table-container" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Version History</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {rateCards.map(rc => (
                    <div key={rc.id} className="metric-card" style={{ border: rc.isActive ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{rc.versionLabel}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Effective: {rc.effectiveDate}</div>
                        </div>
                        {rc.isActive ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: '600' }}>● Active</span>
                        ) : (
                          <button className="btn btn-secondary btn-sm" style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleToggleAdminActiveCard(rc.id)}>Activate</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* --- ADD NEW CUSTOMER MODAL --- */}
      {customerModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <button className="modal-close" onClick={() => setCustomerModalOpen(false)}>✖</button>
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Customer</h2>
            <form onSubmit={handleCustomerSubmit}>
              <div className="form-group">
                <label>Customer/Company Name</label>
                <input type="text" required placeholder="e.g. Delta Cooling LLC" value={custName} onChange={(e) => setCustName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Site Delivery Address</label>
                <textarea required rows="3" placeholder="Enter physical site address" value={custAddress} onChange={(e) => setCustAddress(e.target.value)}></textarea>
              </div>
              <div className="form-group">
                <label>Contact Phone Number</label>
                <input type="text" placeholder="e.g. 555-1234" value={custContact} onChange={(e) => setCustContact(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="e.g. contact@deltacool.com" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} />
              </div>
              <button type="submit" className="btn">Register Customer</button>
            </form>
          </div>
        </div>
      )}

      {/* --- DETAILED QUOTATION VIEW MODAL --- */}
      {quoteModalOpen && selectedQuoteDetail && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setQuoteModalOpen(false)}>✖</button>
            
            <div className="quote-view-container">
              <div className="quote-view-header">
                <h2>QUOTE #Q-{selectedQuoteDetail.id}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Date Generated: {new Date(selectedQuoteDetail.created_at).toLocaleDateString()}</p>
              </div>

              <div className="two-col-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Client Details</h3>
                  <ul className="specs-list">
                    <li><span>Name:</span> <span style={{ color: 'var(--text-primary)', fontWeight: 'normal' }}>{selectedQuoteDetail.customer_name}</span></li>
                    <li><span>Site Address:</span> <span style={{ color: 'var(--text-primary)', fontWeight: 'normal' }}>{selectedQuoteDetail.site_address}</span></li>
                    <li><span>Contact:</span> <span style={{ color: 'var(--text-primary)', fontWeight: 'normal' }}>{selectedQuoteDetail.contact_number || 'N/A'}</span></li>
                  </ul>
                </div>
                <div>
                  <h3 style={{ fontSize: '0.95rem', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Cooler Specifications</h3>
                  <ul className="specs-list">
                    <li><span>Dimensions (H x W x D):</span> <span style={{ color: 'var(--text-primary)', fontWeight: 'normal' }}>{selectedQuoteDetail.inputSnapshot?.W}x{selectedQuoteDetail.inputSnapshot?.D}x{selectedQuoteDetail.inputSnapshot?.H} mm</span></li>
                    <li><span>Faces Selected:</span> <span style={{ color: 'var(--text-primary)', fontWeight: 'normal' }}>{selectedQuoteDetail.inputSnapshot?.faceSelectionType} ({(selectedQuoteDetail.inputSnapshot?.faces || []).join(', ')})</span></li>
                    <li><span>Pad Thickness:</span> <span style={{ color: 'var(--text-primary)', fontWeight: 'normal' }}>{selectedQuoteDetail.inputSnapshot?.thickness} mm</span></li>
                  </ul>
                </div>
              </div>

              {/* Table */}
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Line-Item Price Breakdown</h3>
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Item Description</th>
                      <th style={{ textAlign: 'center' }}>Quantity</th>
                      <th style={{ textAlign: 'right' }}>Unit Rate</th>
                      <th style={{ textAlign: 'right' }}>Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuoteDetail.outputSnapshot && (
                      <>
                        <tr>
                          <td>Evaporative Cooling Pads</td>
                          <td style={{ textAlign: 'center' }}>{selectedQuoteDetail.outputSnapshot.pads?.totalPads}</td>
                          <td style={{ textAlign: 'right' }}>₹{(selectedQuoteDetail.rates?.coolingPadUnitCost || 0).toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>₹{(selectedQuoteDetail.outputSnapshot.pads?.cost || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>Bottom Plate & Side Plates</td>
                          <td style={{ textAlign: 'center' }}>{selectedQuoteDetail.outputSnapshot.plates?.sheetsNeeded}</td>
                          <td style={{ textAlign: 'right' }}>₹{(selectedQuoteDetail.rates?.plateCostPerSheet || 0).toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>₹{(selectedQuoteDetail.outputSnapshot.plates?.cost || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>Aluminium Outer Frame Channels</td>
                          <td style={{ textAlign: 'center' }}>{selectedQuoteDetail.outputSnapshot.frame?.barsNeeded}</td>
                          <td style={{ textAlign: 'right' }}>₹{(selectedQuoteDetail.rates?.aluminiumCostPerBar || 0).toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>₹{(selectedQuoteDetail.outputSnapshot.frame?.cost || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>Support Patti joint channels</td>
                          <td style={{ textAlign: 'center' }}>{selectedQuoteDetail.outputSnapshot.patti?.barsNeeded}</td>
                          <td style={{ textAlign: 'right' }}>₹{(selectedQuoteDetail.rates?.supportPattiCostPerBar || 0).toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>₹{(selectedQuoteDetail.outputSnapshot.patti?.cost || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>Plumbing Pipeline Sizing Fittings</td>
                          <td style={{ textAlign: 'center' }}>1</td>
                          <td style={{ textAlign: 'right' }}>₹{(selectedQuoteDetail.outputSnapshot.pumpPlumbing?.plumbingCost || 0).toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>₹{(selectedQuoteDetail.outputSnapshot.pumpPlumbing?.plumbingCost || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>Water pump model: {(selectedQuoteDetail.outputSnapshot.pumpPlumbing?.selectedPump?.modelName || 'N/A')}</td>
                          <td style={{ textAlign: 'center' }}>1</td>
                          <td style={{ textAlign: 'right' }}>₹{(selectedQuoteDetail.outputSnapshot.pumpPlumbing?.selectedPump?.cost || 0).toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>₹{(selectedQuoteDetail.outputSnapshot.pumpPlumbing?.pumpCost || 0).toFixed(2)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="quote-total-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Grand Total Sizing Estimate</p>
                  <h2>₹{(selectedQuoteDetail.outputSnapshot?.grandTotal || 0).toFixed(2)}</h2>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={handleDuplicateQuote}>Duplicate as New Survey</button>
                  {selectedQuoteDetail.status === 'final' && (
                    <button className="btn" style={{ width: 'auto' }} onClick={() => handleDownloadPdf(selectedQuoteDetail.id)}>Download Official PDF</button>
                  )}
                </div>
              </div>

              {/* Engineering details */}
              {selectedQuoteDetail.outputSnapshot && (
                <div className="eng-specs-panel">
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Internal Engineering Material Breakdown</h3>
                  <div className="eng-grid">
                    <div className="eng-group">
                      <h4>Pads Detail</h4>
                      <ul>
                        <li>Total pads: <strong>{selectedQuoteDetail.outputSnapshot.pads?.totalPads} sheet(s)</strong></li>
                        {selectedQuoteDetail.outputSnapshot.pads?.breakdown?.map((fd, i) => (
                          <li key={i} style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>• {fd.name}: {fd.padsAcrossWidth}W x {fd.padsAcrossHeight}H ({fd.padsForFace} pads)</li>
                        ))}
                      </ul>
                    </div>
                    <div className="eng-group">
                      <h4>Outer Framing</h4>
                      <ul>
                        <li>Total Length: <strong>{selectedQuoteDetail.outputSnapshot.frame?.totalLength?.toFixed(0)} mm</strong></li>
                        <li>Bars: <strong>{selectedQuoteDetail.outputSnapshot.frame?.barsNeeded} pcs</strong> ({selectedQuoteDetail.rates?.alu_stock_length}mm)</li>
                      </ul>
                    </div>
                    <div className="eng-group">
                      <h4>Plates & Patti</h4>
                      <ul>
                        <li>Patti verticals: <strong>{selectedQuoteDetail.outputSnapshot.patti?.postsCount} posts</strong> ({selectedQuoteDetail.outputSnapshot.patti?.barsNeeded} bars)</li>
                        <li>Plate sheets: <strong>{selectedQuoteDetail.outputSnapshot.plates?.sheetsNeeded} sheets</strong></li>
                      </ul>
                    </div>
                    <div className="eng-group">
                      <h4>Pumps & plumbing</h4>
                      <ul>
                        <li>Flow rate required: <strong>{selectedQuoteDetail.outputSnapshot.pumpPlumbing?.requiredFlowLPH?.toFixed(0)} LPH</strong></li>
                        <li>Pump capacity: <strong>{selectedQuoteDetail.outputSnapshot.pumpPlumbing?.selectedPump?.capacityLPH} LPH</strong></li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
