import React, { useState, useMemo, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Map, TrendingUp, AlertTriangle, BarChart3, MapPin, Activity } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

import MapSearch from '@/components/map/MapSearch';
import DetectionDetailPanel from '@/components/map/DetectionDetailPanel';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (severity, isHighlighted = false) => {
    const colors = { severe: '#e05555', moderate: '#e8a440', low: '#4caf72' };
    const c = colors[severity] || '#4caf72';
    const size = isHighlighted ? 26 : 20;
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:${size}px;height:${size}px;background:${c};border:${isHighlighted ? '3px' : '2px'} solid #ffffff;border-radius:50%;box-shadow:0 0 ${isHighlighted ? 14 : 8}px ${c}88;transition:all .2s;"></div>`,
        iconSize: [size, size], iconAnchor: [size / 2, size / 2],
    });
};

const PHILIPPINE_PROVINCES = [
    "Abra","Agusan del Norte","Agusan del Sur","Aklan","Albay","Antique","Apayao","Aurora","Basilan","Bataan","Batanes","Batangas","Benguet","Biliran","Bohol","Bukidnon","Bulacan","Cagayan","Camarines Norte","Camarines Sur","Camiguin","Capiz","Catanduanes","Cavite","Cebu","Cotabato","Davao de Oro","Davao del Norte","Davao del Sur","Davao Occidental","Davao Oriental","Dinagat Islands","Eastern Samar","Guimaras","Ifugao","Ilocos Norte","Ilocos Sur","Iloilo","Isabela","Kalinga","La Union","Laguna","Lanao del Norte","Lanao del Sur","Leyte","Maguindanao","Marinduque","Masbate","Metro Manila","Misamis Occidental","Misamis Oriental","Mountain Province","Negros Occidental","Negros Oriental","Northern Samar","Nueva Ecija","Nueva Vizcaya","Occidental Mindoro","Oriental Mindoro","Palawan","Pampanga","Pangasinan","Quezon","Quirino","Rizal","Romblon","Samar","Sarangani","Siquijor","Sorsogon","South Cotabato","Southern Leyte","Sultan Kudarat","Sulu","Surigao del Norte","Surigao del Sur","Tarlac","Tawi-Tawi","Zambales","Zamboanga del Norte","Zamboanga del Sur","Zamboanga Sibugay"
];

const TrendTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#fff', border: '1px solid #d6e8d6', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', fontFamily: "'Outfit',sans-serif" }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontFamily: "'DM Mono',monospace", color: '#8aaa96', textTransform: 'uppercase', letterSpacing: '.1em' }}>{label}</p>
            <p style={{ margin: 0, fontSize: 18, fontFamily: "'DM Serif Display',serif", color: '#2e8b4a' }}>
                {payload[0].value} <span style={{ fontSize: 12, color: '#8aaa96', fontFamily: "'DM Mono',monospace" }}>detections</span>
            </p>
        </div>
    );
};

const DonutTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#fff', border: '1px solid #d6e8d6', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', fontFamily: "'Outfit',sans-serif" }}>
            <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 600, color: '#1a3326', textTransform: 'capitalize' }}>{payload[0].name}</p>
            <p style={{ margin: 0, fontSize: 16, fontFamily: "'DM Serif Display',serif", color: payload[0].payload.color }}>
                {payload[0].value} <span style={{ fontSize: 11, color: '#8aaa96', fontFamily: "'DM Mono',monospace" }}>cases ({payload[0].payload.pct}%)</span>
            </p>
        </div>
    );
};

const DonutCenterLabel = ({ viewBox, total }) => {
    const { cx, cy } = viewBox;
    return (
        <g>
            <text x={cx} y={cy - 8} textAnchor="middle" fill="#1a3326" style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, fontWeight: 400 }}>{total}</text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill="#8aaa96" style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>TOTAL</text>
        </g>
    );
};

