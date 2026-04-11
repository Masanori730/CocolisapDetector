import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Download, FileSpreadsheet, CheckCircle, Info, Layers, Eye } from 'lucide-react';
import { format } from 'date-fns';

const PHILIPPINE_PROVINCES = [
    "Abra","Agusan del Norte","Agusan del Sur","Aklan","Albay","Antique","Apayao","Aurora","Basilan","Bataan","Batanes","Batangas","Benguet","Biliran","Bohol","Bukidnon","Bulacan","Cagayan","Camarines Norte","Camarines Sur","Camiguin","Capiz","Catanduanes","Cavite","Cebu","Cotabato","Davao de Oro","Davao del Norte","Davao del Sur","Davao Occidental","Davao Oriental","Dinagat Islands","Eastern Samar","Guimaras","Ifugao","Ilocos Norte","Ilocos Sur","Iloilo","Isabela","Kalinga","La Union","Laguna","Lanao del Norte","Lanao del Sur","Leyte","Maguindanao","Marinduque","Masbate","Metro Manila","Misamis Occidental","Misamis Oriental","Mountain Province","Negros Occidental","Negros Oriental","Northern Samar","Nueva Ecija","Nueva Vizcaya","Occidental Mindoro","Oriental Mindoro","Palawan","Pampanga","Pangasinan","Quezon","Quirino","Rizal","Romblon","Samar","Sarangani","Siquijor","Sorsogon","South Cotabato","Southern Leyte","Sultan Kudarat","Sulu","Surigao del Norte","Surigao del Sur","Tarlac","Tawi-Tawi","Zambales","Zamboanga del Norte","Zamboanga del Sur","Zamboanga Sibugay"
];

const ns = (v) => (v !== undefined && v !== null && v !== '') ? v : 'N/A';
const avg = (arr, key) => arr.length > 0 ? (arr.reduce((s, d) => s + (d[key] || 0), 0) / arr.length) : 0;

const toDate = (val) => {
    if (!val) return null;
    if (typeof val.toDate === 'function') return val.toDate();
    if (val.seconds !== undefined) return new Date(val.seconds * 1000);
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
};

const severityColor = (s) => {
    if (!s) return { bg: '#f1f5f9', color: '#64748b' };
    const sl = s.toLowerCase();
    if (sl === 'severe') return { bg: '#fee2e2', color: '#dc2626' };
    if (sl === 'moderate') return { bg: '#fef9c3', color: '#ca8a04' };
    if (sl === 'low') return { bg: '#dcfce7', color: '#16a34a' };
    return { bg: '#f1f5f9', color: '#64748b' };
};

const riskColor = (r) => {
    if (!r) return { bg: '#f1f5f9', color: '#64748b' };
    if (r === 'HIGH') return { bg: '#fee2e2', color: '#dc2626' };
    if (r === 'MODERATE') return { bg: '#fef9c3', color: '#ca8a04' };
    if (r === 'LOW') return { bg: '#dcfce7', color: '#16a34a' };
    return { bg: '#f1f5f9', color: '#64748b' };
};

