const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf-8');

// 1. Add imports at the top
const iconImports = "import { LayoutDashboard, Calculator, Users, Settings, LogOut, Snowflake, Eye, FileText, FileSpreadsheet, IndianRupee, Percent } from 'lucide-react';\n";
app = app.replace(/import React[^;]*;\n/, match => match + iconImports);

// 2. Replace emojis in Sidebar
app = app.replace(/<span>📊<\/span>/, '<LayoutDashboard size={18} />');
app = app.replace(/<span>📐<\/span>/, '<Calculator size={18} />');
app = app.replace(/<span>👥<\/span>/, '<Users size={18} />');
app = app.replace(/<span>⚙️<\/span>/, '<Settings size={18} />');
app = app.replace(/🚪\s*Log Out/, '<LogOut size={16} /> Log Out');

// 3. Replace Logo emoji
app = app.replace(/<span style=\{\{\s*color:\s*["']var\(--accent-primary\)["'],\s*fontSize:\s*["']1\.5rem["'],\s*marginRight:\s*["']0\.5rem["']\s*\}\}>❄️<\/span>/, '<Snowflake color="var(--accent-primary)" size={28} style={{ marginRight: "0.5rem" }} />');

// 4. Replace Buttons
app = app.replace(/🔍\s*View/g, '<Eye size={16} style={{ marginRight: "0.25rem" }} /> View');
app = app.replace(/📄\s*PDF/g, '<FileText size={16} style={{ marginRight: "0.25rem" }} /> PDF');

// 5. Replace Metric Cards emojis (from patch.js)
app = app.replace(/<div className="metric-icon"[^>]*>📄<\/div>/, '<div className="metric-icon" style={{ backgroundColor: \'#eff6ff\', color: \'#3b82f6\' }}><FileSpreadsheet size={28} /></div>');
app = app.replace(/<div className="metric-icon"[^>]*>₹<\/div>/, '<div className="metric-icon" style={{ backgroundColor: \'#f0fdf4\', color: \'#16a34a\' }}><IndianRupee size={28} /></div>');
app = app.replace(/<div className="metric-icon"[^>]*>%<\/div>/, '<div className="metric-icon" style={{ backgroundColor: \'#faf5ff\', color: \'#9333ea\' }}><Percent size={28} /></div>');

fs.writeFileSync('src/App.jsx', app);
console.log('Icons patched');