const mapStyles = `
    .map-root { background:#f4f7f4; min-height:100vh; color:#1a3326; font-family:'Outfit',sans-serif; }
    .map-root::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0; background: radial-gradient(ellipse 80% 60% at 15% 10%,rgba(46,139,74,0.04) 0%,transparent 60%); }
    .map-page { position:relative; z-index:1; max-width:1280px; margin:0 auto; padding:32px 24px 80px; }
    .map-header-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(46,139,74,0.10); border:1px solid rgba(46,139,74,0.25); border-radius:100px; padding:4px 12px; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.1em; color:#2e8b4a; text-transform:uppercase; margin-bottom:12px; }
    .map-h1 { font-family:'DM Serif Display',serif; font-size:clamp(26px,4vw,38px); font-weight:400; color:#1a3326; margin:0 0 6px; letter-spacing:-.02em; }
    .map-h1 em { font-style:italic; color:#2e8b4a; }
    .map-sub { font-size:13px; color:#5a8068; font-family:'DM Mono',monospace; }
    .map-divider { height:1px; background:linear-gradient(90deg,rgba(46,139,74,0.25),transparent 80%); margin:20px 0 28px; }
    .map-stat-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; margin-bottom:24px; }
    @media(max-width:1000px){ .map-stat-grid{grid-template-columns:repeat(3,1fr);} }
    @media(max-width:600px){ .map-stat-grid{grid-template-columns:1fr 1fr;} }
    .map-stat { background:#ffffff; border:1px solid #d6e8d6; border-radius:16px; padding:20px; position:relative; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,0.05); transition: transform .15s, box-shadow .15s; }
    .map-stat:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.09); }
    .map-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
    .map-stat.blue::before { background:linear-gradient(90deg,#3b82f6,transparent); }
    .map-stat.red::before { background:linear-gradient(90deg,#dc2626,transparent); }
    .map-stat.amber::before { background:linear-gradient(90deg,#d97706,transparent); }
    .map-stat.green::before { background:linear-gradient(90deg,#2e8b4a,transparent); }
    .map-stat.lime::before { background:linear-gradient(90deg,#4caf72,transparent); }
    .map-stat-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:12px; }
    .map-stat-icon.blue { background:rgba(59,130,246,0.10); }
    .map-stat-icon.red { background:rgba(220,38,38,0.10); }
    .map-stat-icon.amber { background:rgba(217,119,6,0.10); }
    .map-stat-icon.green { background:rgba(46,139,74,0.10); }
    .map-stat-icon.lime { background:rgba(76,175,114,0.10); }
    .map-stat-label { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:#8aaa96; margin-bottom:6px; }
    .map-stat-value { font-family:'DM Serif Display',serif; font-size:32px; font-weight:400; line-height:1; }
    .map-stat-value.blue { color:#3b82f6; } .map-stat-value.red { color:#dc2626; } .map-stat-value.amber { color:#d97706; } .map-stat-value.green { color:#2e8b4a; } .map-stat-value.lime { color:#4caf72; }
    .map-stat-sub { font-size:11px; color:#8aaa96; font-family:'DM Mono',monospace; margin-top:4px; }
    .map-card { background:#ffffff; border:1px solid #d6e8d6; border-radius:16px; overflow:hidden; position:relative; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
    .map-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,#2e8b4a,transparent); z-index:1; }
    .map-card-header { padding:18px 22px; border-bottom:1px solid #eaf2ea; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }
    .map-card-title { font-size:14px; font-weight:600; color:#1a3326; display:flex; align-items:center; gap:8px; }
    .map-card-body { padding:20px; }
    .map-filters-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
    @media(max-width:700px){ .map-filters-grid{grid-template-columns:1fr;} }
    .map-filter-label { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#8aaa96; margin-bottom:8px; display:block; }
    .map-select { width:100%; background:#f8fbf8; border:1px solid #c8dfc8; border-radius:10px; color:#1a3326; font-family:'Outfit',sans-serif; font-size:13px; padding:10px 14px; outline:none; cursor:pointer; transition:border-color .2s; }
    .map-select:focus { border-color:#2e8b4a; }
    .map-date-input { width:100%; background:#f8fbf8; border:1px solid #c8dfc8; border-radius:10px; color:#1a3326; font-family:'DM Mono',monospace; font-size:13px; padding:10px 14px; outline:none; transition:border-color .2s; }
    .map-date-input:focus { border-color:#2e8b4a; }
    .map-main-grid { display:grid; grid-template-columns:1fr 320px; gap:20px; }
    @media(max-width:1000px){ .map-main-grid{grid-template-columns:1fr;} }
    .map-side-grid { display:flex; flex-direction:column; gap:20px; }
    .map-legend { padding:16px 20px; border-top:1px solid #eaf2ea; background:#f8fbf8; display:flex; gap:20px; flex-wrap:wrap; flex-shrink:0; }
    .map-legend-item { display:flex; align-items:center; gap:8px; font-size:12px; color:#5a8068; font-family:'DM Mono',monospace; }
    .map-legend-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; }
    .map-province-item { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eaf2ea; }
    .map-province-item:last-child { border:0; }
    .map-province-rank { width:24px; height:24px; border-radius:8px; background:rgba(46,139,74,0.10); color:#2e8b4a; font-size:11px; font-weight:700; font-family:'DM Mono',monospace; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .map-province-name { font-size:13px; color:#1a3326; margin-left:10px; flex:1; font-weight:500; }
    .map-province-bar-wrap { flex:1; margin: 0 10px; height:5px; background:#eaf2ea; border-radius:99px; overflow:hidden; }
    .map-province-bar { height:100%; border-radius:99px; background:linear-gradient(90deg,#2e8b4a,#4caf72); transition:width .6s ease; }
    .map-province-count { font-family:'DM Mono',monospace; font-size:12px; background:rgba(46,139,74,0.08); border:1px solid rgba(46,139,74,0.20); border-radius:6px; padding:2px 8px; color:#2e8b4a; }
    .map-recent-item { padding:10px 8px; border-bottom:1px solid #eaf2ea; cursor:pointer; border-radius:8px; transition:background .15s; }
    .map-recent-item:last-child { border:0; }
    .map-recent-item:hover { background:rgba(46,139,74,0.05); }
    .map-severity-pill { display:inline-flex; align-items:center; gap:5px; border-radius:100px; padding:3px 10px; font-size:11px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; }
    .map-severity-pill::before { content:''; width:5px; height:5px; border-radius:50%; flex-shrink:0; }
    .map-severity-pill.severe { background:rgba(220,38,38,.10); color:#dc2626; border:1px solid rgba(220,38,38,.25); }
    .map-severity-pill.severe::before { background:#dc2626; }
    .map-severity-pill.moderate { background:rgba(217,119,6,.10); color:#d97706; border:1px solid rgba(217,119,6,.25); }
    .map-severity-pill.moderate::before { background:#d97706; }
    .map-severity-pill.low { background:rgba(46,139,74,.10); color:#2e8b4a; border:1px solid rgba(46,139,74,.25); }
    .map-severity-pill.low::before { background:#2e8b4a; }
    .map-empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 24px; text-align:center; }
    .map-empty-icon { width:56px; height:56px; border-radius:16px; background:rgba(46,139,74,0.08); border:1px solid #c8dfc8; display:flex; align-items:center; justify-content:center; margin-bottom:16px; }
    .leaflet-control-attribution { background:rgba(255,255,255,.90)!important; color:#5a8068!important; }
    .leaflet-control-attribution a { color:#2e8b4a!important; }
    .leaflet-popup-content-wrapper { background:#ffffff!important; border:1px solid #d6e8d6!important; color:#1a3326!important; border-radius:12px!important; box-shadow:0 4px 16px rgba(0,0,0,0.12)!important; }
    .leaflet-popup-tip { background:#ffffff!important; }
    .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large { background:rgba(46,139,74,0.18) !important; }
    .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div { background:rgba(46,139,74,0.85) !important; color:#fff !important; font-family:'DM Mono',monospace !important; font-size:12px !important; font-weight:700 !important; }
    .mobile-detail-panel { display:none; }
    @media(max-width:768px){
        .desktop-detail-panel { display:none !important; }
        .mobile-detail-panel { display:block; margin-top:16px; }
    }
    .chart-row { display:grid; grid-template-columns:1fr 340px; gap:20px; margin-bottom:20px; }
    @media(max-width:900px){ .chart-row { grid-template-columns:1fr; } }
    .trend-badge { display:inline-flex; align-items:center; gap:4px; border-radius:100px; padding:3px 10px; font-size:11px; font-family:'DM Mono',monospace; font-weight:600; }
    .trend-badge.up { background:rgba(220,38,38,0.08); color:#dc2626; border:1px solid rgba(220,38,38,0.2); }
    .trend-badge.down { background:rgba(46,139,74,0.08); color:#2e8b4a; border:1px solid rgba(46,139,74,0.2); }
    .trend-badge.flat { background:rgba(100,100,100,0.08); color:#666; border:1px solid rgba(100,100,100,0.2); }
    .view-all-btn { display:block; width:100%; text-align:center; padding:10px; font-size:12px; font-family:'DM Mono',monospace; color:#2e8b4a; background:rgba(46,139,74,0.05); border:1px solid rgba(46,139,74,0.15); border-radius:10px; cursor:pointer; margin-top:12px; transition:background .15s; letter-spacing:.06em; }
    .view-all-btn:hover { background:rgba(46,139,74,0.10); }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    .fade-in { animation: fadeIn .35s ease both; }
    .map-container-wrap { height:480px; min-height:480px; position:relative; overflow:hidden; flex-shrink:0; }
    .map-card-flex { display:flex; flex-direction:column; min-height:0; }
    .how-to-wrap { background:#fff; border:1px solid #d6e8d6; border-radius:16px; margin-bottom:24px; position:relative; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
    .how-to-wrap::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,#2e8b4a,transparent); }
    .how-to-header { padding:18px 24px 0; display:flex; align-items:center; gap:10px; }
    .how-to-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(46,139,74,0.10); border:1px solid rgba(46,139,74,0.25); border-radius:100px; padding:3px 10px; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.12em; color:#2e8b4a; text-transform:uppercase; }
    .how-to-title { font-family:'DM Serif Display',serif; font-size:17px; font-weight:400; color:#1a3326; margin:6px 24px 0; }
    .how-to-subtitle { font-family:'DM Mono',monospace; font-size:11px; color:#8aaa96; margin:4px 24px 20px; }
    .how-to-steps { display:grid; grid-template-columns:repeat(5,1fr); gap:0; border-top:1px solid #eaf2ea; }
    @media(max-width:900px){ .how-to-steps { grid-template-columns:repeat(3,1fr); } }
    @media(max-width:700px){ .how-to-steps { grid-template-columns:1fr 1fr; } }
    @media(max-width:360px){ .how-to-steps { grid-template-columns:1fr; } }
    .how-to-step { padding:20px; position:relative; border-right:1px solid #eaf2ea; }
    .how-to-step:last-child { border-right:none; }
    @media(max-width:900px){ .how-to-step:nth-child(3n) { border-right:none; } }
    @media(max-width:700px){ .how-to-step:nth-child(3n) { border-right:1px solid #eaf2ea; } }
    @media(max-width:700px){ .how-to-step:nth-child(2n) { border-right:none; } }
    .how-to-step-num { width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,#2e8b4a,#4caf72); color:#fff; font-family:'DM Mono',monospace; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; margin-bottom:12px; flex-shrink:0; box-shadow:0 2px 8px rgba(46,139,74,0.30); }
    .how-to-step-title { font-size:13px; font-weight:600; color:#1a3326; margin-bottom:6px; line-height:1.3; }
    .how-to-step-desc { font-size:11.5px; color:#5a8068; line-height:1.6; font-family:'Outfit',sans-serif; }
    .how-to-tip { margin:0 24px 20px; background:rgba(46,139,74,0.04); border:1px solid rgba(46,139,74,0.15); border-radius:10px; padding:10px 14px; display:flex; align-items:flex-start; gap:8px; }
    .how-to-tip-icon { font-size:14px; flex-shrink:0; margin-top:1px; }
    .how-to-tip-text { font-size:12px; color:#5a8068; font-family:'DM Mono',monospace; line-height:1.6; }
    .how-to-tip-text strong { color:#2e8b4a; }
`;

