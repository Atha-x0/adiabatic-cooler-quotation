const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf-8');

// Replace CSS Variables
css = css.replace(/:root\s*\{[\s\S]*?\}/, `:root {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f5f9;
  
  --accent-primary: #385FA8; /* Seetech Blue */
  --accent-secondary: #2d4c8a; /* Darker Seetech Blue */
  --accent-glow: rgba(56, 95, 168, 0.15);
  
  --text-primary: #0f172a;
  --text-secondary: #4D4D4D; /* Seetech Grey */
  --text-muted: #94a3b8;
  
  --border-color: #e2e8f0;
  --border-glow: rgba(56, 95, 168, 0.3);
  
  --success: #50B840; /* Seetech Green */
  --warning: #f59e0b;
  --danger: #ef4444;
  
  --glass-bg: rgba(255, 255, 255, 0.9);
  --glass-border: rgba(0, 0, 0, 0.08);
}`);

// Replace sidebar-brand
css = css.replace(/\.sidebar-brand\s*\{[\s\S]*?\}/, `.sidebar-brand {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 2.5rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}`);

// Replace nav-item.active
css = css.replace(/\.nav-item\.active\s*\{[\s\S]*?\}/, `.nav-item.active {
  color: var(--accent-secondary);
  background: rgba(56, 95, 168, 0.1);
  border-radius: 0.5rem;
  font-weight: 600;
}`);

// Replace main-content
css = css.replace(/\.main-content\s*\{[\s\S]*?\}/, `.main-content {
  flex-grow: 1;
  padding: 2.5rem;
  overflow-y: auto;
  background-color: var(--bg-primary);
}`);

// Replace metric styles
const newMetricCss = `.metric-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.metric-icon {
  width: 56px;
  height: 56px;
  border-radius: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
}

.metric-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-title {
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}`;

css = css.replace(/\.metric-card\s*\{[\s\S]*?\}\s*\.metric-title\s*\{[\s\S]*?\}\s*\.metric-value\s*\{[\s\S]*?\}/, newMetricCss);

// Replace button background
css = css.replace(/background:\s*linear-gradient\(135deg,\s*var\(--accent-primary\),\s*var\(--accent-secondary\)\);/g, 'background: var(--accent-primary);');

// Replace table header bg
css = css.replace(/background-color:\s*rgba\(255,\s*255,\s*255,\s*0\.02\);/g, 'background-color: var(--bg-primary);');
css = css.replace(/background-color:\s*rgba\(255,\s*255,\s*255,\s*0\.01\);/g, 'background-color: var(--bg-tertiary);');

fs.writeFileSync('src/index.css', css);

let app = fs.readFileSync('src/App.jsx', 'utf-8');
// Fix inline styles with #fff
app = app.replace(/color:\s*'#fff'/g, "color: 'var(--text-primary)'");
// Add logo icon to sidebar-brand
app = app.replace(/<div className="sidebar-brand">/, '<div className="sidebar-brand"><span style={{ color: "var(--accent-primary)", fontSize: "1.5rem", marginRight: "0.5rem" }}>❄️</span> ');

// Update metric cards
app = app.replace(
  /<div className="metric-card">\s*<div className="metric-title">Quotes This Month<\/div>\s*<div className="metric-value">\{quotesThisMonth\}<\/div>\s*<\/div>/,
  `<div className="metric-card">
  <div className="metric-icon" style={{ backgroundColor: 'rgba(56, 95, 168, 0.1)', color: '#385FA8' }}>📄</div>
  <div className="metric-info">
    <div className="metric-title">Quotes This Month</div>
    <div className="metric-value">{quotesThisMonth}</div>
  </div>
</div>`
);

app = app.replace(
  /<div className="metric-card">\s*<div className="metric-title">Total Value This Month<\/div>\s*<div className="metric-value">\s*₹\{totalValueThisMonth\.toFixed\(2\)\}\s*<\/div>\s*<\/div>/,
  `<div className="metric-card">
  <div className="metric-icon" style={{ backgroundColor: 'rgba(80, 184, 64, 0.1)', color: '#50B840' }}>₹</div>
  <div className="metric-info">
    <div className="metric-title">Total Value This Month</div>
    <div className="metric-value">₹{totalValueThisMonth.toFixed(2)}</div>
  </div>
</div>`
);

app = app.replace(
  /<div className="metric-card">\s*<div className="metric-title">Active Rate Version<\/div>\s*<div className="metric-value" style=\{\{ fontSize: '1.1rem', lineHeight: '1.8' \}\}>\s*\{activeRateCard \? activeRateCard\.versionLabel : 'N\/A'\}\s*<\/div>\s*<\/div>/,
  `<div className="metric-card">
  <div className="metric-icon" style={{ backgroundColor: 'rgba(77, 77, 77, 0.1)', color: '#4D4D4D' }}>%</div>
  <div className="metric-info">
    <div className="metric-title">Active Rate Version</div>
    <div className="metric-value" style={{ fontSize: '1.1rem' }}>{activeRateCard ? activeRateCard.versionLabel : 'N/A'}</div>
  </div>
</div>`
);

// Add light gray chip to status
app = app.replace(
  /backgroundColor:\s*q\.status === 'final'\s*\?\s*'var\(--success\)'\s*:\s*'var\(--border-color\)'/,
  "backgroundColor: q.status === 'final' ? 'var(--success)' : '#e2e8f0'"
);
app = app.replace(
  /color:\s*q\.status === 'final'\s*\?\s*'#fff'\s*:\s*'var\(--text-muted\)'/,
  "color: q.status === 'final' ? '#fff' : 'var(--text-secondary)'"
);

// Style PDF button blue
app = app.replace(
  /<button className="btn btn-sm" style=\{\{ width: 'auto' \}\} onClick=\{\(\) => handleDownloadPdf\(q.id\)\}>📄 PDF<\/button>/,
  `<button className="btn btn-sm" style={{ width: 'auto', backgroundColor: 'var(--accent-primary)', color: 'white' }} onClick={() => handleDownloadPdf(q.id)}>📄 PDF</button>`
);

fs.writeFileSync('src/App.jsx', app);
console.log('Patched UI files.');
