import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Download, TrendingUp, TrendingDown, Minus, MapPin, AlertTriangle, Search, ChevronUp, ChevronDown, BarChart2, FileText, FileSpreadsheet, CheckCircle, Info, Layers } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

import ReportFilters from '@/components/report/ReportFilters';
import ProvinceBarChart from '@/components/report/ProvinceBarChart';
import ProvinceDrillDown from '@/components/report/ProvinceDrillDown';

const pageStyles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap');
    .rr-root { background:#f4f7f4; min-height:100vh; color:#1a3326; font-family:'Outfit',sans-serif; }
    .rr-page { max-width:1200px; margin:0 auto; padding:32px 24px 80px; }
    .rr-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(46,139,74,0.10); border:1px solid rgba(46,139,74,0.25); border-radius:100px; padding:4px 12px; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.1em; color:#2e8b4a; text-transform:uppercase; margin-bottom:12px; }
    .rr-h1 { font-family:'DM Serif Display',serif; font-size:clamp(26px,4vw,38px); font-weight:400; color:#1a3326; margin:0 0 6px; letter-spacing:-.02em; }
    .rr-h1 em { font-style:italic; color:#2e8b4a; }
    .rr-sub { font-size:13px; color:#5a8068; font-family:'DM Mono',monospace; }
    .rr-divider { height:1px; background:linear-gradient(90deg,rgba(46,139,74,0.25),transparent 80%); margin:20px 0 28px; }
    .rr-stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
    @media(max-width:700px){ .rr-stat-grid{grid-template-columns:1fr 1fr;} }
    .rr-stat { background:#fff; border:1px solid #d6e8d6; border-radius:16px; padding:20px; box-shadow:0 1px 6px rgba(0,0,0,0.05); position:relative; overflow:hidden; }
    .rr-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
    .rr-stat.blue::before { background:linear-gradient(90deg,#3b82f6,transparent); }
    .rr-stat.red::before { background:linear-gradient(90deg,#dc2626,transparent); }
    .rr-stat.amber::before { background:linear-gradient(90deg,#d97706,transparent); }
    .rr-stat.green::before { background:linear-gradient(90deg,#2e8b4a,transparent); }
    .rr-stat-label { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:#8aaa96; margin-bottom:6px; }
    .rr-stat-value { font-family:'DM Serif Display',serif; font-size:30px; font-weight:400; line-height:1; }
    .rr-stat-value.blue{color:#3b82f6} .rr-stat-value.red{color:#dc2626} .rr-stat-value.amber{color:#d97706} .rr-stat-value.green{color:#2e8b4a}
    .rr-card { background:#fff; border:1px solid #d6e8d6; border-radius:16px; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,0.05); position:relative; margin-bottom:20px; }
    .rr-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,#2e8b4a,transparent); z-index:1; }
    .rr-card-header { padding:18px 22px; border-bottom:1px solid #eaf2ea; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; }
    .rr-card-title { font-size:14px; font-weight:600; color:#1a3326; display:flex; align-items:center; gap:8px; }
    .rr-table { width:100%; border-collapse:collapse; }
    .rr-table th { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:#8aaa96; padding:12px 16px; text-align:left; border-bottom:1px solid #eaf2ea; background:#f8fbf8; white-space:nowrap; }
    .rr-table th.sortable { cursor:pointer; user-select:none; }
    .rr-table th.sortable:hover { color:#2e8b4a; }
    .rr-table td { padding:12px 16px; border-bottom:1px solid #f0f6f0; font-size:13px; color:#1a3326; vertical-align:middle; }
    .rr-table tr:last-child td { border:0; }
    .rr-table tr.clickable:hover td { background:rgba(46,139,74,0.05); cursor:pointer; }
    .rr-pill { display:inline-flex; align-items:center; gap:4px; border-radius:100px; padding:3px 10px; font-size:11px; font-weight:600; letter-spacing:.05em; }
    .rr-pill.severe { background:rgba(220,38,38,.10); color:#dc2626; border:1px solid rgba(220,38,38,.25); }
    .rr-pill.moderate { background:rgba(217,119,6,.10); color:#d97706; border:1px solid rgba(217,119,6,.25); }
    .rr-pill.low { background:rgba(46,139,74,.10); color:#2e8b4a; border:1px solid rgba(46,139,74,.25); }
    .rr-trend-up { display:inline-flex; align-items:center; gap:4px; color:#dc2626; font-size:12px; font-family:'DM Mono',monospace; }
    .rr-trend-down { display:inline-flex; align-items:center; gap:4px; color:#2e8b4a; font-size:12px; font-family:'DM Mono',monospace; }
    .rr-trend-same { display:inline-flex; align-items:center; gap:4px; color:#8aaa96; font-size:12px; font-family:'DM Mono',monospace; }
    .rr-dl-btn { display:flex; align-items:center; gap:8px; padding:10px 20px; border-radius:10px; background:#2e8b4a; color:#fff; font-family:'Outfit',sans-serif; font-size:13px; font-weight:500; cursor:pointer; border:none; transition:background .2s; white-space:nowrap; }
    .rr-dl-btn:hover { background:#236b38; }
    .rr-loading { display:flex; align-items:center; justify-content:center; height:300px; }
    .rr-spinner { width:32px; height:32px; border:3px solid #d6e8d6; border-top-color:#2e8b4a; border-radius:50%; animation:rr-spin .8s linear infinite; }
    @keyframes rr-spin { to{transform:rotate(360deg)} }
    .rr-search-wrap { position:relative; }
    .rr-search-input { width:220px; background:#f8fbf8; border:1px solid #c8dfc8; border-radius:10px; color:#1a3326; font-family:'Outfit',sans-serif; font-size:12px; padding:8px 12px 8px 34px; outline:none; transition:border-color .2s; }
    .rr-search-input:focus { border-color:#2e8b4a; }
    .rr-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#8aaa96; width:14px; height:14px; }
    .rr-chart-toggle { display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:9px; border:1px solid #c8dfc8; background:transparent; color:#5a8068; font-family:'Outfit',sans-serif; font-size:12px; font-weight:500; cursor:pointer; transition:background .2s; white-space:nowrap; }
    .rr-chart-toggle.active { background:#2e8b4a; color:#fff; border-color:#2e8b4a; }
    .rr-chart-toggle:hover:not(.active) { background:rgba(46,139,74,0.08); color:#1a3326; }
    .rr-tabs { display:flex; gap:4px; background:#f0f6f0; border-radius:12px; padding:4px; margin-bottom:28px; }
    .rr-tab { flex:1; padding:10px 16px; border-radius:9px; border:none; background:transparent; font-family:'Outfit',sans-serif; font-size:13px; font-weight:500; color:#5a8068; cursor:pointer; transition:background .2s,color .2s; }
    .rr-tab.active { background:#fff; color:#1a3326; box-shadow:0 1px 4px rgba(0,0,0,0.08); }
    .rr-tab:hover:not(.active) { color:#1a3326; }
    .ex-card { background:#ffffff; border:1px solid #d6e8d6; border-radius:20px; padding:28px 32px; position:relative; overflow:hidden; margin-bottom:20px; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
    .ex-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,#2e8b4a,transparent); }
    .ex-sec-label { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#8aaa96; margin-bottom:20px; display:block; }
    .ex-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    @media(max-width:600px){ .ex-grid2{grid-template-columns:1fr;} }
    .ex-field-label { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#8aaa96; margin-bottom:8px; display:block; }
    .ex-input { width:100%; background:#f8fbf8; border:1px solid #c8dfc8; border-radius:12px; color:#1a3326; font-family:'DM Mono',monospace; font-size:14px; padding:12px 16px; outline:none; transition:border-color .2s,box-shadow .2s; box-sizing:border-box; }
    .ex-input:focus { border-color:#2e8b4a; box-shadow:0 0 0 3px rgba(46,139,74,0.08); }
    .ex-select { width:100%; background:#f8fbf8; border:1px solid #c8dfc8; border-radius:12px; color:#1a3326; font-family:'Outfit',sans-serif; font-size:14px; padding:12px 16px; outline:none; cursor:pointer; transition:border-color .2s; box-sizing:border-box; }
    .ex-select:focus { border-color:#2e8b4a; }
    .ex-count-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
    .ex-count-box { background:rgba(46,139,74,0.06); border:1px solid rgba(46,139,74,0.18); border-radius:14px; padding:14px 18px; }
    .ex-count-text { font-family:'DM Mono',monospace; font-size:12px; color:#5a8068; }
    .ex-count-text strong { color:#2e8b4a; font-size:15px; }
    .ex-count-label { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#8aaa96; margin-bottom:4px; }
    .ex-toast { padding:14px 18px; border-radius:12px; font-family:'DM Mono',monospace; font-size:12px; margin-bottom:20px; display:flex; align-items:center; gap:10px; }
    .ex-toast.success { background:rgba(46,139,74,0.08); border:1px solid rgba(46,139,74,0.22); color:#2e8b4a; }
    .ex-toast.error { background:rgba(220,38,38,0.07); border:1px solid rgba(220,38,38,0.22); color:#dc2626; }
    .ex-options-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
    @media(max-width:800px){ .ex-options-grid{grid-template-columns:1fr;} }
    .ex-option-card { background:#ffffff; border:1px solid #d6e8d6; border-radius:18px; padding:24px; position:relative; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,0.05); display:flex; flex-direction:column; }
    .ex-option-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
    .ex-option-card.green::before { background:linear-gradient(90deg,#2e8b4a,transparent); }
    .ex-option-card.blue::before { background:linear-gradient(90deg,#3b82f6,transparent); }
    .ex-option-card.purple::before { background:linear-gradient(90deg,#8b5cf6,transparent); }
    .ex-option-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
    .ex-option-icon.green { background:rgba(46,139,74,0.10); }
    .ex-option-icon.blue { background:rgba(59,130,246,0.10); }
    .ex-option-icon.purple { background:rgba(139,92,246,0.10); }
    .ex-option-title { font-size:14px; font-weight:600; color:#1a3326; margin:0 0 4px; }
    .ex-option-sub { font-size:11px; font-family:'DM Mono',monospace; color:#8aaa96; letter-spacing:.06em; text-transform:uppercase; margin-bottom:10px; }
    .ex-option-desc { font-size:12px; color:#5a8068; line-height:1.6; margin:0 0 16px; flex:1; }
    .ex-btn-row { display:flex; flex-direction:column; gap:8px; margin-top:auto; }
    .ex-dl-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; padding:11px; border:none; border-radius:12px; font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:background .2s,transform .15s,box-shadow .2s; letter-spacing:.02em; }
    .ex-dl-btn:disabled { opacity:.4; cursor:not-allowed; transform:none !important; }
    .ex-dl-btn.green { background:#2e8b4a; color:#fff; }
    .ex-dl-btn.green:hover:not(:disabled) { background:#25763e; transform:translateY(-1px); box-shadow:0 6px 20px rgba(46,139,74,.25); }
    .ex-dl-btn.blue { background:#eff6ff; color:#3b82f6; border:1px solid rgba(59,130,246,.25); }
    .ex-dl-btn.blue:hover:not(:disabled) { background:#dbeafe; transform:translateY(-1px); }
    .ex-dl-btn.purple { background:#f5f3ff; color:#8b5cf6; border:1px solid rgba(139,92,246,.25); }
    .ex-dl-btn.purple:hover:not(:disabled) { background:#ede9fe; transform:translateY(-1px); }
    .ex-tips { background:#eff8ff; border:1px solid #bfdbfe; border-radius:16px; padding:20px 24px; display:flex; gap:14px; margin-top:24px; }
    .ex-tips-title { font-size:13px; font-weight:600; color:#3b82f6; margin:0 0 10px; }
    .ex-tips-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:5px; }
    .ex-tips-list li { font-size:12px; color:#6090c0; font-family:'DM Mono',monospace; }
`;

const PHILIPPINE_PROVINCES = ["Abra","Agusan del Norte","Agusan del Sur","Aklan","Albay","Antique","Apayao","Aurora","Basilan","Bataan","Batanes","Batangas","Benguet","Biliran","Bohol","Bukidnon","Bulacan","Cagayan","Camarines Norte","Camarines Sur","Camiguin","Capiz","Catanduanes","Cavite","Cebu","Cotabato","Davao de Oro","Davao del Norte","Davao del Sur","Davao Occidental","Davao Oriental","Dinagat Islands","Eastern Samar","Guimaras","Ifugao","Ilocos Norte","Ilocos Sur","Iloilo","Isabela","Kalinga","La Union","Laguna","Lanao del Norte","Lanao del Sur","Leyte","Maguindanao","Marinduque","Masbate","Metro Manila","Misamis Occidental","Misamis Oriental","Mountain Province","Negros Occidental","Negros Oriental","Northern Samar","Nueva Ecija","Nueva Vizcaya","Occidental Mindoro","Oriental Mindoro","Palawan","Pampanga","Pangasinan","Quezon","Quirino","Rizal","Romblon","Samar","Sarangani","Siquijor","Sorsogon","South Cotabato","Southern Leyte","Sultan Kudarat","Sulu","Surigao del Norte","Surigao del Sur","Tarlac","Tawi-Tawi","Zambales","Zamboanga del Norte","Zamboanga del Sur","Zamboanga Sibugay"];

const ns = (v) => (v !== undefined && v !== null && v !== '') ? v : 'Not Specified';
const pct = (n, total) => total > 0 ? ((n / total) * 100).toFixed(1) : '0.0';
const avg = (arr, key) => arr.length > 0 ? (arr.reduce((s, d) => s + (d[key] || 0), 0) / arr.length) : 0;

function downloadText(text, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = filename; a.click();
}
function downloadCSV(rows, filename) {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = filename; a.click();
}

function applyDateFilter(detections, filters) {
    const { date, customStart, customEnd } = filters;
    if (date === 'all') return detections;
    const now = new Date();
    if (date === 'custom' && customStart && customEnd) {
        const start = new Date(customStart);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        return detections.filter(d => { const dt = new Date(d.created_date); return dt >= start && dt <= end; });
    }
    return detections.filter(d => {
        const diff = Math.floor((now - new Date(d.created_date)) / 86400000);
        if (date === 'today') return diff === 0;
        if (date === 'week') return diff <= 7;
        if (date === 'month') return diff <= 30;
        if (date === 'quarter') return diff <= 90;
        if (date === 'year') return diff <= 365;
        return true;
    });
}

function aggregateByProvince(detections) {
    const map = {};
    detections.forEach(d => {
        const prov = d.province || 'Unknown';
        if (!map[prov]) map[prov] = { total: 0, severe: 0, moderate: 0, low: 0 };
        map[prov].total++;
        if (d.severity === 'severe') map[prov].severe++;
        else if (d.severity === 'moderate') map[prov].moderate++;
        else map[prov].low++;
    });
    return map;
}

function getDominantSeverity(row) {
    if (row.severe / row.total >= 0.5) return 'severe';
    if (row.moderate / row.total >= 0.4) return 'moderate';
    return 'low';
}

export default function RegionalReport() {
    const [allDetections, setAllDetections] = useState([]);
    const [allAssessments, setAllAssessments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('report');
    const [filters, setFilters] = useState({ date: 'all', severity: 'all', province: 'all', customStart: '', customEnd: '' });
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState('total');
    const [sortDir, setSortDir] = useState('desc');
    const [showChart, setShowChart] = useState(true);
    const [drillDown, setDrillDown] = useState(null);

    const [exDateFrom, setExDateFrom] = useState('');
    const [exDateTo, setExDateTo] = useState('');
    const [exSeverity, setExSeverity] = useState('all');
    const [exProvince, setExProvince] = useState('all');
    const [exRisk, setExRisk] = useState('all');
    const [exportMessage, setExportMessage] = useState(null);

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
                console.error('Error fetching data:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const applyExDateFilter = (items) => {
        let f = items;
        if (exDateFrom) f = f.filter(d => new Date(d.created_date) >= new Date(exDateFrom));
        if (exDateTo) { const end = new Date(exDateTo); end.setHours(23,59,59,999); f = f.filter(d => new Date(d.created_date) <= end); }
        return f;
    };

    const exDetections = useMemo(() => {
        let f = applyExDateFilter(allDetections);
        if (exSeverity !== 'all') f = f.filter(d => d.severity === exSeverity);
        if (exProvince !== 'all') f = f.filter(d => d.province === exProvince);
        return f;
    }, [allDetections, exDateFrom, exDateTo, exSeverity, exProvince]);

    const exAssessments = useMemo(() => {
        let f = applyExDateFilter(allAssessments);
        if (exRisk !== 'all') f = f.filter(a => a.adjusted_risk_label === exRisk);
        if (exProvince !== 'all') f = f.filter(a => a.province === exProvince);
        return f;
    }, [allAssessments, exDateFrom, exDateTo, exRisk, exProvince]);

    const filtered = useMemo(() => {
        let d = applyDateFilter(allDetections, filters);
        if (filters.severity !== 'all') d = d.filter(x => x.severity === filters.severity);
        if (filters.province !== 'all') d = d.filter(x => x.province === filters.province);
        return d;
    }, [allDetections, filters]);

    const thisMonth = useMemo(() => allDetections.filter(d => new Date(d.created_date) >= startOfThisMonth), [allDetections]);
    const lastMonth = useMemo(() => allDetections.filter(d => {
        const dt = new Date(d.created_date);
        return dt >= startOfLastMonth && dt < startOfThisMonth;
    }), [allDetections]);

    const thisMonthByProv = useMemo(() => aggregateByProvince(thisMonth), [thisMonth]);
    const lastMonthByProv = useMemo(() => aggregateByProvince(lastMonth), [lastMonth]);
    const allByProv = useMemo(() => aggregateByProvince(filtered), [filtered]);

    const allTableRows = useMemo(() => {
        return Object.entries(allByProv).map(([province, data]) => {
            const prevCount = lastMonthByProv[province]?.total || 0;
            const currCount = thisMonthByProv[province]?.total || 0;
            const severePct = data.total > 0 ? parseFloat(((data.severe / data.total) * 100).toFixed(1)) : 0;
            let trend = 'same', trendVal = 0;
            if (prevCount > 0) {
                trendVal = Math.round(((currCount - prevCount) / prevCount) * 100);
                if (trendVal > 5) trend = 'up';
                else if (trendVal < -5) trend = 'down';
            } else if (currCount > 0) {
                trend = 'new'; trendVal = 100;
            }
            return { province, ...data, severePct, trend, trendVal, currCount, prevCount, dominant: getDominantSeverity(data) };
        });
    }, [allByProv, thisMonthByProv, lastMonthByProv]);

    const tableRows = useMemo(() => {
        let rows = allTableRows;
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            rows = rows.filter(r => r.province.toLowerCase().includes(q));
        }
        rows = [...rows].sort((a, b) => {
            const av = a[sortKey], bv = b[sortKey];
            if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
            return sortDir === 'asc' ? av - bv : bv - av;
        });
        return rows;
    }, [allTableRows, search, sortKey, sortDir]);

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const SortIcon = ({ k }) => {
        if (sortKey !== k) return <ChevronDown style={{ width: 10, height: 10, opacity: 0.3 }} />;
        return sortDir === 'asc' ? <ChevronUp style={{ width: 10, height: 10, color: '#2e8b4a' }} /> : <ChevronDown style={{ width: 10, height: 10, color: '#2e8b4a' }} />;
    };

    const totalDetections = filtered.length;
    const totalProvinces = Object.keys(allByProv).length;
    const totalSevere = filtered.filter(d => d.severity === 'severe').length;
    const severePct = totalDetections > 0 ? ((totalSevere / totalDetections) * 100).toFixed(1) : '0.0';
    const filteredThisMonth = thisMonth.filter(d => (filters.severity === 'all' || d.severity === filters.severity) && (filters.province === 'all' || d.province === filters.province));
    const filteredLastMonth = lastMonth.filter(d => (filters.severity === 'all' || d.severity === filters.severity) && (filters.province === 'all' || d.province === filters.province));
    const monthChange = filteredLastMonth.length > 0 ? Math.round(((filteredThisMonth.length - filteredLastMonth.length) / filteredLastMonth.length) * 100) : null;

    const handleDetectionCSV = () => {
        if (!exDetections.length) { setExportMessage({ type:'error', text:'No image detections match filters.' }); return; }
        const headers = ['Detection ID','Date','Time','Province','Municipality','Barangay','Latitude','Longitude','Severity','Total Insects','Avg Confidence','Processing Time (s)','Location Method','Notes'];
        const rows = [headers, ...exDetections.map((d, i) => {
            const dt = new Date(d.created_date);
            return [`DET-${String(i+1).padStart(3,'0')}`, format(dt,'yyyy-MM-dd'), format(dt,'HH:mm:ss'), ns(d.province), ns(d.municipality), ns(d.barangay), ns(d.latitude), ns(d.longitude), d.severity ? d.severity.charAt(0).toUpperCase()+d.severity.slice(1) : 'N/A', d.total_detections || 0, d.avg_confidence ? (d.avg_confidence*100).toFixed(1) : 'N/A', d.processing_time ? (d.processing_time/1000).toFixed(2)+'s' : 'N/A', ns(d.locationMethod), ns(d.notes)];
        })];
        downloadCSV(rows, `cocolisap-detections-${format(new Date(),'yyyy-MM-dd')}.csv`);
        setExportMessage({ type:'success', text:`Exported ${exDetections.length} detections to CSV.` });
    };

    const handleDetectionSummary = () => {
        if (!exDetections.length) { setExportMessage({ type:'error', text:'No detections match filters.' }); return; }
        const d = exDetections, total = d.length;
        const severe = d.filter(x=>x.severity==='severe').length, moderate = d.filter(x=>x.severity==='moderate').length, low = d.filter(x=>x.severity==='low').length;
        const pc = {}; d.forEach(x => { if(x.province) pc[x.province] = (pc[x.province]||0)+1; });
        const topP = Object.entries(pc).sort((a,b)=>b[1]-a[1]).slice(0,3);
        const SEP='================================================', SEC='------------------------------------------------';
        const txt = [SEP,'  COCOLISAP IMAGE DETECTION REPORT',`  Generated: ${format(new Date(),'MMMM d, yyyy h:mm a')}`,SEP,'',SEC,'📊 DETECTION STATISTICS',SEC,`Total Scans : ${total}`,`Severe      : ${severe} (${pct(severe,total)}%)`,`Moderate    : ${moderate} (${pct(moderate,total)}%)`,`Low         : ${low} (${pct(low,total)}%)`,`Avg Insects : ${avg(d,'total_detections').toFixed(1)}`,`Avg Conf    : ${(avg(d,'avg_confidence')*100).toFixed(1)}%`,'',SEC,'📍 TOP AFFECTED PROVINCES',SEC,...(topP.length?topP.map(([p,c],i)=>`${i+1}. ${p} - ${c} (${pct(c,total)}%)`):['N/A']),'',SEP].join('\n');
        downloadText(txt, `cocolisap-detection-summary-${format(new Date(),'yyyy-MM-dd')}.txt`);
        setExportMessage({ type:'success', text:'Detection summary generated.' });
    };

    const handleFuzzyCSV = () => {
        if (!exAssessments.length) { setExportMessage({ type:'error', text:'No assessments match filters.' }); return; }
        const headers = ['Assessment ID','Date','Time','Province','Municipality','Barangay','Lat','Lon','Temp (°C)','Humidity (%)','Wind (km/h)','Density (trees/ha)','Total Trees','Days w/o Intervention','Fuzzy Base Score','Fuzzy Base Label','Adj Risk Score','Adj Risk Label','Infestation %','Infected Trees','Healthy Trees','Intervention Note'];
        const rows = [headers, ...exAssessments.map((a, i) => {
            const dt = new Date(a.created_date);
            return [`FZY-${String(i+1).padStart(3,'0')}`, format(dt,'yyyy-MM-dd'), format(dt,'HH:mm:ss'), ns(a.province), ns(a.municipality), ns(a.barangay), ns(a.latitude), ns(a.longitude), a.temperature_c, a.humidity_pct, a.wind_speed_kmh, a.planting_density, a.total_trees, a.days_without_intervention, a.fuzzy_base_score?.toFixed(2), a.fuzzy_base_label, a.adjusted_risk_score?.toFixed(2), a.adjusted_risk_label, a.degree_of_infestation_pct?.toFixed(2), a.estimated_infected_trees, a.estimated_healthy_trees, ns(a.intervention_note)];
        })];
        downloadCSV(rows, `cocolisap-fuzzy-${format(new Date(),'yyyy-MM-dd')}.csv`);
        setExportMessage({ type:'success', text:`Exported ${exAssessments.length} assessments to CSV.` });
    };

    const handleFuzzySummary = () => {
        if (!exAssessments.length) { setExportMessage({ type:'error', text:'No assessments match filters.' }); return; }
        const a = exAssessments, total = a.length;
        const high = a.filter(x=>x.adjusted_risk_label==='HIGH').length, mod = a.filter(x=>x.adjusted_risk_label==='MODERATE').length, low = a.filter(x=>x.adjusted_risk_label==='LOW').length;
        const totalInfected = a.reduce((s,x)=>s+(x.estimated_infected_trees||0),0);
        const SEP='================================================', SEC='------------------------------------------------';
        const txt = [SEP,'  COCOLISAP FUZZY LOGIC ASSESSMENT REPORT',`  Generated: ${format(new Date(),'MMMM d, yyyy h:mm a')}`,SEP,'',SEC,'🧠 ASSESSMENT SUMMARY',SEC,`Total Assessments : ${total}`,`HIGH Risk  : ${high} (${pct(high,total)}%)`,`MODERATE   : ${mod} (${pct(mod,total)}%)`,`LOW        : ${low} (${pct(low,total)}%)`,`Avg Fuzzy Score   : ${avg(a,'fuzzy_base_score').toFixed(2)}%`,`Est. Infected Trees: ${totalInfected.toLocaleString()}`,'',SEC,'🌤️ AVG ENVIRONMENTAL',SEC,`Temp : ${avg(a,'temperature_c').toFixed(1)}°C`,`Humidity : ${avg(a,'humidity_pct').toFixed(1)}%`,`Wind : ${avg(a,'wind_speed_kmh').toFixed(1)} km/h`,'',SEP].join('\n');
        downloadText(txt, `cocolisap-fuzzy-summary-${format(new Date(),'yyyy-MM-dd')}.txt`);
        setExportMessage({ type:'success', text:'Fuzzy assessment summary generated.' });
    };

    const handleCombinedSummary = () => {
        if (!exDetections.length && !exAssessments.length) { setExportMessage({ type:'error', text:'No data available.' }); return; }
        const d = exDetections, a = exAssessments;
        const SEP='================================================', SEC='------------------------------------------------';
        const txt = [SEP,'  COCOLISAP INTEGRATED MONITORING REPORT',`  Generated: ${format(new Date(),'MMMM d, yyyy h:mm a')}`,SEP,'',SEC,'📸 IMAGE DETECTION',SEC,`Total: ${d.length} | Severe: ${d.filter(x=>x.severity==='severe').length} | Moderate: ${d.filter(x=>x.severity==='moderate').length} | Low: ${d.filter(x=>x.severity==='low').length}`,'',SEC,'🧠 FUZZY ASSESSMENT',SEC,`Total: ${a.length} | HIGH: ${a.filter(x=>x.adjusted_risk_label==='HIGH').length} | MODERATE: ${a.filter(x=>x.adjusted_risk_label==='MODERATE').length} | LOW: ${a.filter(x=>x.adjusted_risk_label==='LOW').length}`,`Est. Infected Trees: ${a.reduce((s,x)=>s+(x.estimated_infected_trees||0),0).toLocaleString()}`,'',SEP,'  CocolisapScan | Undergraduate Thesis Project',SEP].join('\n');
        downloadText(txt, `cocolisap-integrated-${format(new Date(),'yyyy-MM-dd')}.txt`);
        setExportMessage({ type:'success', text:'Integrated report generated.' });
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(26, 51, 38);
        doc.text('Cocolisap Regional Overview Report', 14, 18);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(90, 128, 104);
        doc.text(`Generated: ${now.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}   |   Total: ${totalDetections}   |   Provinces: ${totalProvinces}   |   Severe: ${severePct}%`, 14, 26);
        doc.setDrawColor(46, 139, 74); doc.setLineWidth(0.5); doc.line(14, 30, 283, 30);
        const headers = ['Province', 'Total', 'Severe', 'Moderate', 'Low', 'Severe%', 'Dominant', 'This Mo.', 'Last Mo.', 'Trend'];
        const colWidths = [52, 18, 18, 22, 14, 18, 24, 20, 20, 22];
        const startX = 14, startY = 36, rowH = 7;
        doc.setFillColor(46, 139, 74);
        doc.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), rowH, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255, 255, 255);
        let cx = startX;
        headers.forEach((h, i) => { doc.text(h, cx + 2, startY + 4.8); cx += colWidths[i]; });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        tableRows.forEach((r, idx) => {
            const y = startY + rowH * (idx + 1);
            if (idx % 2 === 0) { doc.setFillColor(244, 247, 244); doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowH, 'F'); }
            doc.setTextColor(26, 51, 38);
            const trendStr = r.trend === 'up' ? `+${r.trendVal}%` : r.trend === 'down' ? `${r.trendVal}%` : r.trend === 'new' ? 'NEW' : '-';
            const cells = [r.province, r.total, r.severe, r.moderate, r.low, `${r.severePct}%`, r.dominant.toUpperCase(), r.currCount, r.prevCount, trendStr];
            let cx2 = startX;
            cells.forEach((cell, i) => { doc.text(String(cell), cx2 + 2, y + 4.8); cx2 += colWidths[i]; });
        });
        doc.save(`cocolisap-regional-report-${now.toISOString().slice(0, 10)}.pdf`);
    };

    if (isLoading) return (
        <div className="rr-root"><style>{pageStyles}</style>
            <div className="rr-loading"><div className="rr-spinner" /></div>
        </div>
    );

    return (
        <div className="rr-root">
            <style>{pageStyles}</style>
            <div className="rr-page">
                <div style={{ marginBottom: 28 }}>
                    <div className="rr-badge">{activeTab === 'export' ? 'Data Export' : 'Regional Report'}</div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            {activeTab === 'export' ? (
                                <><h1 className="rr-h1">Data <em>Export</em></h1><p className="rr-sub">Download detection and assessment data as CSV or summary reports</p></>
                            ) : (
                                <><h1 className="rr-h1">Regional <em>Overview</em> Report</h1><p className="rr-sub">Province-level aggregation of Cocolisap infestation detections</p></>
                            )}
                        </div>
                        {activeTab === 'report' && (
                            <button className="rr-dl-btn" onClick={handleDownloadPDF}>
                                <Download style={{ width: 15, height: 15 }} />Download PDF
                            </button>
                        )}
                    </div>
                </div>
                <div className="rr-divider" />

                <div className="rr-tabs">
                    <button className={`rr-tab${activeTab==='report'?' active':''}`} onClick={()=>setActiveTab('report')}>📊 Regional Report</button>
                    <button className={`rr-tab${activeTab==='export'?' active':''}`} onClick={()=>setActiveTab('export')}>📥 Data Export</button>
                </div>

                {activeTab === 'export' && (
                    <div>
                        <div className="ex-card">
                            <span className="ex-sec-label">Filter Criteria</span>
                            <div className="ex-grid2">
                                <div><span className="ex-field-label">Date From</span><input type="date" className="ex-input" value={exDateFrom} onChange={e=>setExDateFrom(e.target.value)} /></div>
                                <div><span className="ex-field-label">Date To</span><input type="date" className="ex-input" value={exDateTo} onChange={e=>setExDateTo(e.target.value)} /></div>
                                <div>
                                    <span className="ex-field-label">Province</span>
                                    <select className="ex-select" value={exProvince} onChange={e=>setExProvince(e.target.value)}>
                                        <option value="all">All Provinces</option>
                                        {PHILIPPINE_PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                                    <div>
                                        <span className="ex-field-label">Severity</span>
                                        <select className="ex-select" value={exSeverity} onChange={e=>setExSeverity(e.target.value)}>
                                            <option value="all">All</option><option value="severe">Severe</option><option value="moderate">Moderate</option><option value="low">Low</option>
                                        </select>
                                    </div>
                                    <div>
                                        <span className="ex-field-label">Risk (Fuzzy)</span>
                                        <select className="ex-select" value={exRisk} onChange={e=>setExRisk(e.target.value)}>
                                            <option value="all">All</option><option value="HIGH">HIGH</option><option value="MODERATE">MODERATE</option><option value="LOW">LOW</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="ex-count-row">
                            <div className="ex-count-box"><div className="ex-count-label">Image Detections</div><span className="ex-count-text"><strong>{exDetections.length}</strong> records matched</span></div>
                            <div className="ex-count-box"><div className="ex-count-label">Fuzzy Assessments</div><span className="ex-count-text"><strong>{exAssessments.length}</strong> records matched</span></div>
                        </div>
                        {exportMessage && (
                            <div className={`ex-toast ${exportMessage.type}`}>
                                <CheckCircle style={{width:16,height:16,flexShrink:0}} />{exportMessage.text}
                            </div>
                        )}
                        <div className="ex-options-grid">
                            <div className="ex-option-card green">
                                <div className="ex-option-icon green"><FileSpreadsheet style={{width:22,height:22,color:'#2e8b4a'}} /></div>
                                <h3 className="ex-option-title">Image Detection</h3>
                                <p className="ex-option-sub">YOLOv11 · Instance Segmentation</p>
                                <p className="ex-option-desc">Export all image scan records with location, severity, and confidence scores.</p>
                                <div className="ex-btn-row">
                                    <button className="ex-dl-btn green" onClick={handleDetectionCSV} disabled={!exDetections.length}><FileSpreadsheet style={{width:15,height:15}} />Download CSV</button>
                                    <button className="ex-dl-btn blue" onClick={handleDetectionSummary} disabled={!exDetections.length}><FileText style={{width:15,height:15}} />Download Summary TXT</button>
                                </div>
                            </div>
                            <div className="ex-option-card blue">
                                <div className="ex-option-icon blue"><FileSpreadsheet style={{width:22,height:22,color:'#3b82f6'}} /></div>
                                <h3 className="ex-option-title">Fuzzy Logic Assessment</h3>
                                <p className="ex-option-sub">Mamdani · 81-Rule Inference</p>
                                <p className="ex-option-desc">Export fuzzy logic risk assessments with environmental parameters and intervention notes.</p>
                                <div className="ex-btn-row">
                                    <button className="ex-dl-btn green" onClick={handleFuzzyCSV} disabled={!exAssessments.length}><FileSpreadsheet style={{width:15,height:15}} />Download CSV</button>
                                    <button className="ex-dl-btn blue" onClick={handleFuzzySummary} disabled={!exAssessments.length}><FileText style={{width:15,height:15}} />Download Summary TXT</button>
                                </div>
                            </div>
                            <div className="ex-option-card purple">
                                <div className="ex-option-icon purple"><Layers style={{width:22,height:22,color:'#8b5cf6'}} /></div>
                                <h3 className="ex-option-title">Combined Summary</h3>
                                <p className="ex-option-sub">Integrated · Detection + Fuzzy</p>
                                <p className="ex-option-desc">Unified monitoring report combining image detection and fuzzy logic data.</p>
                                <div className="ex-btn-row">
                                    <button className="ex-dl-btn purple" onClick={handleCombinedSummary} disabled={!exDetections.length && !exAssessments.length}><FileText style={{width:15,height:15}} />Download Combined Report</button>
                                </div>
                            </div>
                        </div>
                        <div className="ex-tips">
                            <Info style={{width:18,height:18,color:'#3b82f6',flexShrink:0,marginTop:2}} />
                            <div>
                                <p className="ex-tips-title">Usage Tips</p>
                                <ul className="ex-tips-list">
                                    <li>· CSV exports are ideal for data analysis in Excel or Google Sheets</li>
                                    <li>· Summary TXT reports are formatted for government documentation</li>
                                    <li>· Use date and province filters to generate targeted regional exports</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'report' && (
                    <div>
                        <ReportFilters filters={filters} onChange={setFilters} />
                        <div className="rr-stat-grid">
                            {[
                                { label: 'Total Detections', value: totalDetections, color: 'blue' },
                                { label: 'Provinces Affected', value: totalProvinces, color: 'green' },
                                { label: 'Severe Cases', value: `${severePct}%`, color: 'red' },
                                { label: 'MoM Change', value: monthChange !== null ? `${monthChange > 0 ? '+' : ''}${monthChange}%` : 'N/A', color: monthChange !== null && monthChange > 0 ? 'amber' : 'green' },
                            ].map(s => (
                                <div key={s.label} className={`rr-stat ${s.color}`}>
                                    <div className="rr-stat-label">{s.label}</div>
                                    <div className={`rr-stat-value ${s.color}`}>{s.value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="rr-card">
                            <div className="rr-card-header">
                                <span className="rr-card-title"><BarChart2 style={{ width: 15, height: 15, color: '#2e8b4a' }} />Top Provinces by Detection Volume</span>
                                <button className={`rr-chart-toggle ${showChart ? 'active' : ''}`} onClick={() => setShowChart(v => !v)}>
                                    {showChart ? 'Hide Chart' : 'Show Chart'}
                                </button>
                            </div>
                            {showChart && <div style={{ padding: '20px 16px 8px' }}><ProvinceBarChart tableRows={tableRows} /></div>}
                        </div>

                        <div className="rr-card">
                            <div className="rr-card-header">
                                <span className="rr-card-title"><MapPin style={{ width: 15, height: 15, color: '#2e8b4a' }} />Province Breakdown</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                    <div className="rr-search-wrap">
                                        <Search className="rr-search-icon" />
                                        <input className="rr-search-input" placeholder="Search province…" value={search} onChange={e => setSearch(e.target.value)} />
                                    </div>
                                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8aaa96' }}>{tableRows.length} provinces</span>
                                </div>
                            </div>
                            {tableRows.length === 0 ? (
                                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                                    <AlertTriangle style={{ width: 32, height: 32, color: '#c8dfc8', margin: '0 auto 12px' }} />
                                    <p style={{ color: '#8aaa96', fontSize: 13 }}>No data matches your filters.</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="rr-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th className="sortable" onClick={() => handleSort('province')}>Province <SortIcon k="province" /></th>
                                                <th className="sortable" onClick={() => handleSort('total')}>Total <SortIcon k="total" /></th>
                                                <th className="sortable" onClick={() => handleSort('severe')}>Severe <SortIcon k="severe" /></th>
                                                <th className="sortable" onClick={() => handleSort('moderate')}>Moderate <SortIcon k="moderate" /></th>
                                                <th className="sortable" onClick={() => handleSort('low')}>Low <SortIcon k="low" /></th>
                                                <th className="sortable" onClick={() => handleSort('severePct')}>Severe % <SortIcon k="severePct" /></th>
                                                <th>Dominant</th>
                                                <th className="sortable" onClick={() => handleSort('currCount')}>This Month <SortIcon k="currCount" /></th>
                                                <th>Last Month</th>
                                                <th className="sortable" onClick={() => handleSort('trendVal')}>MoM Trend <SortIcon k="trendVal" /></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableRows.map((row, idx) => {
                                                const provinceDetections = filtered.filter(d => (d.province || 'Unknown') === row.province);
                                                return (
                                                    <tr key={row.province} className="clickable" onClick={() => setDrillDown({ province: row.province, detections: provinceDetections })}>
                                                        <td style={{ fontFamily: "'DM Mono',monospace", color: '#8aaa96', fontSize: 11 }}>{idx + 1}</td>
                                                        <td style={{ fontWeight: 600, color: '#2e8b4a' }}>{row.province}</td>
                                                        <td style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, color: '#2e8b4a' }}>{row.total}</td>
                                                        <td style={{ color: '#dc2626', fontWeight: 600 }}>{row.severe}</td>
                                                        <td style={{ color: '#d97706', fontWeight: 600 }}>{row.moderate}</td>
                                                        <td style={{ color: '#2e8b4a', fontWeight: 600 }}>{row.low}</td>
                                                        <td><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: row.severePct >= 50 ? '#dc2626' : row.severePct >= 25 ? '#d97706' : '#2e8b4a' }}>{row.severePct}%</span></td>
                                                        <td><span className={`rr-pill ${row.dominant}`}>{row.dominant}</span></td>
                                                        <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{row.currCount}</td>
                                                        <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: '#8aaa96' }}>{row.prevCount}</td>
                                                        <td>
                                                            {row.trend === 'up' && <span className="rr-trend-up"><TrendingUp style={{ width: 13, height: 13 }} />+{row.trendVal}%</span>}
                                                            {row.trend === 'down' && <span className="rr-trend-down"><TrendingDown style={{ width: 13, height: 13 }} />{row.trendVal}%</span>}
                                                            {row.trend === 'same' && <span className="rr-trend-same"><Minus style={{ width: 13, height: 13 }} />—</span>}
                                                            {row.trend === 'new' && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, background: 'rgba(46,139,74,0.10)', color: '#2e8b4a', border: '1px solid rgba(46,139,74,0.25)', borderRadius: 6, padding: '2px 7px' }}>NEW</span>}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <p style={{ marginTop: 8, fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#8aaa96', textAlign: 'right' }}>
                            Data as of {now.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })} · Click any row for details
                        </p>
                    </div>
                )}
            </div>

            {drillDown && (
                <ProvinceDrillDown
                    province={drillDown.province}
                    detections={drillDown.detections}
                    onClose={() => setDrillDown(null)}
                />
            )}
        </div>
    );
}