import React from 'react';

const PHILIPPINE_PROVINCES = [
    "Abra","Agusan del Norte","Agusan del Sur","Aklan","Albay","Antique","Apayao","Aurora","Basilan","Bataan","Batanes","Batangas","Benguet","Biliran","Bohol","Bukidnon","Bulacan","Cagayan","Camarines Norte","Camarines Sur","Camiguin","Capiz","Catanduanes","Cavite","Cebu","Cotabato","Davao de Oro","Davao del Norte","Davao del Sur","Davao Occidental","Davao Oriental","Dinagat Islands","Eastern Samar","Guimaras","Ifugao","Ilocos Norte","Ilocos Sur","Iloilo","Isabela","Kalinga","La Union","Laguna","Lanao del Norte","Lanao del Sur","Leyte","Maguindanao","Marinduque","Masbate","Metro Manila","Misamis Occidental","Misamis Oriental","Mountain Province","Negros Occidental","Negros Oriental","Northern Samar","Nueva Ecija","Nueva Vizcaya","Occidental Mindoro","Oriental Mindoro","Palawan","Pampanga","Pangasinan","Quezon","Quirino","Rizal","Romblon","Samar","Sarangani","Siquijor","Sorsogon","South Cotabato","Southern Leyte","Sultan Kudarat","Sulu","Surigao del Norte","Surigao del Sur","Tarlac","Tawi-Tawi","Zambales","Zamboanga del Norte","Zamboanga del Sur","Zamboanga Sibugay"
];

const styles = `
    .rf-wrap { background:#fff; border:1px solid #d6e8d6; border-radius:16px; padding:18px 22px; margin-bottom:20px; position:relative; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
    .rf-wrap::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,#2e8b4a,transparent); border-radius:16px 16px 0 0; }
    .rf-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
    @media(max-width:800px){ .rf-grid{grid-template-columns:1fr 1fr;} }
    @media(max-width:480px){ .rf-grid{grid-template-columns:1fr;} }
    .rf-label { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:#8aaa96; margin-bottom:6px; display:block; }
    .rf-select { width:100%; background:#f8fbf8; border:1px solid #c8dfc8; border-radius:10px; color:#1a3326; font-family:'Outfit',sans-serif; font-size:12px; padding:9px 12px; outline:none; cursor:pointer; transition:border-color .2s; }
    .rf-select:focus { border-color:#2e8b4a; }
    .rf-date-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:14px; }
    .rf-date-input { width:100%; background:#f8fbf8; border:1px solid #c8dfc8; border-radius:10px; color:#1a3326; font-family:'DM Mono',monospace; font-size:12px; padding:9px 12px; outline:none; transition:border-color .2s; }
    .rf-date-input:focus { border-color:#2e8b4a; }
    .rf-title { font-size:13px; font-weight:600; color:#1a3326; margin-bottom:14px; display:flex; align-items:center; gap:6px; }
`;

export default function ReportFilters({ filters, onChange }) {
    const set = (key, val) => onChange({ ...filters, [key]: val });

    return (
        <div className="rf-wrap">
            <style>{styles}</style>
            <div className="rf-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2e8b4a" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                Filters
            </div>
            <div className="rf-grid">
                <div>
                    <span className="rf-label">Date Range</span>
                    <select className="rf-select" value={filters.date} onChange={e => set('date', e.target.value)}>
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="quarter">Last 3 Months</option>
                        <option value="year">Last Year</option>
                        <option value="custom">Custom Range</option>
                    </select>
                </div>
                <div>
                    <span className="rf-label">Severity</span>
                    <select className="rf-select" value={filters.severity} onChange={e => set('severity', e.target.value)}>
                        <option value="all">All Levels</option>
                        <option value="severe">Severe</option>
                        <option value="moderate">Moderate</option>
                        <option value="low">Low</option>
                    </select>
                </div>
                <div>
                    <span className="rf-label">Province</span>
                    <select className="rf-select" value={filters.province} onChange={e => set('province', e.target.value)}>
                        <option value="all">All Provinces</option>
                        {PHILIPPINE_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                        onClick={() => onChange({ date: 'all', severity: 'all', province: 'all', customStart: '', customEnd: '' })}
                        style={{ width: '100%', padding: '9px 12px', background: 'transparent', border: '1px solid #c8dfc8', borderRadius: 10, color: '#5a8068', fontFamily: "'Outfit',sans-serif", fontSize: 12, cursor: 'pointer', transition: 'background .2s' }}
                        onMouseOver={e => e.target.style.background = 'rgba(46,139,74,0.07)'}
                        onMouseOut={e => e.target.style.background = 'transparent'}
                    >
                        Reset Filters
                    </button>
                </div>
            </div>
            {filters.date === 'custom' && (
                <div className="rf-date-row">
                    <div>
                        <span className="rf-label">Start Date</span>
                        <input type="date" className="rf-date-input" value={filters.customStart} onChange={e => set('customStart', e.target.value)} />
                    </div>
                    <div>
                        <span className="rf-label">End Date</span>
                        <input type="date" className="rf-date-input" value={filters.customEnd} onChange={e => set('customEnd', e.target.value)} />
                    </div>
                </div>
            )}
        </div>
    );
}