import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Map, TrendingUp, AlertTriangle, BarChart3, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

const mapStyles = `
    .map-root { background:#f4f7f4; min-height:100vh; color:#1a3326; font-family:'Outfit',sans-serif; }
    .map-root::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0; background: radial-gradient(ellipse 80% 60% at 15% 10%,rgba(46,139,74,0.04) 0%,transparent 60%); }
    .map-page { position:relative; z-index:1; max-width:1280px; margin:0 auto; padding:32px 24px 80px; }
    .map-header-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(46,139,74,0.10); border:1px solid rgba(46,139,74,0.25); border-radius:100px; padding:4px 12px; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.1em; color:#2e8b4a; text-transform:uppercase; margin-bottom:12px; }
    .map-h1 { font-family:'DM Serif Display',serif; font-size:clamp(26px,4vw,38px); font-weight:400; color:#1a3326; margin:0 0 6px; letter-spacing:-.02em; }
    .map-h1 em { font-style:italic; color:#2e8b4a; }
    .map-sub { font-size:13px; color:#5a8068; font-family:'DM Mono',monospace; }
    .map-divider { height:1px; background:linear-gradient(90deg,rgba(46,139,74,0.25),transparent 80%); margin:20px 0 28px; }
    .map-stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
    @media(max-width:700px){ .map-stat-grid{grid-template-columns:1fr 1fr;} }
    .map-stat { background:#ffffff; border:1px solid #d6e8d6; border-radius:16px; padding:20px; position:relative; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
    .map-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
    .map-stat.blue::before { background:linear-gradient(90deg,#3b82f6,transparent); }
    .map-stat.red::before { background:linear-gradient(90deg,#dc2626,transparent); }
    .map-stat.amber::before { background:linear-gradient(90deg,#d97706,transparent); }
    .map-stat.green::before { background:linear-gradient(90deg,#2e8b4a,transparent); }
    .map-stat-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:12px; }
    .map-stat-icon.blue { background:rgba(59,130,246,0.10); }
    .map-stat-icon.red { background:rgba(220,38,38,0.10); }
    .map-stat-icon.amber { background:rgba(217,119,6,0.10); }
    .map-stat-icon.green { background:rgba(46,139,74,0.10); }
    .map-stat-label { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:#8aaa96; margin-bottom:6px; }
    .map-stat-value { font-family:'DM Serif Display',serif; font-size:32px; font-weight:400; line-height:1; }
    .map-stat-value.blue { color:#3b82f6; } .map-stat-value.red { color:#dc2626; } .map-stat-value.amber { color:#d97706; } .map-stat-value.green { color:#2e8b4a; }
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
    .map-legend { padding:16px 20px; border-top:1px solid #eaf2ea; background:#f8fbf8; display:flex; gap:20px; flex-wrap:wrap; }
    .map-legend-item { display:flex; align-items:center; gap:8px; font-size:12px; color:#5a8068; font-family:'DM Mono',monospace; }
    .map-legend-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; }
    .map-province-item { display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eaf2ea; }
    .map-province-item:last-child { border:0; }
    .map-province-rank { width:24px; height:24px; border-radius:8px; background:rgba(46,139,74,0.10); color:#2e8b4a; font-size:11px; font-weight:700; font-family:'DM Mono',monospace; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .map-province-name { font-size:13px; color:#1a3326; margin-left:10px; flex:1; }
    .map-province-count { font-family:'DM Mono',monospace; font-size:12px; background:rgba(46,139,74,0.08); border:1px solid rgba(46,139,74,0.20); border-radius:6px; padding:2px 8px; color:#2e8b4a; }
    .map-recent-item { padding-bottom:12px; border-bottom:1px solid #eaf2ea; margin-bottom:12px; cursor:pointer; border-radius:8px; padding:8px; margin:-8px; transition:background .15s; }
    .map-recent-item:last-child { border:0; margin-bottom:-8px; }
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
`;

