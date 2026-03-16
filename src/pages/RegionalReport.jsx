import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Download, TrendingUp, TrendingDown, Minus, MapPin, AlertTriangle, Search, ChevronUp, ChevronDown, BarChart2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

import ReportFilters from '@/components/report/ReportFilters';
import ProvinceBarChart, { SeverityPieChart, MonthlyTrendChart } from '@/components/report/ProvinceBarChart';
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
`;

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
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ date: 'all', severity: 'all', province: 'all', customStart: '', customEnd: '' });
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState('total');
    const [sortDir, setSortDir] = useState('desc');
    const [showChart, setShowChart] = useState(true);
    const [drillDown, setDrillDown] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const detSnap = await getDocs(query(collection(db, 'detections'), orderBy('created_date', 'desc'), limit(1000)));
                setAllDetections(detSnap.docs.map(d => ({ id: d.id, ...d.data() })));
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
                    <div className="rr-badge">Regional Report</div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h1 className="rr-h1">Regional <em>Overview</em> Report</h1>
                            <p className="rr-sub">Province-level aggregation of Cocolisap infestation detections</p>
                        </div>
                        <button className="rr-dl-btn" onClick={handleDownloadPDF}>
                            <Download style={{ width: 15, height: 15 }} />Download PDF
                        </button>
                    </div>
                </div>
                <div className="rr-divider" />

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

                {/* Severity Distribution + Monthly Trend */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                    <div className="rr-card" style={{ marginBottom: 0 }}>
                        <div className="rr-card-header">
                            <span className="rr-card-title">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2e8b4a" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                                Severity Distribution
                            </span>
                        </div>
                        <div style={{ padding: '16px' }}>
                            <SeverityPieChart detections={filtered} />
                        </div>
                    </div>
                    <div className="rr-card" style={{ marginBottom: 0 }}>
                        <div className="rr-card-header">
                            <span className="rr-card-title">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2e8b4a" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                                Monthly Detection Trend
                            </span>
                        </div>
                        <div style={{ padding: '16px 8px 8px' }}>
                            <MonthlyTrendChart detections={filtered} />
                        </div>
                    </div>
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