const exportStyles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap');
    .export-root { background:#f4f7f4; min-height:100vh; color:#1a3326; font-family:'Outfit',sans-serif; }
    .export-root::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0; background: radial-gradient(ellipse 80% 60% at 15% 10%,rgba(46,139,74,0.04) 0%,transparent 60%); }
    .export-page { position:relative; z-index:1; max-width:960px; margin:0 auto; padding:32px 24px 80px; }
    .export-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(46,139,74,0.10); border:1px solid rgba(46,139,74,0.25); border-radius:100px; padding:4px 12px; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.1em; color:#2e8b4a; text-transform:uppercase; margin-bottom:12px; }
    .export-h1 { font-family:'DM Serif Display',serif; font-size:clamp(26px,4vw,38px); font-weight:400; color:#1a3326; margin:0 0 6px; letter-spacing:-.02em; }
    .export-h1 em { font-style:italic; color:#2e8b4a; }
    .export-sub { font-size:13px; color:#5a8068; font-family:'DM Mono',monospace; }
    .export-divider { height:1px; background:linear-gradient(90deg,rgba(46,139,74,0.25),transparent 80%); margin:20px 0 28px; }
    .export-card { background:#ffffff; border:1px solid #d6e8d6; border-radius:20px; padding:28px 32px; position:relative; overflow:hidden; margin-bottom:20px; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
    .export-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,#2e8b4a,transparent); }
    .export-sec-label { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#8aaa96; margin-bottom:20px; display:block; }
    .export-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    @media(max-width:600px){ .export-grid2{grid-template-columns:1fr;} }
    .export-field-label { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#8aaa96; margin-bottom:8px; display:block; }
    .export-input { width:100%; background:#f8fbf8; border:1px solid #c8dfc8; border-radius:12px; color:#1a3326; font-family:'DM Mono',monospace; font-size:14px; padding:12px 16px; outline:none; transition:border-color .2s,box-shadow .2s; box-sizing:border-box; }
    .export-input:focus { border-color:#2e8b4a; box-shadow:0 0 0 3px rgba(46,139,74,0.08); }
    .export-select { width:100%; background:#f8fbf8; border:1px solid #c8dfc8; border-radius:12px; color:#1a3326; font-family:'Outfit',sans-serif; font-size:14px; padding:12px 16px; outline:none; cursor:pointer; transition:border-color .2s; box-sizing:border-box; }
    .export-select:focus { border-color:#2e8b4a; }
    .export-filters-inner { display:grid; grid-template-columns:1fr 1fr; gap:12px; align-items:start; }
    @media(max-width:480px){ .export-filters-inner{grid-template-columns:1fr;} }
    .export-count-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
    @media(max-width:600px){ .export-count-row{grid-template-columns:1fr;} }
    .export-count-box { background:rgba(46,139,74,0.06); border:1px solid rgba(46,139,74,0.18); border-radius:14px; padding:14px 18px; }
    .export-count-text { font-family:'DM Mono',monospace; font-size:12px; color:#5a8068; }
    .export-count-text strong { color:#2e8b4a; font-size:15px; }
    .export-count-label { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#8aaa96; margin-bottom:4px; }
    .export-toast { padding:14px 18px; border-radius:12px; font-family:'DM Mono',monospace; font-size:12px; margin-bottom:20px; display:flex; align-items:center; gap:10px; }
    .export-toast.success { background:rgba(46,139,74,0.08); border:1px solid rgba(46,139,74,0.22); color:#2e8b4a; }
    .export-toast.error { background:rgba(220,38,38,0.07); border:1px solid rgba(220,38,38,0.22); color:#dc2626; }
    .export-options-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:28px; }
    @media(max-width:800px){ .export-options-grid{grid-template-columns:1fr;} }
    .export-option-card { background:#ffffff; border:1px solid #d6e8d6; border-radius:18px; padding:24px; position:relative; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,0.05); display:flex; flex-direction:column; }
    .export-option-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
    .export-option-card.green::before { background:linear-gradient(90deg,#2e8b4a,transparent); }
    .export-option-card.blue::before { background:linear-gradient(90deg,#3b82f6,transparent); }
    .export-option-card.purple::before { background:linear-gradient(90deg,#8b5cf6,transparent); }
    .export-option-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
    .export-option-icon.green { background:rgba(46,139,74,0.10); }
    .export-option-icon.blue { background:rgba(59,130,246,0.10); }
    .export-option-icon.purple { background:rgba(139,92,246,0.10); }
    .export-option-title { font-size:14px; font-weight:600; color:#1a3326; margin:0 0 4px; }
    .export-option-sub { font-size:11px; font-family:'DM Mono',monospace; color:#8aaa96; letter-spacing:.06em; text-transform:uppercase; margin-bottom:10px; }
    .export-option-desc { font-size:12px; color:#5a8068; line-height:1.6; margin:0 0 16px; flex:1; }
    .export-btn-row { display:flex; flex-direction:column; gap:8px; margin-top:auto; }
    .export-dl-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; padding:11px; border:none; border-radius:12px; font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:background .2s,transform .15s,box-shadow .2s; letter-spacing:.02em; }
    .export-dl-btn:disabled { opacity:.4; cursor:not-allowed; transform:none !important; }
    .export-dl-btn.green { background:#2e8b4a; color:#fff; }
    .export-dl-btn.green:hover:not(:disabled) { background:#25763e; transform:translateY(-1px); box-shadow:0 6px 20px rgba(46,139,74,.25); }
    .export-dl-btn.purple { background:#f5f3ff; color:#8b5cf6; border:1px solid rgba(139,92,246,.25); }
    .export-dl-btn.purple:hover:not(:disabled) { background:#ede9fe; transform:translateY(-1px); }
    .export-tips { background:#eff8ff; border:1px solid #bfdbfe; border-radius:16px; padding:20px 24px; display:flex; gap:14px; margin-top:24px; }
    .export-tips-icon { flex-shrink:0; margin-top:2px; }
    .export-tips-title { font-size:13px; font-weight:600; color:#3b82f6; margin:0 0 10px; }
    .export-tips-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:5px; }
    .export-tips-list li { font-size:12px; color:#6090c0; font-family:'DM Mono',monospace; }
    .export-footer { border-top:1px solid #d6e8d6; padding-top:24px; margin-top:40px; font-size:11px; color:#8aaa96; font-family:'DM Mono',monospace; display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; }

    /* ── Preview Table styles ── */
    .preview-section { background:#fff; border:1px solid #d6e8d6; border-radius:20px; overflow:hidden; margin-bottom:28px; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
    .preview-header { padding:18px 24px; border-bottom:1px solid #e8f0e8; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
    .preview-header-left { display:flex; align-items:center; gap:10px; }
    .preview-header-icon { width:32px; height:32px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
    .preview-title { font-size:14px; font-weight:600; color:#1a3326; margin:0; }
    .preview-count-pill { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.08em; padding:3px 10px; border-radius:100px; }
    .preview-count-pill.green { background:rgba(46,139,74,0.10); color:#2e8b4a; }
    .preview-count-pill.blue { background:rgba(59,130,246,0.10); color:#3b82f6; }
    .preview-table-wrap { overflow-x:auto; }
    .preview-table { width:100%; border-collapse:collapse; font-size:13px; }
    .preview-table thead tr { background:#f8fbf8; }
    .preview-table thead th { padding:12px 16px; text-align:left; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#8aaa96; font-weight:500; border-bottom:1px solid #e8f0e8; white-space:nowrap; }
    .preview-table tbody tr { border-bottom:1px solid #f0f6f0; transition:background .15s; }
    .preview-table tbody tr:last-child { border-bottom:none; }
    .preview-table tbody tr:hover { background:#f8fbf8; }
    .preview-table tbody td { padding:12px 16px; color:#2d5040; font-size:13px; white-space:nowrap; }
    .preview-table tbody td.mono { font-family:'DM Mono',monospace; font-size:12px; }
    .preview-badge { display:inline-flex; align-items:center; padding:3px 10px; border-radius:100px; font-size:11px; font-weight:600; font-family:'DM Mono',monospace; }
    .preview-empty { padding:40px; text-align:center; color:#8aaa96; font-family:'DM Mono',monospace; font-size:12px; }
    .preview-footer { padding:12px 24px; border-top:1px solid #e8f0e8; background:#f8fbf8; font-family:'DM Mono',monospace; font-size:10px; color:#8aaa96; letter-spacing:.06em; }

    /* ── How To Use — matches MapDashboard style ── */
    .exp-htu-wrap { background:#fff; border:1px solid #d6e8d6; border-radius:16px; margin-bottom:24px; position:relative; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
    .exp-htu-wrap::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,#2e8b4a,transparent); }
    .exp-htu-header { padding:18px 24px 0; display:flex; align-items:center; gap:10px; }
    .exp-htu-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(46,139,74,0.10); border:1px solid rgba(46,139,74,0.25); border-radius:100px; padding:3px 10px; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.12em; color:#2e8b4a; text-transform:uppercase; }
    .exp-htu-title { font-family:'DM Serif Display',serif; font-size:17px; font-weight:400; color:#1a3326; margin:6px 24px 0; }
    .exp-htu-subtitle { font-family:'DM Mono',monospace; font-size:11px; color:#8aaa96; margin:4px 24px 20px; }
    .exp-htu-steps { display:grid; grid-template-columns:repeat(4,1fr); gap:0; border-top:1px solid #eaf2ea; }
    @media(max-width:800px){ .exp-htu-steps { grid-template-columns:repeat(2,1fr); } }
    @media(max-width:420px){ .exp-htu-steps { grid-template-columns:1fr; } }
    .exp-htu-step { padding:20px; border-right:1px solid #eaf2ea; }
    .exp-htu-step:last-child { border-right:none; }
    @media(max-width:800px){ .exp-htu-step:nth-child(2n) { border-right:none; } }
    .exp-htu-num { width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,#2e8b4a,#4caf72); color:#fff; font-family:'DM Mono',monospace; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; margin-bottom:12px; box-shadow:0 2px 8px rgba(46,139,74,0.28); }
    .exp-htu-step-title { font-size:13px; font-weight:600; color:#1a3326; margin-bottom:6px; line-height:1.3; }
    .exp-htu-step-desc { font-size:11.5px; color:#5a8068; line-height:1.6; font-family:'Outfit',sans-serif; }
    .exp-htu-tip { margin:0 24px 20px; background:rgba(46,139,74,0.04); border:1px solid rgba(46,139,74,0.15); border-radius:10px; padding:10px 14px; display:flex; align-items:flex-start; gap:8px; }
    .exp-htu-tip-icon { font-size:14px; flex-shrink:0; margin-top:1px; }
    .exp-htu-tip-text { font-size:12px; color:#5a8068; font-family:'DM Mono',monospace; line-height:1.6; }
    .exp-htu-tip-text strong { color:#2e8b4a; }
`;

// ── XLSX HELPERS ──────────────────────────────────────────────────────────────

function buildStyledSheet(XLSX, headers, rows, headerColor = '2e8b4a') {
    const aoa = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = headers.map((h, i) => {
        const maxLen = Math.max(String(h).length, ...rows.map(r => String(r[i] ?? '').length));
        return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
    });
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddr]) ws[cellAddr] = { v: '', t: 's' };
            const isHeader = R === 0;
            const isEvenRow = R % 2 === 0 && R !== 0;
            ws[cellAddr].s = {
                font: { name: 'Calibri', sz: isHeader ? 11 : 10, bold: isHeader, color: { rgb: isHeader ? 'FFFFFF' : '1a3326' } },
                fill: { patternType: 'solid', fgColor: { rgb: isHeader ? headerColor : isEvenRow ? 'f0f7f0' : 'FFFFFF' } },
                alignment: { vertical: 'center', horizontal: C === 0 ? 'center' : 'left', wrapText: false },
                border: { bottom: { style: 'thin', color: { rgb: 'd6e8d6' } }, right: { style: 'thin', color: { rgb: 'd6e8d6' } } },
            };
        }
    }
    return ws;
}

function downloadXLSX(sheets, filename) {
    const XLSX = window.XLSX;
    const wb = XLSX.utils.book_new();
    sheets.forEach(({ name, headers, rows, color }) => {
        const ws = buildStyledSheet(XLSX, headers, rows, color || '2e8b4a');
        XLSX.utils.book_append_sheet(wb, ws, name);
    });
    XLSX.writeFile(wb, filename);
}

// ── ROW BUILDERS ─────────────────────────────────────────────────────────────

const DETECTION_HEADERS = [
    'Detection ID', 'Date', 'Time', 'Province', 'Municipality', 'Barangay',
    'Farm Name', 'Farm Owner', 'Latitude', 'Longitude',
    'Severity', 'Total Insects Detected', 'Avg Confidence (%)',
    'Processing Time (s)', 'Location Method'
];

function buildDetectionRows(detections) {
    return detections.map((d, i) => {
        const dt = toDate(d.created_date) || new Date();
        const severity = d.severity ? d.severity.charAt(0).toUpperCase() + d.severity.slice(1) : 'N/A';
        const confidence = d.avg_confidence ? (d.avg_confidence * 100).toFixed(1) : 'N/A';
        const procTime = d.processing_time ? (d.processing_time / 1000).toFixed(2) : 'N/A';
        return [
            `DET-${String(i + 1).padStart(3, '0')}`,
            format(dt, 'yyyy-MM-dd'), format(dt, 'HH:mm:ss'),
            ns(d.province), ns(d.municipality), ns(d.barangay),
            ns(d.farmName), ns(d.farmOwner),
            ns(d.latitude), ns(d.longitude),
            severity, d.total_detections || 0, confidence, procTime, ns(d.locationMethod)
        ];
    });
}

const ASSESSMENT_HEADERS = [
    'Assessment ID', 'Date', 'Time', 'Province', 'Municipality', 'Barangay',
    'Latitude', 'Longitude',
    'Temperature (°C)', 'Humidity (%)', 'Wind Speed (km/h)',
    'Planting Density (trees/ha)', 'Total Trees', 'Days Without Intervention',
    'Fuzzy Base Score', 'Fuzzy Base Label',
    'Intervention Multiplier', 'Adjusted Risk Score', 'Adjusted Risk Label',
    'Degree of Infestation (%)', 'Estimated Infected Trees', 'Estimated Healthy Trees',
    'Wind Direction', 'Intervention Note'
];

function buildAssessmentRows(assessments) {
    return assessments.map((a, i) => {
        const dt = toDate(a.created_date) || new Date();
        return [
            `FZY-${String(i + 1).padStart(3, '0')}`,
            format(dt, 'yyyy-MM-dd'), format(dt, 'HH:mm:ss'),
            ns(a.province), ns(a.municipality), ns(a.barangay),
            ns(a.latitude), ns(a.longitude),
            a.temperature_c, a.humidity_pct, a.wind_speed_kmh,
            a.planting_density, a.total_trees, a.days_without_intervention,
            a.fuzzy_base_score?.toFixed(2), a.fuzzy_base_label,
            a.intervention_multiplier?.toFixed(4),
            a.adjusted_risk_score?.toFixed(2), a.adjusted_risk_label,
            a.degree_of_infestation_pct?.toFixed(2),
            a.estimated_infected_trees, a.estimated_healthy_trees,
            a.wind_direction_compass ? `${a.wind_direction_compass} (${a.wind_direction_deg}°)` : 'N/A',
            ns(a.intervention_note)
        ];
    });
}

// ── PREVIEW TABLES ────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

function Pagination({ page, totalPages, onPage }) {
    if (totalPages <= 1) return null;
    const pages = [];
    const delta = 2;
    const left = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);
    if (left > 1) { pages.push(1); if (left > 2) pages.push('...'); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) { if (right < totalPages - 1) pages.push('...'); pages.push(totalPages); }

    return (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', borderTop:'1px solid #e8f0e8', background:'#f8fbf8', flexWrap:'wrap', gap:8 }}>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'#8aaa96', letterSpacing:'.06em' }}>
                Page {page} of {totalPages}
            </span>
            <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                <button
                    onClick={() => onPage(page - 1)} disabled={page === 1}
                    style={{ padding:'5px 12px', borderRadius:8, border:'1px solid #d6e8d6', background: page === 1 ? '#f0f6f0' : '#fff', color: page === 1 ? '#b0c8b8' : '#2e8b4a', fontFamily:"'DM Mono',monospace", fontSize:11, cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight:600, transition:'all .15s' }}>
                    ← Prev
                </button>
                {pages.map((p, i) =>
                    p === '...'
                        ? <span key={`ellipsis-${i}`} style={{ padding:'0 4px', fontFamily:"'DM Mono',monospace", fontSize:11, color:'#8aaa96' }}>…</span>
                        : <button key={p} onClick={() => onPage(p)}
                            style={{ width:30, height:30, borderRadius:8, border:'1px solid', borderColor: p === page ? '#2e8b4a' : '#d6e8d6', background: p === page ? '#2e8b4a' : '#fff', color: p === page ? '#fff' : '#2e8b4a', fontFamily:"'DM Mono',monospace", fontSize:11, cursor:'pointer', fontWeight: p === page ? 700 : 400, transition:'all .15s' }}>
                            {p}
                          </button>
                )}
                <button
                    onClick={() => onPage(page + 1)} disabled={page === totalPages}
                    style={{ padding:'5px 12px', borderRadius:8, border:'1px solid #d6e8d6', background: page === totalPages ? '#f0f6f0' : '#fff', color: page === totalPages ? '#b0c8b8' : '#2e8b4a', fontFamily:"'DM Mono',monospace", fontSize:11, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight:600, transition:'all .15s' }}>
                    Next →
                </button>
            </div>
        </div>
    );
}

function DetectionPreviewTable({ detections }) {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(detections.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const preview = detections.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const globalOffset = (safePage - 1) * PAGE_SIZE;

    useEffect(() => { setPage(1); }, [detections.length]);

    return (
        <div className="preview-section">
            <div className="preview-header">
                <div className="preview-header-left">
                    <div className="preview-header-icon" style={{ background: 'rgba(46,139,74,0.10)' }}>
                        <Eye style={{ width: 16, height: 16, color: '#2e8b4a' }} />
                    </div>
                    <p className="preview-title">Image Detection - Data Preview</p>
                    <span className="preview-count-pill green">{detections.length} records</span>
                </div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#8aaa96', letterSpacing: '.06em' }}>
                    {detections.length === 0 ? '0 records' : `Showing ${globalOffset + 1}–${Math.min(globalOffset + PAGE_SIZE, detections.length)} of ${detections.length}`}
                </span>
            </div>
            <div className="preview-table-wrap">
                {preview.length === 0 ? (
                    <div className="preview-empty">No detection records match your current filters.</div>
                ) : (
                    <table className="preview-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Province</th>
                                <th>Municipality</th>
                                <th>Barangay</th>
                                <th>Farm Name</th>
                                <th>Severity</th>
                                <th>Insects</th>
                                <th>Confidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {preview.map((d, i) => {
                                const dt = toDate(d.created_date) || new Date();
                                const sev = d.severity ? d.severity.charAt(0).toUpperCase() + d.severity.slice(1) : 'N/A';
                                const sc = severityColor(d.severity);
                                const conf = d.avg_confidence ? (d.avg_confidence * 100).toFixed(1) + '%' : 'N/A';
                                const rowNum = globalOffset + i + 1;
                                return (
                                    <tr key={d.id || i}>
                                        <td className="mono" style={{ color: '#8aaa96' }}>DET-{String(rowNum).padStart(3, '0')}</td>
                                        <td className="mono">{format(dt, 'yyyy-MM-dd')}</td>
                                        <td className="mono">{format(dt, 'HH:mm:ss')}</td>
                                        <td>{ns(d.province)}</td>
                                        <td>{ns(d.municipality)}</td>
                                        <td>{ns(d.barangay)}</td>
                                        <td>{ns(d.farmName)}</td>
                                        <td><span className="preview-badge" style={{ background: sc.bg, color: sc.color }}>{sev}</span></td>
                                        <td className="mono">{d.total_detections || 0}</td>
                                        <td className="mono">{conf}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
        </div>
    );
}

function AssessmentPreviewTable({ assessments }) {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(assessments.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const preview = assessments.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const globalOffset = (safePage - 1) * PAGE_SIZE;

    useEffect(() => { setPage(1); }, [assessments.length]);

    return (
        <div className="preview-section">
            <div className="preview-header">
                <div className="preview-header-left">
                    <div className="preview-header-icon" style={{ background: 'rgba(59,130,246,0.10)' }}>
                        <Eye style={{ width: 16, height: 16, color: '#3b82f6' }} />
                    </div>
                    <p className="preview-title">Fuzzy Logic Assessment - Data Preview</p>
                    <span className="preview-count-pill blue">{assessments.length} records</span>
                </div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#8aaa96', letterSpacing: '.06em' }}>
                    {assessments.length === 0 ? '0 records' : `Showing ${globalOffset + 1}–${Math.min(globalOffset + PAGE_SIZE, assessments.length)} of ${assessments.length}`}
                </span>
            </div>
            <div className="preview-table-wrap">
                {preview.length === 0 ? (
                    <div className="preview-empty">No fuzzy logic assessments match your current filters.</div>
                ) : (
                    <table className="preview-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Province</th>
                                <th>Municipality</th>
                                <th>Barangay</th>
                                <th>Temp (°C)</th>
                                <th>Humidity (%)</th>
                                <th>Risk Score</th>
                                <th>Risk Level</th>
                                <th>Infestation (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {preview.map((a, i) => {
                                const dt = toDate(a.created_date) || new Date();
                                const rc = riskColor(a.adjusted_risk_label);
                                const rowNum = globalOffset + i + 1;
                                return (
                                    <tr key={a.id || i}>
                                        <td className="mono" style={{ color: '#8aaa96' }}>FZY-{String(rowNum).padStart(3, '0')}</td>
                                        <td className="mono">{format(dt, 'yyyy-MM-dd')}</td>
                                        <td className="mono">{format(dt, 'HH:mm:ss')}</td>
                                        <td>{ns(a.province)}</td>
                                        <td>{ns(a.municipality)}</td>
                                        <td>{ns(a.barangay)}</td>
                                        <td className="mono">{a.temperature_c ?? 'N/A'}</td>
                                        <td className="mono">{a.humidity_pct ?? 'N/A'}</td>
                                        <td className="mono">{a.adjusted_risk_score?.toFixed(2) ?? 'N/A'}</td>
                                        <td><span className="preview-badge" style={{ background: rc.bg, color: rc.color }}>{a.adjusted_risk_label || 'N/A'}</span></td>
                                        <td className="mono">{a.degree_of_infestation_pct?.toFixed(1) ?? 'N/A'}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
        </div>
    );
}

// ── HOW TO USE ────────────────────────────────────────────────────────────────

function HowToUse() {
    const steps = [
        {
            num: 1,
            title: 'Set filters',
            desc: 'Choose a date range, province, severity level, or risk level to narrow down which records appear in the export.',
        },
        {
            num: 2,
            title: 'Preview the data',
            desc: 'The tables below show a live preview of all matching records before you download anything.',
        },
        {
            num: 3,
            title: 'Choose export type',
            desc: 'Pick Image Detection, Fuzzy Logic Assessment, or Combined. Each downloads a formatted Excel file with styled headers.',
        },
        {
            num: 4,
            title: 'Download',
            desc: 'Click the Download button. Exports include colored headers, auto-sized columns, and alternating row colors for easy reading.',
        },
    ];

    return (
        <div className="exp-htu-wrap">
            <div className="exp-htu-header">
                <span className="exp-htu-badge">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4.5" stroke="#2e8b4a"/><path d="M5 4.5v3M5 3h.01" stroke="#2e8b4a" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    How to Use
                </span>
            </div>
            <div className="exp-htu-title">Getting Started with Data Export</div>
            <div className="exp-htu-subtitle">Follow these steps to filter, preview, and download detection records.</div>
            <div className="exp-htu-steps">
                {steps.map(s => (
                    <div key={s.num} className="exp-htu-step">
                        <div className="exp-htu-num">{s.num}</div>
                        <div className="exp-htu-step-title">{s.title}</div>
                        <div className="exp-htu-step-desc">{s.desc}</div>
                    </div>
                ))}
            </div>
            <div className="exp-htu-tip">
                <span className="exp-htu-tip-icon">💡</span>
                <span className="exp-htu-tip-text">
                    <strong>Pro tip:</strong> Use the Combined export for complete data. It packages both Image Detection and Fuzzy Logic data into a single two-sheet Excel file.
                </span>
            </div>
        </div>
    );
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function DataExport() {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [provinceFilter, setProvinceFilter] = useState('all');
    const [riskFilter, setRiskFilter] = useState('all');
    const [exportMessage, setExportMessage] = useState(null);
    const [allDetections, setAllDetections] = useState([]);
    const [allAssessments, setAllAssessments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [detSnap, assSnap] = await Promise.all([
                    getDocs(query(collection(db, 'detections'), orderBy('created_date', 'desc'), limit(1000))),
                    getDocs(query(collection(db, 'fuzzyAssessments'), orderBy('created_date', 'desc'), limit(1000))),
                ]);
                setAllDetections(detSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                setAllAssessments(assSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) {
                console.error('Failed to fetch data:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const applyDateFilter = (items) => {
        let f = items;
        if (dateFrom) {
            const from = new Date(dateFrom);
            f = f.filter(d => { const dt = toDate(d.created_date); return dt && dt >= from; });
        }
        if (dateTo) {
            const end = new Date(dateTo);
            end.setHours(23, 59, 59, 999);
            f = f.filter(d => { const dt = toDate(d.created_date); return dt && dt <= end; });
        }
        return f;
    };

    const filteredDetections = useMemo(() => {
        let f = applyDateFilter(allDetections);
        if (severityFilter !== 'all') f = f.filter(d => d.severity === severityFilter);
        if (provinceFilter !== 'all') f = f.filter(d => d.province?.toLowerCase().includes(provinceFilter.toLowerCase()));
        return f;
    }, [allDetections, dateFrom, dateTo, severityFilter, provinceFilter]);

    const filteredAssessments = useMemo(() => {
        let f = applyDateFilter(allAssessments);
        if (riskFilter !== 'all') f = f.filter(a => a.adjusted_risk_label === riskFilter);
        if (provinceFilter !== 'all') f = f.filter(a => a.province?.toLowerCase().includes(provinceFilter.toLowerCase()));
        return f;
    }, [allAssessments, dateFrom, dateTo, riskFilter, provinceFilter]);

    const handleDetectionExcel = () => {
        if (!filteredDetections.length) { setExportMessage({ type: 'error', text: 'No image detections match current filters.' }); return; }
        downloadXLSX([{ name: 'Detections', headers: DETECTION_HEADERS, rows: buildDetectionRows(filteredDetections), color: '2e8b4a' }], `cocolisap-image-detections-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        setExportMessage({ type: 'success', text: `Exported ${filteredDetections.length} image detections to Excel.` });
    };

    const handleFuzzyExcel = () => {
        if (!filteredAssessments.length) { setExportMessage({ type: 'error', text: 'No fuzzy logic assessments match current filters.' }); return; }
        downloadXLSX([{ name: 'Assessments', headers: ASSESSMENT_HEADERS, rows: buildAssessmentRows(filteredAssessments), color: '3b82f6' }], `cocolisap-fuzzy-assessments-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        setExportMessage({ type: 'success', text: `Exported ${filteredAssessments.length} fuzzy assessments to Excel.` });
    };

    const handleCombinedExcel = () => {
        if (!filteredDetections.length && !filteredAssessments.length) { setExportMessage({ type: 'error', text: 'No data available for combined report.' }); return; }
        downloadXLSX([
            { name: 'Image Detections', headers: DETECTION_HEADERS, rows: buildDetectionRows(filteredDetections), color: '2e8b4a' },
            { name: 'Fuzzy Assessments', headers: ASSESSMENT_HEADERS, rows: buildAssessmentRows(filteredAssessments), color: '3b82f6' },
        ], `cocolisap-combined-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        setExportMessage({ type: 'success', text: `Combined report exported — ${filteredDetections.length} detections + ${filteredAssessments.length} assessments.` });
    };

    return (
        <div className="export-root">
            <style>{exportStyles}</style>
            <div className="export-page">
                <div className="export-badge">Data Export</div>
                <h1 className="export-h1">Export <em>Detection</em> Data</h1>
                <p className="export-sub">Download detection records and fuzzy logic assessments for reporting and analysis</p>
                <div className="export-divider" />

                <HowToUse />

                {/* Filters */}
                <div className="export-card">
                    <span className="export-sec-label">Filter Criteria</span>
                    <div className="export-grid2">
                        <div><span className="export-field-label">Date From</span><input type="date" className="export-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
                        <div><span className="export-field-label">Date To</span><input type="date" className="export-input" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
                        <div>
                            <span className="export-field-label">Province</span>
                            <select className="export-select" value={provinceFilter} onChange={e => setProvinceFilter(e.target.value)}>
                                <option value="all">All Provinces</option>
                                {PHILIPPINE_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="export-filters-inner">
                            <div>
                                <span className="export-field-label">Severity (Detection)</span>
                                <select className="export-select" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
                                    <option value="all">All</option>
                                    <option value="severe">Severe</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                            <div>
                                <span className="export-field-label">Risk (Fuzzy)</span>
                                <select className="export-select" value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
                                    <option value="all">All</option>
                                    <option value="HIGH">HIGH</option>
                                    <option value="MODERATE">MODERATE</option>
                                    <option value="LOW">LOW</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Record counts */}
                <div className="export-count-row">
                    <div className="export-count-box">
                        <div className="export-count-label">Image Detections</div>
                        <span className="export-count-text"><strong>{isLoading ? '...' : filteredDetections.length}</strong> record{filteredDetections.length !== 1 ? 's' : ''} matched</span>
                    </div>
                    <div className="export-count-box">
                        <div className="export-count-label">Fuzzy Assessments</div>
                        <span className="export-count-text"><strong>{isLoading ? '...' : filteredAssessments.length}</strong> record{filteredAssessments.length !== 1 ? 's' : ''} matched</span>
                    </div>
                </div>

                {exportMessage && (
                    <div className={`export-toast ${exportMessage.type}`}>
                        <CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                        {exportMessage.text}
                    </div>
                )}

                {/* Preview Tables */}
                {isLoading ? (
                    <div style={{ textAlign:'center', padding:'40px', fontFamily:"'DM Mono',monospace", fontSize:12, color:'#8aaa96' }}>
                        Loading records...
                    </div>
                ) : (
                    <>
                        <DetectionPreviewTable detections={filteredDetections} />
                        <AssessmentPreviewTable assessments={filteredAssessments} />
                    </>
                )}

                {/* Export options */}
                <div className="export-options-grid">
                    <div className="export-option-card green">
                        <div className="export-option-icon green"><FileSpreadsheet style={{ width: 22, height: 22, color: '#2e8b4a' }} /></div>
                        <h3 className="export-option-title">Image Detection</h3>
                        <p className="export-option-sub">YOLOv8 · Instance Segmentation</p>
                        <p className="export-option-desc">Export all image scan records with location, severity, confidence scores, and insect counts. Green header, alternating rows.</p>
                        <div className="export-btn-row">
                            <button className="export-dl-btn green" onClick={handleDetectionExcel} disabled={!filteredDetections.length}>
                                <FileSpreadsheet style={{ width: 15, height: 15 }} />Download Excel
                            </button>
                        </div>
                    </div>
                    <div className="export-option-card blue">
                        <div className="export-option-icon blue"><FileSpreadsheet style={{ width: 22, height: 22, color: '#3b82f6' }} /></div>
                        <h3 className="export-option-title">Fuzzy Logic Assessment</h3>
                        <p className="export-option-sub">Mamdani · 81-Rule Inference</p>
                        <p className="export-option-desc">Export fuzzy logic risk assessments with environmental parameters, farm impact, and PCA intervention notes. Blue header.</p>
                        <div className="export-btn-row">
                            <button className="export-dl-btn green" onClick={handleFuzzyExcel} disabled={!filteredAssessments.length}>
                                <FileSpreadsheet style={{ width: 15, height: 15 }} />Download Excel
                            </button>
                        </div>
                    </div>
                    <div className="export-option-card purple">
                        <div className="export-option-icon purple"><Layers style={{ width: 22, height: 22, color: '#8b5cf6' }} /></div>
                        <h3 className="export-option-title">Combined Report</h3>
                        <p className="export-option-sub">Integrated · Detection + Fuzzy</p>
                        <p className="export-option-desc">Single Excel file with two sheets ( Sheet 1: Image Detections, Sheet 2: Fuzzy Assessments ). Ready for PCA submission.</p>
                        <div className="export-btn-row">
                            <button className="export-dl-btn purple" onClick={handleCombinedExcel} disabled={!filteredDetections.length && !filteredAssessments.length}>
                                <FileSpreadsheet style={{ width: 15, height: 15 }} />Download Combined Excel
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tips */}
                <div className="export-tips">
                    <div className="export-tips-icon"><Info style={{ width: 18, height: 18, color: '#3b82f6' }} /></div>
                    <div>
                        <p className="export-tips-title">Excel Format Notes</p>
                        <ul className="export-tips-list">
                            <li>· All exports use colored headers : green for detections, blue for assessments</li>
                            <li>· Alternating row colors and auto-sized columns for easy reading</li>
                            <li>· Header row is frozen : stays visible when scrolling down</li>
                            <li>· Combined report contains two sheets in one file for PCA submission</li>
                            <li>· Use date and province filters to generate targeted regional reports</li>
                        </ul>
                    </div>
                </div>

                <div className="export-footer">
                    <span>CocolisapScan · Data Export</span>
                </div>
            </div>
        </div>
    );
}