function HowToUse() {
    const steps = [
        { num: 1, title: 'Check the Metric Cards', desc: 'Review the 5 summary cards at the top: Total Detections, Severe, Moderate, Low cases, and the average insect count per farm.' },
        { num: 2, title: 'Apply Filters', desc: 'Use the Filters panel to narrow results by Severity Level, Date Range, or Province. You can also set a Custom Date Range.' },
        { num: 3, title: 'Explore the Map', desc: 'Colored dots show detection locations. Red = Severe, Orange = Moderate, Green = Low. Click any dot to view full details.' },
        { num: 4, title: 'Analyze the Charts', desc: 'The Detection Trend line chart shows monthly counts over 6 months. The Severity Breakdown donut shows the proportion of each level.' },
        { num: 5, title: 'Review Affected Areas', desc: 'Check Top Affected Provinces and Recent Detections in the sidebar to identify which areas need priority attention.' },
    ];
    return (
        <div className="how-to-wrap">
            <div className="how-to-header">
                <span className="how-to-badge">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4.5" stroke="#2e8b4a"/><path d="M5 4.5v3M5 3h.01" stroke="#2e8b4a" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    How to Use
                </span>
            </div>
            <div className="how-to-title">Getting Started with the Detection Dashboard</div>
            <div className="how-to-subtitle">Follow these steps to navigate and interpret the monitoring data.</div>
            <div className="how-to-steps">
                {steps.map((step) => (
                    <div key={step.num} className="how-to-step">
                        <div className="how-to-step-num">{step.num}</div>
                        <div className="how-to-step-title">{step.title}</div>
                        <div className="how-to-step-desc">{step.desc}</div>
                    </div>
                ))}
            </div>
            <div className="how-to-tip">
                <span className="how-to-tip-icon">💡</span>
                <span className="how-to-tip-text">
                    <strong>Pro tip:</strong> Click any marker on the map or any row in Recent Detections to open the full detection detail panel, including the captured image, farm info, insect count, and exact GPS coordinates.
                </span>
            </div>
        </div>
    );
}