// Mobile-friendly detail card shown below map
function MobileDetailCard({ detection, onClose }) {
    if (!detection) return null;
    const severityColors = {
        severe: { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.25)' },
        moderate: { color: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.25)' },
        low: { color: '#2e8b4a', bg: 'rgba(46,139,74,0.08)', border: 'rgba(46,139,74,0.25)' },
    };
    const cfg = severityColors[detection.severity] || severityColors.low;
    return (
        <div style={{ background: '#fff', border: '1px solid #d6e8d6', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', fontFamily: "'Outfit',sans-serif" }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                    <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: '#8aaa96', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Detection Details</div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: cfg.color, textTransform: 'uppercase' }}>
                        {detection.severity}
                    </span>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: '1px solid #d6e8d6', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#8aaa96', fontSize: 12 }}>✕ Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div style={{ background: 'rgba(46,139,74,0.06)', border: '1px solid rgba(46,139,74,0.15)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: '#8aaa96', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Insects</div>
                    <div style={{ fontSize: 22, fontFamily: "'DM Serif Display',serif", color: '#2e8b4a' }}>{detection.total_detections ?? '—'}</div>
                </div>
                <div style={{ background: 'rgba(46,139,74,0.06)', border: '1px solid rgba(46,139,74,0.15)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: '#8aaa96', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Confidence</div>
                    <div style={{ fontSize: 22, fontFamily: "'DM Serif Display',serif", color: '#2e8b4a' }}>{detection.avg_confidence ? `${(detection.avg_confidence * 100).toFixed(1)}%` : '—'}</div>
                </div>
            </div>
            {[detection.barangay, detection.municipality, detection.province].filter(Boolean).length > 0 && (
                <div style={{ fontSize: 13, color: '#1a3326', marginBottom: 6 }}>📍 {[detection.barangay, detection.municipality, detection.province].filter(Boolean).join(', ')}</div>
            )}
            {detection.farmName && <div style={{ fontSize: 13, color: '#5a8068', marginBottom: 4 }}>🌿 {detection.farmName}</div>}
            {detection.farmOwner && <div style={{ fontSize: 13, color: '#5a8068', marginBottom: 4 }}>👤 {detection.farmOwner}</div>}
            {detection.created_date && <div style={{ fontSize: 12, color: '#8aaa96', fontFamily: "'DM Mono',monospace" }}>🕐 {format(new Date(detection.created_date), 'MMM d, yyyy · h:mm a')}</div>}
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

    useEffect(() => {
        const fetchDetections = async () => {
            try {
                const q = query(collection(db, 'detections'), orderBy('created_date', 'desc'), limit(500));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllDetections(data);
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
        return { total, severe, moderate, low, avgInsects };
    }, [filteredDetections]);

    const topProvinces = useMemo(() => {
        const pc = {};
        filteredDetections.forEach(d => { if (d.province) pc[d.province] = (pc[d.province] || 0) + 1; });
        return Object.entries(pc).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [filteredDetections]);

    const recentDetections = useMemo(() => filteredDetections.slice(0, 5), [filteredDetections]);
    const detectionsWithGPS = useMemo(() => filteredDetections.filter(d => d.latitude && d.longitude), [filteredDetections]);
    const mapCenter = useMemo(() => {
        if (!detectionsWithGPS.length) return [12.8797, 121.7740];
        return [
            detectionsWithGPS.reduce((s, d) => s + d.latitude, 0) / detectionsWithGPS.length,
            detectionsWithGPS.reduce((s, d) => s + d.longitude, 0) / detectionsWithGPS.length,
        ];
    }, [detectionsWithGPS]);

    const selectedDetection = useMemo(() => allDetections.find(d => d.id === selectedDetectionId), [allDetections, selectedDetectionId]);

    if (isLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #d6e8d6', borderTopColor: '#2e8b4a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
                    </div>
                </div>
                <div className="map-divider" />

                {/* Stats */}
                <div className="map-stat-grid">
                    {[
                        { label: 'Total Detections', value: stats.total, color: 'blue', icon: <BarChart3 style={{ width: 18, height: 18, color: '#3b82f6' }} /> },
                        { label: 'Severe Cases', value: stats.severe, color: 'red', icon: <AlertTriangle style={{ width: 18, height: 18, color: '#dc2626' }} /> },
                        { label: 'Moderate Cases', value: stats.moderate, color: 'amber', icon: <TrendingUp style={{ width: 18, height: 18, color: '#d97706' }} /> },
                        { label: 'Avg Insects', value: stats.avgInsects, color: 'green', icon: <BarChart3 style={{ width: 18, height: 18, color: '#2e8b4a' }} /> },
                    ].map(s => (
                        <div key={s.label} className={`map-stat ${s.color}`}>
                            <div className={`map-stat-icon ${s.color}`}>{s.icon}</div>
                            <div className="map-stat-label">{s.label}</div>
                            <div className={`map-stat-value ${s.color}`}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="map-card" style={{ marginBottom: 20 }}>
                    <div className="map-card-header">
                        <span className="map-card-title">Filters</span>
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

                {/* Map + Side */}
                <div className="map-main-grid">
                    <div className="map-card">
                        <div className="map-card-header">
                            <span className="map-card-title"><MapPin style={{ width: 15, height: 15, color: '#2e8b4a' }} />Interactive Map View</span>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8aaa96' }}>{detectionsWithGPS.length} locations</span>
                        </div>
                        <div style={{ height: 480, position: 'relative' }}>
                            {detectionsWithGPS.length > 0 ? (
                                <MapContainer center={mapCenter} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
                                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                        subdomains="abcd"
                                    />
                                    <MarkerClusterGroup chunkedLoading>
                                        {detectionsWithGPS.map(d => (
                                            <Marker
                                                key={d.id}
                                                position={[d.latitude, d.longitude]}
                                                icon={createCustomIcon(d.severity, d.id === selectedDetectionId)}
                                                eventHandlers={{ click: () => setSelectedDetectionId(d.id) }}
                                            >
                                                <Popup>
                                                    <div style={{ padding: '6px 2px', minWidth: 160, fontFamily: "'Outfit',sans-serif" }}>
                                                        <span className={`map-severity-pill ${d.severity}`}>{d.severity?.toUpperCase()}</span>
                                                        {d.province && <p style={{ fontWeight: 600, color: '#1a3326', margin: '8px 0 4px', fontSize: 13 }}>{d.province}</p>}
                                                        <p style={{ fontSize: 13, color: '#1a3326', margin: 0 }}><strong style={{ color: '#2e8b4a' }}>{d.total_detections}</strong> insects</p>
                                                        <button
                                                            onClick={() => setSelectedDetectionId(d.id)}
                                                            style={{ marginTop: 8, fontSize: 11, color: '#2e8b4a', background: 'rgba(46,139,74,0.08)', border: '1px solid rgba(46,139,74,0.25)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
                                                        >
                                                            View Details ↓
                                                        </button>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </MarkerClusterGroup>

                                    <MapSearch
                                        detections={detectionsWithGPS}
                                        onSelect={d => setSelectedDetectionId(d.id)}
                                        selectedId={selectedDetectionId}
                                    />

                                    {/* Desktop only detail panel inside map */}
                                    {selectedDetection && (
                                        <div className="desktop-detail-panel">
                                            <DetectionDetailPanel
                                                detection={selectedDetection}
                                                onClose={() => setSelectedDetectionId(null)}
                                            />
                                        </div>
                                    )}
                                </MapContainer>
                            ) : (
                                <div className="map-empty-state">
                                    <div className="map-empty-icon"><Map style={{ width: 24, height: 24, color: '#2e8b4a' }} /></div>
                                    <p style={{ fontWeight: 600, color: '#1a3326', marginBottom: 6 }}>No GPS Data Available</p>
                                    <p style={{ fontSize: 13, color: '#5a8068', maxWidth: 320 }}>No detections with GPS coordinates found. Adjust filters or capture location during detection.</p>
                                </div>
                            )}
                        </div>

                        {/* Mobile detail card — shows BELOW map, not overlapping */}
                        <div className="mobile-detail-panel">
                            {selectedDetection && (
                                <div style={{ padding: '0 16px 16px' }}>
                                    <MobileDetailCard
                                        detection={selectedDetection}
                                        onClose={() => setSelectedDetectionId(null)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="map-legend">
                            {[{ color: '#e05555', label: 'Severe (10+)' }, { color: '#e8a440', label: 'Moderate (5–9)' }, { color: '#4caf72', label: 'Low (1–4)' }].map(l => (
                                <div key={l.label} className="map-legend-item"><div className="map-legend-dot" style={{ background: l.color, boxShadow: `0 0 6px ${l.color}88` }} />{l.label}</div>
                            ))}
                        </div>
                    </div>

                    {/* Side Panel */}
                    <div className="map-side-grid">
                        <div className="map-card">
                            <div className="map-card-header"><span className="map-card-title">Top Affected Provinces</span></div>
                            <div className="map-card-body">
                                {topProvinces.length > 0 ? topProvinces.map(([province, count], idx) => (
                                    <div key={province} className="map-province-item">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div className="map-province-rank">{idx + 1}</div>
                                            <span className="map-province-name">{province}</span>
                                        </div>
                                        <span className="map-province-count">{count}</span>
                                    </div>
                                )) : <p style={{ fontSize: 13, color: '#8aaa96', textAlign: 'center', padding: '16px 0', fontFamily: "'DM Mono',monospace" }}>No province data available</p>}
                            </div>
                        </div>

                        <div className="map-card">
                            <div className="map-card-header"><span className="map-card-title">Recent Detections</span></div>
                            <div className="map-card-body">
                                {recentDetections.length > 0 ? recentDetections.map(d => (
                                    <div key={d.id} className="map-recent-item" onClick={() => setSelectedDetectionId(d.id)}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span className={`map-severity-pill ${d.severity}`}>{d.severity}</span>
                                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#8aaa96' }}>
                                                {d.created_date ? format(new Date(d.created_date), 'MMM d') : '—'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 13, color: '#1a3326', margin: 0 }}>{d.province || 'Unknown'} · {d.total_detections} insects</p>
                                        {d.farmName && <p style={{ fontSize: 11, color: '#8aaa96', margin: '2px 0 0', fontFamily: "'DM Mono',monospace" }}>{d.farmName}</p>}
                                    </div>
                                )) : <p style={{ fontSize: 13, color: '#8aaa96', textAlign: 'center', padding: '16px 0', fontFamily: "'DM Mono',monospace" }}>No recent detections</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}