function DetectionTrendChart({ detections }) {
    const trendData = useMemo(() => {
        const months = Array.from({ length: 6 }, (_, i) => {
            const d = subMonths(new Date(), 5 - i);
            return { label: format(d, 'MMM yyyy'), short: format(d, 'MMM'), start: startOfMonth(d), end: endOfMonth(d), count: 0 };
        });
        detections.forEach(d => {
            if (!d.created_date) return;
            const dt = new Date(d.created_date);
            months.forEach(m => { if (isWithinInterval(dt, { start: m.start, end: m.end })) m.count++; });
        });
        return months.map(m => ({ name: m.short, full: m.label, count: m.count }));
    }, [detections]);

    const lastTwo = trendData.slice(-2);
    const prev = lastTwo[0]?.count || 0;
    const curr = lastTwo[1]?.count || 0;
    const diff = curr - prev;
    const pct = prev > 0 ? Math.round((diff / prev) * 100) : curr > 0 ? 100 : 0;
    const trendDir = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
    const trendLabel = trendDir === 'up' ? `▲ +${pct}% this month` : trendDir === 'down' ? `▼ ${pct}% this month` : '→ No change';

    return (
        <div className="map-card">
            <div className="map-card-header">
                <span className="map-card-title"><Activity style={{ width:15, height:15, color:'#2e8b4a' }} />Detection Trend</span>
                <span className={`trend-badge ${trendDir}`}>{trendLabel}</span>
            </div>
            <div style={{ padding:'20px 20px 12px' }}>
                <p style={{ margin:'0 0 16px', fontSize:12, color:'#8aaa96', fontFamily:"'DM Mono',monospace" }}>Monthly cocolisap detection count — last 6 months</p>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eaf2ea" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontFamily:"'DM Mono',monospace", fontSize:11, fill:'#8aaa96' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontFamily:"'DM Mono',monospace", fontSize:11, fill:'#8aaa96' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<TrendTooltip />} />
                        <Line type="monotone" dataKey="count" stroke="#2e8b4a" strokeWidth={2.5} dot={{ fill:'#2e8b4a', r:4, strokeWidth:2, stroke:'#fff' }} activeDot={{ r:6, fill:'#2e8b4a', stroke:'#fff', strokeWidth:2 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function SeverityDonutChart({ stats }) {
    const total = stats.total;
    const allData = useMemo(() => [
        { name: 'Severe',   value: stats.severe,   color: '#dc2626', pct: total > 0 ? Math.round((stats.severe   / total) * 100) : 0 },
        { name: 'Moderate', value: stats.moderate, color: '#d97706', pct: total > 0 ? Math.round((stats.moderate / total) * 100) : 0 },
        { name: 'Low',      value: stats.low,      color: '#4caf72', pct: total > 0 ? Math.round((stats.low      / total) * 100) : 0 },
    ], [stats, total]);
    const chartData = useMemo(() => allData.filter(d => d.value > 0), [allData]);

    if (total === 0) return (
        <div className="map-card">
            <div className="map-card-header"><span className="map-card-title"><BarChart3 style={{ width:15, height:15, color:'#2e8b4a' }} />Severity Breakdown</span></div>
            <div className="map-empty-state" style={{ padding:'40px 24px' }}><p style={{ fontSize:13, color:'#8aaa96' }}>No data available</p></div>
        </div>
    );

    return (
        <div className="map-card">
            <div className="map-card-header"><span className="map-card-title"><BarChart3 style={{ width:15, height:15, color:'#2e8b4a' }} />Severity Breakdown</span></div>
            <div style={{ padding:'16px 20px 20px' }}>
                <p style={{ margin:'0 0 12px', fontSize:12, color:'#8aaa96', fontFamily:"'DM Mono',monospace" }}>Distribution of infestation severity levels</p>
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
                            {chartData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                            <DonutCenterLabel total={total} />
                        </Pie>
                        <Tooltip content={<DonutTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:4 }}>
                    {allData.map(d => (
                        <div key={d.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:10, height:10, borderRadius:'50%', background:d.color, flexShrink:0, opacity: d.value === 0 ? 0.35 : 1 }} />
                            <span style={{ fontSize:12, color: d.value === 0 ? '#aaa' : '#1a3326', fontWeight:500, flex:1, textTransform:'capitalize' }}>{d.name}</span>
                            <div style={{ flex:2, height:5, background:'#eaf2ea', borderRadius:99, overflow:'hidden' }}>
                                <div style={{ width:`${d.pct}%`, height:'100%', background:d.color, borderRadius:99, transition:'width .6s ease', opacity: d.value === 0 ? 0.35 : 1 }} />
                            </div>
                            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color: d.value === 0 ? '#aaa' : '#8aaa96', minWidth:52, textAlign:'right' }}>{d.value} ({d.pct}%)</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MobileDetailCard({ detection, onClose }) {
    if (!detection) return null;
    const severityColors = {
        severe: { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.25)' },
        moderate: { color: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.25)' },
        low: { color: '#2e8b4a', bg: 'rgba(46,139,74,0.08)', border: 'rgba(46,139,74,0.25)' },
    };
    const cfg = severityColors[detection.severity] || severityColors.low;
    const Row = ({ label, value }) => {
        if (!value) return null;
        return (
            <div style={{ padding: '8px 0', borderBottom: '1px solid #eaf2ea' }}>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#8aaa96', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, color: '#1a3326', fontWeight: 500 }}>{value}</div>
            </div>
        );
    };
    return (
        <div style={{ background: '#fff', border: '1px solid #d6e8d6', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', fontFamily: "'Outfit',sans-serif" }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #eaf2ea', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fbf8' }}>
                <div>
                    <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: '#8aaa96', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Detection Details</div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: cfg.color, textTransform: 'uppercase' }}>{detection.severity}</span>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: '1px solid #d6e8d6', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#8aaa96', fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>✕ Close</button>
            </div>
            {detection.image_url && (
                <div style={{ height: 180, overflow: 'hidden' }}>
                    <img src={detection.image_url} alt="Detection" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            )}
            <div style={{ padding: '12px 16px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div style={{ background: 'rgba(46,139,74,0.06)', border: '1px solid rgba(46,139,74,0.15)', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: '#8aaa96', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Insects</div>
                        <div style={{ fontSize: 22, fontFamily: "'DM Serif Display',serif", color: '#2e8b4a' }}>{detection.total_detections ?? '—'}</div>
                    </div>
                    <div style={{ background: 'rgba(46,139,74,0.06)', border: '1px solid rgba(46,139,74,0.15)', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: '#8aaa96', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Confidence</div>
                        <div style={{ fontSize: 22, fontFamily: "'DM Serif Display',serif", color: '#2e8b4a' }}>{detection.avg_confidence ? `${(detection.avg_confidence * 100).toFixed(1)}%` : '—'}</div>
                    </div>
                </div>
                <Row label="Location" value={[detection.barangay, detection.municipality, detection.province].filter(Boolean).join(', ')} />
                <Row label="Farm Name" value={detection.farmName} />
                <Row label="Farm Owner" value={detection.farmOwner} />
                <Row label="Date & Time" value={detection.created_date ? format(new Date(detection.created_date), 'MMM d, yyyy · h:mm a') : null} />
                <Row label="Location Method" value={detection.locationMethod === 'gps' ? 'GPS Captured' : detection.locationMethod === 'manual' ? 'Manually Entered' : null} />
                {detection.latitude && detection.longitude && (
                    <Row label="Coordinates" value={`${detection.latitude.toFixed(5)}, ${detection.longitude.toFixed(5)}`} />
                )}
                <Row label="Notes" value={detection.notes} />
            </div>
        </div>
    );
}

export default function MapDashboard() {
    const [allDetections, setAllDetections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [severityFilter, setSeverityFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [provinceFilter, setProvinceFilter] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedDetectionId, setSelectedDetectionId] = useState(null);
    const [showAllProvinces, setShowAllProvinces] = useState(false);

    useEffect(() => {
        const CACHE_KEY = 'cocolisap_detections_cache';
        const CACHE_TTL = 5 * 60 * 1000;
        const fetchDetections = async () => {
            try {
                const cached = sessionStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < CACHE_TTL) {
                        setAllDetections(data);
                        setIsLoading(false);
                        return;
                    }
                }
            } catch (_) {}
            try {
                const q = query(collection(db, 'detections'), orderBy('created_date', 'desc'), limit(200));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllDetections(data);
                try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() })); } catch (_) {}
            } catch (e) {
                console.error('Error fetching detections:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetections();
    }, []);

    const filteredDetections = useMemo(() => {
        let filtered = allDetections;
        if (severityFilter !== 'all') filtered = filtered.filter(d => d.severity === severityFilter);
        if (provinceFilter !== 'all') filtered = filtered.filter(d => d.province === provinceFilter);
        if (dateFilter === 'custom' && customStartDate && customEndDate) {
            const start = new Date(customStartDate), end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(d => { const dt = new Date(d.created_date); return dt >= start && dt <= end; });
        } else if (dateFilter !== 'all') {
            const now = new Date();
            filtered = filtered.filter(d => {
                const diff = Math.floor((now - new Date(d.created_date)) / 86400000);
                if (dateFilter === 'today') return diff === 0;
                if (dateFilter === 'week') return diff <= 7;
                if (dateFilter === 'month') return diff <= 30;
                if (dateFilter === 'quarter') return diff <= 90;
                if (dateFilter === 'year') return diff <= 365;
                return true;
            });
        }
        return filtered;
    }, [allDetections, severityFilter, dateFilter, provinceFilter, customStartDate, customEndDate]);

    const stats = useMemo(() => {
        const total = filteredDetections.length;
        const severe = filteredDetections.filter(d => d.severity === 'severe').length;
        const moderate = filteredDetections.filter(d => d.severity === 'moderate').length;
        const low = filteredDetections.filter(d => d.severity === 'low').length;
        const avgInsects = total > 0 ? (filteredDetections.reduce((s, d) => s + (d.total_detections || 0), 0) / total).toFixed(1) : 0;
        const now = new Date();
        const thisMonth = filteredDetections.filter(d => {
            if (!d.created_date) return false;
            const dt = new Date(d.created_date);
            return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
        }).length;
        return { total, severe, moderate, low, avgInsects, thisMonth };
    }, [filteredDetections]);

    const allTopProvinces = useMemo(() => {
        const pc = {};
        filteredDetections.forEach(d => { if (d.province) pc[d.province] = (pc[d.province] || 0) + 1; });
        return Object.entries(pc).sort((a, b) => b[1] - a[1]);
    }, [filteredDetections]);

    const topProvinces = useMemo(() => showAllProvinces ? allTopProvinces : allTopProvinces.slice(0, 5), [allTopProvinces, showAllProvinces]);
    const maxProvinceCount = allTopProvinces[0]?.[1] || 1;
    const recentDetections = useMemo(() => filteredDetections.slice(0, 6), [filteredDetections]);
    const detectionsWithGPS = useMemo(() => filteredDetections.filter(d => d.latitude && d.longitude), [filteredDetections]);
    const mapCenter = useMemo(() => {
        if (!detectionsWithGPS.length) return [12.8797, 121.7740];
        return [
            detectionsWithGPS.reduce((s, d) => s + d.latitude, 0) / detectionsWithGPS.length,
            detectionsWithGPS.reduce((s, d) => s + d.longitude, 0) / detectionsWithGPS.length,
        ];
    }, [detectionsWithGPS]);

    const selectedDetection = useMemo(() => allDetections.find(d => d.id === selectedDetectionId), [allDetections, selectedDetectionId]);

    const getLocation = (d) => {
        const parts = [d.barangay, d.municipality, d.province].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
    };

    const timeAgo = (dateStr) => {
        if (!dateStr) return '—';
        const diff = Math.floor((new Date() - new Date(dateStr)) / 60000);
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return format(new Date(dateStr), 'MMM d');
    };

    if (isLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
            <div style={{ width: 32, height: 32, border: '3px solid #d6e8d6', borderTopColor: '#2e8b4a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: '#8aaa96' }}>Loading detections…</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div className="map-root">
            <style>{mapStyles}</style>
            <div className="map-page">

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <div className="map-header-badge">Monitoring System</div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h1 className="map-h1">Detection <em>Map</em> Dashboard</h1>
                            <p className="map-sub">Cocolisap infestation monitoring across Philippine coconut farms</p>
                        </div>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'#8aaa96', background:'#fff', border:'1px solid #d6e8d6', borderRadius:10, padding:'8px 14px', lineHeight:1.6 }}>
                            <div style={{ marginBottom:4 }}>Last updated</div>
                            <div style={{ color:'#1a3326', fontWeight:600 }}>{format(new Date(), 'MMM d, yyyy · h:mm a')}</div>
                        </div>
                    </div>
                </div>
                <div className="map-divider" />

                <HowToUse />

                {/* Metric Cards */}
                <div className="map-stat-grid">
                    {[
                        { label: 'Total Detections', value: stats.total, color: 'blue', sub: `${stats.thisMonth} this month`, icon: <BarChart3 style={{ width: 18, height: 18, color: '#3b82f6' }} /> },
                        { label: 'Severe Cases', value: stats.severe, color: 'red', sub: stats.total > 0 ? `${Math.round((stats.severe / stats.total) * 100)}% of total` : '—', icon: <AlertTriangle style={{ width: 18, height: 18, color: '#dc2626' }} /> },
                        { label: 'Moderate Cases', value: stats.moderate, color: 'amber', sub: stats.total > 0 ? `${Math.round((stats.moderate / stats.total) * 100)}% of total` : '—', icon: <TrendingUp style={{ width: 18, height: 18, color: '#d97706' }} /> },
                        { label: 'Low Cases', value: stats.low, color: 'lime', sub: stats.total > 0 ? `${Math.round((stats.low / stats.total) * 100)}% of total` : '—', icon: <Activity style={{ width: 18, height: 18, color: '#4caf72' }} /> },
                        { label: 'Avg Insects / Farm', value: stats.avgInsects, color: 'green', sub: `across ${stats.total} submission${stats.total !== 1 ? 's' : ''}`, icon: <BarChart3 style={{ width: 18, height: 18, color: '#2e8b4a' }} /> },
                    ].map(s => (
                        <div key={s.label} className={`map-stat ${s.color}`}>
                            <div className={`map-stat-icon ${s.color}`}>{s.icon}</div>
                            <div className="map-stat-label">{s.label}</div>
                            <div className={`map-stat-value ${s.color}`}>{s.value}</div>
                            <div className="map-stat-sub">{s.sub}</div>
                        </div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="chart-row">
                    <DetectionTrendChart detections={filteredDetections} />
                    <SeverityDonutChart stats={stats} />
                </div>

                {/* ── Map + Sidebar (now ABOVE filters) ── */}
                <div className="map-main-grid" style={{ marginBottom: 20 }}>
                    <div className="map-card map-card-flex">
                        <div className="map-card-header">
                            <span className="map-card-title"><MapPin style={{ width: 15, height: 15, color: '#2e8b4a' }} />Interactive Map View</span>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8aaa96' }}>{detectionsWithGPS.length} locations</span>
                        </div>
                        <div className="map-container-wrap">
                            {detectionsWithGPS.length > 0 ? (
                                <MapContainer center={mapCenter} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
                                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                        subdomains="abcd"
                                    />
                                    <MarkerClusterGroup chunkedLoading>
                                        {detectionsWithGPS.map(d => (
                                            <Marker key={d.id} position={[d.latitude, d.longitude]} icon={createCustomIcon(d.severity, d.id === selectedDetectionId)} eventHandlers={{ click: () => setSelectedDetectionId(d.id) }}>
                                                <Popup>
                                                    <div style={{ padding: '6px 2px', minWidth: 180, fontFamily: "'Outfit',sans-serif" }}>
                                                        <span className={`map-severity-pill ${d.severity}`}>{d.severity?.toUpperCase()}</span>
                                                        <p style={{ fontWeight: 600, color: '#1a3326', margin: '8px 0 2px', fontSize: 13 }}>{[d.barangay, d.municipality].filter(Boolean).join(', ') || d.province || 'Unknown'}</p>
                                                        {d.province && <p style={{ fontSize: 12, color: '#8aaa96', margin: '0 0 4px', fontFamily: "'DM Mono',monospace" }}>{d.province}</p>}
                                                        <p style={{ fontSize: 13, color: '#1a3326', margin: 0 }}><strong style={{ color: '#2e8b4a' }}>{d.total_detections}</strong> insects detected</p>
                                                        <button onClick={() => setSelectedDetectionId(d.id)} style={{ marginTop: 8, fontSize: 11, color: '#2e8b4a', background: 'rgba(46,139,74,0.08)', border: '1px solid rgba(46,139,74,0.25)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>View Details ↓</button>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </MarkerClusterGroup>
                                    <MapSearch detections={detectionsWithGPS} onSelect={d => setSelectedDetectionId(d.id)} selectedId={selectedDetectionId} />
                                </MapContainer>
                            ) : (
                                <div className="map-empty-state">
                                    <div className="map-empty-icon"><Map style={{ width: 24, height: 24, color: '#2e8b4a' }} /></div>
                                    <p style={{ fontWeight: 600, color: '#1a3326', marginBottom: 6 }}>No GPS Data Available</p>
                                    <p style={{ fontSize: 13, color: '#5a8068', maxWidth: 320 }}>No detections with GPS coordinates found. Adjust filters or capture location during detection.</p>
                                </div>
                            )}
                        </div>
                        {selectedDetection && (
                            <div className="desktop-detail-panel">
                                <DetectionDetailPanel detection={selectedDetection} onClose={() => setSelectedDetectionId(null)} />
                            </div>
                        )}
                        {selectedDetection && (
                            <div className="mobile-detail-panel">
                                <div style={{ padding: '0 16px 16px' }}>
                                    <MobileDetailCard detection={selectedDetection} onClose={() => setSelectedDetectionId(null)} />
                                </div>
                            </div>
                        )}
                        <div className="map-legend">
                            {[{ color: '#e05555', label: 'Severe (10+)' }, { color: '#e8a440', label: 'Moderate (5–9)' }, { color: '#4caf72', label: 'Low (1–4)' }].map(l => (
                                <div key={l.label} className="map-legend-item"><div className="map-legend-dot" style={{ background: l.color, boxShadow: `0 0 6px ${l.color}88` }} />{l.label}</div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="map-side-grid">
                        <div className="map-card">
                            <div className="map-card-header">
                                <span className="map-card-title">Top Affected Provinces</span>
                                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'#8aaa96' }}>{allTopProvinces.length} province{allTopProvinces.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="map-card-body">
                                {topProvinces.length > 0 ? (
                                    <>
                                        {topProvinces.map(([province, count], idx) => (
                                            <div key={province} className="map-province-item">
                                                <div className="map-province-rank">{idx + 1}</div>
                                                <span className="map-province-name">{province}</span>
                                                <div className="map-province-bar-wrap">
                                                    <div className="map-province-bar" style={{ width: `${Math.round((count / maxProvinceCount) * 100)}%` }} />
                                                </div>
                                                <span className="map-province-count">{count}</span>
                                            </div>
                                        ))}
                                        {allTopProvinces.length > 5 && (
                                            <button className="view-all-btn" onClick={() => setShowAllProvinces(v => !v)}>
                                                {showAllProvinces ? '↑ Show less' : `↓ View all ${allTopProvinces.length} provinces`}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <p style={{ fontSize: 13, color: '#8aaa96', textAlign: 'center', padding: '16px 0', fontFamily: "'DM Mono',monospace" }}>No province data available</p>
                                )}
                            </div>
                        </div>

                        <div className="map-card">
                            <div className="map-card-header">
                                <span className="map-card-title">Recent Detections</span>
                                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'#8aaa96' }}>latest {recentDetections.length}</span>
                            </div>
                            <div className="map-card-body">
                                {recentDetections.length > 0 ? recentDetections.map(d => (
                                    <div key={d.id} className="map-recent-item" onClick={() => setSelectedDetectionId(d.id)}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span className={`map-severity-pill ${d.severity}`}>{d.severity}</span>
                                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#8aaa96' }}>{timeAgo(d.created_date)}</span>
                                        </div>
                                        <p style={{ fontSize: 13, color: '#1a3326', margin: '0 0 2px', fontWeight: 500 }}>{getLocation(d)}</p>
                                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                            <span style={{ fontSize: 11, color: '#8aaa96', fontFamily: "'DM Mono',monospace" }}>{d.total_detections ?? 0} insects</span>
                                            {d.farmName && (<><span style={{ fontSize:11, color:'#d6e8d6' }}>·</span><span style={{ fontSize: 11, color: '#8aaa96', fontFamily: "'DM Mono',monospace" }}>{d.farmName}</span></>)}
                                        </div>
                                    </div>
                                )) : (
                                    <p style={{ fontSize: 13, color: '#8aaa96', textAlign: 'center', padding: '16px 0', fontFamily: "'DM Mono',monospace" }}>No recent detections</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Filters (now BELOW the map) ── */}
                <div className="map-card" style={{ marginBottom: 20 }}>
                    <div className="map-card-header">
                        <span className="map-card-title">Filters</span>
                        {(severityFilter !== 'all' || dateFilter !== 'all' || provinceFilter !== 'all') && (
                            <button
                                onClick={() => { setSeverityFilter('all'); setDateFilter('all'); setProvinceFilter('all'); setCustomStartDate(''); setCustomEndDate(''); }}
                                style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:'#dc2626', background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:8, padding:'4px 10px', cursor:'pointer' }}
                            >✕ Clear filters</button>
                        )}
                    </div>
                    <div className="map-card-body">
                        <div className="map-filters-grid">
                            <div>
                                <span className="map-filter-label">Severity Level</span>
                                <select className="map-select" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
                                    <option value="all">All Levels</option>
                                    <option value="severe">Severe Only</option>
                                    <option value="moderate">Moderate Only</option>
                                    <option value="low">Low Only</option>
                                </select>
                            </div>
                            <div>
                                <span className="map-filter-label">Date Range</span>
                                <select className="map-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
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
                                <span className="map-filter-label">Province</span>
                                <select className="map-select" value={provinceFilter} onChange={e => setProvinceFilter(e.target.value)}>
                                    <option value="all">All Provinces</option>
                                    {PHILIPPINE_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                        {dateFilter === 'custom' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                                <div><span className="map-filter-label">Start Date</span><input type="date" className="map-date-input" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} /></div>
                                <div><span className="map-filter-label">End Date</span><input type="date" className="map-date-input" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} /></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ borderTop:'1px solid #d6e8d6', paddingTop:24, marginTop:40, fontSize:11, color:'#8aaa96', fontFamily:"'DM Mono',monospace", display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                    <span>CocolisapScan · Infestation Monitoring</span>
                    <span>{filteredDetections.length} record{filteredDetections.length !== 1 ? 's' : ''} loaded</span>
                </div>
            </div>
        </div>
    );
}