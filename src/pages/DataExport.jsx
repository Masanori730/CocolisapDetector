import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Download, FileText, FileSpreadsheet, CheckCircle, Info, Layers } from 'lucide-react';
import { format } from 'date-fns';

const PHILIPPINE_PROVINCES = [
    "Abra","Agusan del Norte","Agusan del Sur","Aklan","Albay","Antique","Apayao","Aurora","Basilan","Bataan","Batanes","Batangas","Benguet","Biliran","Bohol","Bukidnon","Bulacan","Cagayan","Camarines Norte","Camarines Sur","Camiguin","Capiz","Catanduanes","Cavite","Cebu","Cotabato","Davao de Oro","Davao del Norte","Davao del Sur","Davao Occidental","Davao Oriental","Dinagat Islands","Eastern Samar","Guimaras","Ifugao","Ilocos Norte","Ilocos Sur","Iloilo","Isabela","Kalinga","La Union","Laguna","Lanao del Norte","Lanao del Sur","Leyte","Maguindanao","Marinduque","Masbate","Metro Manila","Misamis Occidental","Misamis Oriental","Mountain Province","Negros Occidental","Negros Oriental","Northern Samar","Nueva Ecija","Nueva Vizcaya","Occidental Mindoro","Oriental Mindoro","Palawan","Pampanga","Pangasinan","Quezon","Quirino","Rizal","Romblon","Samar","Sarangani","Siquijor","Sorsogon","South Cotabato","Southern Leyte","Sultan Kudarat","Sulu","Surigao del Norte","Surigao del Sur","Tarlac","Tawi-Tawi","Zambales","Zamboanga del Norte","Zamboanga del Sur","Zamboanga Sibugay"
];

const ns = (v) => (v !== undefined && v !== null && v !== '') ? v : 'Not Specified';
const pct = (n, total) => total > 0 ? ((n / total) * 100).toFixed(1) : '0.0';
const avg = (arr, key) => arr.length > 0 ? (arr.reduce((s, d) => s + (d[key] || 0), 0) / arr.length) : 0;

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
    .export-checkbox-row { display:flex; align-items:center; gap:10px; margin-top:16px; cursor:pointer; }
    .export-checkbox { width:18px; height:18px; background:#f8fbf8; border:1px solid #c8dfc8; border-radius:5px; cursor:pointer; accent-color:#2e8b4a; }
    .export-checkbox-label { font-size:13px; color:#5a8068; cursor:pointer; }
    .export-count-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
    @media(max-width:600px){ .export-count-row{grid-template-columns:1fr;} }
    .export-count-box { background:rgba(46,139,74,0.06); border:1px solid rgba(46,139,74,0.18); border-radius:14px; padding:14px 18px; }
    .export-count-text { font-family:'DM Mono',monospace; font-size:12px; color:#5a8068; }
    .export-count-text strong { color:#2e8b4a; font-size:15px; }
    .export-count-label { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#8aaa96; margin-bottom:4px; }
    .export-toast { padding:14px 18px; border-radius:12px; font-family:'DM Mono',monospace; font-size:12px; margin-bottom:20px; display:flex; align-items:center; gap:10px; }
    .export-toast.success { background:rgba(46,139,74,0.08); border:1px solid rgba(46,139,74,0.22); color:#2e8b4a; }
    .export-toast.error { background:rgba(220,38,38,0.07); border:1px solid rgba(220,38,38,0.22); color:#dc2626; }
    .export-options-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
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
    .export-dl-btn.blue { background:#eff6ff; color:#3b82f6; border:1px solid rgba(59,130,246,.25); }
    .export-dl-btn.blue:hover:not(:disabled) { background:#dbeafe; transform:translateY(-1px); }
    .export-dl-btn.purple { background:#f5f3ff; color:#8b5cf6; border:1px solid rgba(139,92,246,.25); }
    .export-dl-btn.purple:hover:not(:disabled) { background:#ede9fe; transform:translateY(-1px); }
    .export-tips { background:#eff8ff; border:1px solid #bfdbfe; border-radius:16px; padding:20px 24px; display:flex; gap:14px; margin-top:24px; }
    .export-tips-icon { flex-shrink:0; margin-top:2px; }
    .export-tips-title { font-size:13px; font-weight:600; color:#3b82f6; margin:0 0 10px; }
    .export-tips-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:5px; }
    .export-tips-list li { font-size:12px; color:#6090c0; font-family:'DM Mono',monospace; }
    .export-footer { border-top:1px solid #d6e8d6; padding-top:24px; margin-top:40px; font-size:11px; color:#8aaa96; font-family:'DM Mono',monospace; display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; }
`;

function downloadText(text, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = filename;
    a.click();
}

function downloadCSV(rows, filename) {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = filename;
    a.click();
}

export default function DataExport() {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [provinceFilter, setProvinceFilter] = useState('all');
    const [riskFilter, setRiskFilter] = useState('all');
    const [includePhotos, setIncludePhotos] = useState(true);
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
        if (dateFrom) f = f.filter(d => new Date(d.created_date) >= new Date(dateFrom));
        if (dateTo) { const end = new Date(dateTo); end.setHours(23, 59, 59, 999); f = f.filter(d => new Date(d.created_date) <= end); }
        return f;
    };

    const filteredDetections = useMemo(() => {
        let f = applyDateFilter(allDetections);
        if (severityFilter !== 'all') f = f.filter(d => d.severity === severityFilter);
        if (provinceFilter !== 'all') f = f.filter(d => d.province === provinceFilter);
        return f;
    }, [allDetections, dateFrom, dateTo, severityFilter, provinceFilter]);

    const filteredAssessments = useMemo(() => {
        let f = applyDateFilter(allAssessments);
        if (riskFilter !== 'all') f = f.filter(a => a.adjusted_risk_label === riskFilter);
        if (provinceFilter !== 'all') f = f.filter(a => a.province === provinceFilter);
        return f;
    }, [allAssessments, dateFrom, dateTo, riskFilter, provinceFilter]);

    const handleDetectionCSV = () => {
        if (!filteredDetections.length) { setExportMessage({ type: 'error', text: 'No image detections match current filters.' }); return; }
        const headers = ['Detection ID', 'Date', 'Time', 'Province', 'Municipality', 'Barangay', 'Farm Name', 'Farm Owner', 'Latitude', 'Longitude', 'Severity', 'Total Insects Detected', 'Average Confidence Score', 'Processing Time (ms)', 'Location Method', 'Notes'];
        if (includePhotos) headers.push('Photo URL');
        const rows = [headers, ...filteredDetections.map(d => {
            const dt = new Date(d.created_date);
            const row = [d.id, format(dt, 'yyyy-MM-dd'), format(dt, 'HH:mm:ss'), ns(d.province), ns(d.municipality), ns(d.barangay), ns(d.farmName), ns(d.farmOwner), ns(d.latitude), ns(d.longitude), d.severity, d.total_detections, d.avg_confidence ? (d.avg_confidence * 100).toFixed(1) + '%' : 'N/A', ns(d.processing_time), ns(d.locationMethod), ns(d.notes)];
            if (includePhotos) row.push(ns(d.image_url));
            return row;
        })];
        downloadCSV(rows, `cocolisap-image-detections-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        setExportMessage({ type: 'success', text: `Exported ${filteredDetections.length} image detections to CSV.` });
    };

    const handleDetectionSummary = () => {
        if (!filteredDetections.length) { setExportMessage({ type: 'error', text: 'No image detections match current filters.' }); return; }
        const d = filteredDetections;
        const total = d.length;
        const severe = d.filter(x => x.severity === 'severe').length;
        const moderate = d.filter(x => x.severity === 'moderate').length;
        const low = d.filter(x => x.severity === 'low').length;
        const avgInsects = avg(d, 'total_detections').toFixed(1);
        const avgConf = (avg(d, 'avg_confidence') * 100).toFixed(1);
        const avgProc = avg(d, 'processing_time').toFixed(0);
        const pc = {};
        d.forEach(x => { if (x.province) pc[x.province] = (pc[x.province] || 0) + 1; });
        const topP = Object.entries(pc).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const dates = d.map(x => new Date(x.created_date)).sort((a, b) => a - b);
        const earliest = format(dates[0], 'MMMM d, yyyy');
        const latest = format(dates[dates.length - 1], 'MMMM d, yyyy');
        const dayCounts = {};
        d.forEach(x => { const day = format(new Date(x.created_date), 'yyyy-MM-dd'); dayCounts[day] = (dayCounts[day] || 0) + 1; });
        const mostActiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
        const rec = severe / total > 0.5 ? 'URGENT — majority of scans show severe infestation. Immediate field intervention required.' : moderate / total > 0.5 ? 'MODERATE RISK — schedule scouting within 1-2 weeks.' : 'LOW RISK — continue regular monitoring schedule.';
        const SEP = `================================================`;
        const SEC = `------------------------------------------------`;
        const txt = [SEP, `  COCOLISAP IMAGE DETECTION REPORT`, `  Powered by YOLOv11 Instance Segmentation`, `  Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}`, `  CocolisapScan Detection System v5.0`, SEP, ``, SEC, `📊 DETECTION STATISTICS`, SEC, `Total Scans Performed       : ${total}`, `Severe Infestations (>=10)  : ${severe} (${pct(severe, total)}%)`, `Moderate Infestations (5-9) : ${moderate} (${pct(moderate, total)}%)`, `Low Infestations (<5)       : ${low} (${pct(low, total)}%)`, `Average Insects per Scan    : ${avgInsects}`, `Average Confidence Score    : ${avgConf}%`, `Average Processing Time     : ${avgProc} ms`, ``, SEC, `📍 TOP AFFECTED PROVINCES`, SEC, ...(topP.length ? topP.map(([p, c], i) => `${i + 1}. ${p} - ${c} detections (${pct(c, total)}%)`) : ['No province data available.']), ``, SEC, `📅 DATE RANGE ANALYSIS`, SEC, `Earliest Detection          : ${earliest}`, `Latest Detection            : ${latest}`, `Most Active Day             : ${mostActiveDay ? format(new Date(mostActiveDay[0]), 'MMMM d, yyyy') + ` (${mostActiveDay[1]} scans)` : 'N/A'}`, ``, SEC, `⚠️ FIELD RECOMMENDATIONS`, SEC, rec, ``, SEP, `  CocolisapScan | Undergraduate Thesis Project`, `  YOLOv11 mAP: 87.4% | Dataset: 1,608 images`, SEP].join('\n');
        downloadText(txt, `cocolisap-image-detection-summary-${format(new Date(), 'yyyy-MM-dd')}.txt`);
        setExportMessage({ type: 'success', text: 'Image detection summary report generated.' });
    };

    const handleFuzzyCSV = () => {
        if (!filteredAssessments.length) { setExportMessage({ type: 'error', text: 'No fuzzy logic assessments match current filters.' }); return; }
        const headers = ['Assessment ID', 'Date', 'Time', 'Province', 'Municipality', 'Barangay', 'Farm Name', 'Farm Owner', 'Latitude', 'Longitude', 'Temperature (°C)', 'Humidity (%)', 'Wind Speed (km/h)', 'Planting Density (trees/ha)', 'Total Trees', 'Days Without Intervention', 'Fuzzy Base Score', 'Fuzzy Base Label', 'Intervention Multiplier', 'Adjusted Risk Score', 'Adjusted Risk Label', 'Degree of Infestation (%)', 'Estimated Infected Trees', 'Estimated Healthy Trees', 'Spread Cone Length (km)', 'Wind Direction', 'Intervention Note'];
        const rows = [headers, ...filteredAssessments.map(a => {
            const dt = new Date(a.created_date);
            return [a.id, format(dt, 'yyyy-MM-dd'), format(dt, 'HH:mm:ss'), ns(a.province), ns(a.municipality), ns(a.barangay), ns(a.farmName), ns(a.farmOwner), ns(a.latitude), ns(a.longitude), a.temperature_c, a.humidity_pct, a.wind_speed_kmh, a.planting_density, a.total_trees, a.days_without_intervention, a.fuzzy_base_score?.toFixed(2), a.fuzzy_base_label, a.intervention_multiplier?.toFixed(4), a.adjusted_risk_score?.toFixed(2), a.adjusted_risk_label, a.degree_of_infestation_pct?.toFixed(2), a.estimated_infected_trees, a.estimated_healthy_trees, ns(a.spread_cone_length_km), a.wind_direction_compass ? `${a.wind_direction_compass} (${a.wind_direction_deg}°)` : 'Not Specified', ns(a.intervention_note)];
        })];
        downloadCSV(rows, `cocolisap-fuzzy-assessments-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        setExportMessage({ type: 'success', text: `Exported ${filteredAssessments.length} fuzzy logic assessments to CSV.` });
    };

    const handleFuzzySummary = () => {
        if (!filteredAssessments.length) { setExportMessage({ type: 'error', text: 'No fuzzy logic assessments match current filters.' }); return; }
        const a = filteredAssessments;
        const total = a.length;
        const high = a.filter(x => x.adjusted_risk_label === 'HIGH').length;
        const moderate = a.filter(x => x.adjusted_risk_label === 'MODERATE').length;
        const low = a.filter(x => x.adjusted_risk_label === 'LOW').length;
        const totalTrees = a.reduce((s, x) => s + (x.total_trees || 0), 0);
        const totalInfected = a.reduce((s, x) => s + (x.estimated_infected_trees || 0), 0);
        const totalHealthy = a.reduce((s, x) => s + (x.estimated_healthy_trees || 0), 0);
        const pc = {};
        a.filter(x => x.adjusted_risk_label === 'HIGH').forEach(x => { if (x.province) pc[x.province] = (pc[x.province] || 0) + 1; });
        const topP = Object.entries(pc).sort((b1, b2) => b2[1] - b1[1]).slice(0, 3);
        const rec = high / total > 0.5 ? 'CRITICAL — majority of assessments indicate HIGH risk. Coordinate immediate farm-wide response with LGU.' : moderate / total > 0.5 ? 'ELEVATED RISK — schedule PCA field inspection within 2-4 weeks.' : 'MANAGEABLE — continue quarterly monitoring of coconut farms.';
        const SEP = `================================================`;
        const SEC = `------------------------------------------------`;
        const txt = [SEP, `  COCOLISAP FUZZY LOGIC ASSESSMENT REPORT`, `  Powered by Mamdani 81-Rule Inference`, `  Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}`, `  CocolisapScan Expert System v5.0`, SEP, ``, SEC, `🧠 FUZZY LOGIC ASSESSMENT SUMMARY`, SEC, `Total Assessments Performed  : ${total}`, `HIGH Risk Assessments        : ${high} (${pct(high, total)}%)`, `MODERATE Risk Assessments    : ${moderate} (${pct(moderate, total)}%)`, `LOW Risk Assessments         : ${low} (${pct(low, total)}%)`, `Average Fuzzy Base Score     : ${avg(a, 'fuzzy_base_score').toFixed(2)}%`, `Average Adjusted Risk Score  : ${avg(a, 'adjusted_risk_score').toFixed(2)}%`, `Average Infestation Degree   : ${avg(a, 'degree_of_infestation_pct').toFixed(2)}%`, ``, SEC, `🌾 FARM IMPACT ANALYSIS`, SEC, `Total Trees Assessed         : ${totalTrees.toLocaleString()}`, `Estimated Infected Trees     : ${totalInfected.toLocaleString()} (${pct(totalInfected, totalTrees)}%)`, `Estimated Healthy Trees      : ${totalHealthy.toLocaleString()} (${pct(totalHealthy, totalTrees)}%)`, ``, SEC, `🌤️ AVERAGE ENVIRONMENTAL CONDITIONS`, SEC, `Average Temperature          : ${avg(a, 'temperature_c').toFixed(1)}°C`, `Average Humidity             : ${avg(a, 'humidity_pct').toFixed(1)}%`, `Average Wind Speed           : ${avg(a, 'wind_speed_kmh').toFixed(1)} km/h`, `Average Planting Density     : ${avg(a, 'planting_density').toFixed(1)} trees/ha`, ``, SEC, `📍 TOP HIGH-RISK PROVINCES`, SEC, ...(topP.length ? topP.map(([p, c], i) => `${i + 1}. ${p} - ${c} HIGH risk assessments`) : ['No high-risk province data available.']), ``, SEC, `🚨 PCA INTERVENTION RECOMMENDATIONS`, SEC, rec, ``, SEP, `  CocolisapScan | Undergraduate Thesis Project`, `  Mamdani Fuzzy Inference System | Rules: 81 | Variables: 4 inputs, 1 output`, SEP].join('\n');
        downloadText(txt, `cocolisap-fuzzy-assessment-summary-${format(new Date(), 'yyyy-MM-dd')}.txt`);
        setExportMessage({ type: 'success', text: 'Fuzzy logic assessment summary generated.' });
    };

    const handleCombinedSummary = () => {
        if (!filteredDetections.length && !filteredAssessments.length) { setExportMessage({ type: 'error', text: 'No data available for combined report.' }); return; }
        const d = filteredDetections, a = filteredAssessments;
        const dTotal = d.length, aTotal = a.length;
        const severe = d.filter(x => x.severity === 'severe').length;
        const moderate = d.filter(x => x.severity === 'moderate').length;
        const low = d.filter(x => x.severity === 'low').length;
        const high = a.filter(x => x.adjusted_risk_label === 'HIGH').length;
        const aModerate = a.filter(x => x.adjusted_risk_label === 'MODERATE').length;
        const aLow = a.filter(x => x.adjusted_risk_label === 'LOW').length;
        const totalInfected = a.reduce((s, x) => s + (x.estimated_infected_trees || 0), 0);
        const totalHealthy = a.reduce((s, x) => s + (x.estimated_healthy_trees || 0), 0);
        const provData = {};
        d.forEach(x => { if (x.province) { provData[x.province] = provData[x.province] || { det: 0, high: 0 }; provData[x.province].det++; } });
        a.filter(x => x.adjusted_risk_label === 'HIGH').forEach(x => { if (x.province) { provData[x.province] = provData[x.province] || { det: 0, high: 0 }; provData[x.province].high++; } });
        const topP = Object.entries(provData).sort((x, y) => (y[1].det + y[1].high) - (x[1].det + x[1].high)).slice(0, 3);
        const combinedRec = [];
        if (dTotal > 0 && severe / dTotal > 0.5) combinedRec.push('URGENT — majority of image scans show severe infestation. Immediate visual field inspection required.');
        if (aTotal > 0 && high / aTotal > 0.5) combinedRec.push('CRITICAL — fuzzy logic assessments indicate HIGH risk dominance. Coordinate rapid LGU response.');
        if (!combinedRec.length && dTotal > 0 && moderate / dTotal > 0.5) combinedRec.push('MODERATE RISK — schedule combined scouting and farm assessment within 1-2 weeks.');
        if (!combinedRec.length) combinedRec.push('MANAGEABLE — continue regular monitoring. Maintain quarterly inspections and early detection protocols.');
        const SEP = `================================================`;
        const SEC = `------------------------------------------------`;
        const txt = [SEP, `  COCOLISAP INTEGRATED MONITORING REPORT`, `  YOLOv11 Detection + Mamdani Fuzzy Inference`, `  Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}`, `  CocolisapScan Integrated Monitoring System v5.0`, SEP, ``, SEC, `📸 IMAGE DETECTION SUMMARY`, SEC, `Total Scans              : ${dTotal}`, `Severe Infestations      : ${severe} (${pct(severe, dTotal)}%)`, `Moderate Infestations    : ${moderate} (${pct(moderate, dTotal)}%)`, `Low Infestations         : ${low} (${pct(low, dTotal)}%)`, `Avg Insects per Scan     : ${dTotal > 0 ? avg(d, 'total_detections').toFixed(1) : 'N/A'}`, `Avg Confidence Score     : ${dTotal > 0 ? (avg(d, 'avg_confidence') * 100).toFixed(1) + '%' : 'N/A'}`, ``, SEC, `🧠 FUZZY LOGIC ASSESSMENT SUMMARY`, SEC, `Total Assessments        : ${aTotal}`, `HIGH Risk                : ${high} (${pct(high, aTotal)}%)`, `MODERATE Risk            : ${aModerate} (${pct(aModerate, aTotal)}%)`, `LOW Risk                 : ${aLow} (${pct(aLow, aTotal)}%)`, `Avg Fuzzy Score          : ${aTotal > 0 ? avg(a, 'fuzzy_base_score').toFixed(2) + '%' : 'N/A'}`, `Est. Total Infected Trees: ${totalInfected.toLocaleString()}`, `Est. Total Healthy Trees : ${totalHealthy.toLocaleString()}`, ``, SEC, `📍 TOP AFFECTED PROVINCES`, SEC, ...(topP.length ? topP.map(([p, v], i) => `${i + 1}. ${p} - ${v.det} detections, ${v.high} HIGH risk`) : ['No province data available.']), ``, SEC, `🌤️ ENVIRONMENTAL CONDITIONS`, SEC, `Avg Temperature          : ${aTotal > 0 ? avg(a, 'temperature_c').toFixed(1) + '°C' : 'N/A'}`, `Avg Humidity             : ${aTotal > 0 ? avg(a, 'humidity_pct').toFixed(1) + '%' : 'N/A'}`, `Avg Wind Speed           : ${aTotal > 0 ? avg(a, 'wind_speed_kmh').toFixed(1) + ' km/h' : 'N/A'}`, `Avg Planting Density     : ${aTotal > 0 ? avg(a, 'planting_density').toFixed(1) + ' trees/ha' : 'N/A'}`, ``, SEC, `🚨 INTEGRATED RECOMMENDATIONS`, SEC, ...combinedRec, ``, SEP, `  CocolisapScan | Undergraduate Thesis Project`, `  YOLOv11 mAP: 87.4% | Fuzzy Rules: 81`, SEP].join('\n');
        downloadText(txt, `cocolisap-integrated-report-${format(new Date(), 'yyyy-MM-dd')}.txt`);
        setExportMessage({ type: 'success', text: 'Integrated monitoring report generated.' });
    };

    return (
        <div className="export-root">
            <style>{exportStyles}</style>
            <div className="export-page">
                <div className="export-badge">Data Export</div>
                <h1 className="export-h1">Export <em>Detection</em> Data</h1>
                <p className="export-sub">Download detection records and fuzzy logic assessments for reporting and analysis</p>
                <div className="export-divider" />

                <div className="export-card">
                    <span className="export-sec-label">Filter Criteria — applied to all exports</span>
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                    <label className="export-checkbox-row">
                        <input type="checkbox" className="export-checkbox" checked={includePhotos} onChange={e => setIncludePhotos(e.target.checked)} />
                        <span className="export-checkbox-label">Include photo URLs in image detection CSV</span>
                    </label>
                </div>

                <div className="export-count-row">
                    <div className="export-count-box">
                        <div className="export-count-label">Image Detections</div>
                        <span className="export-count-text"><strong>{filteredDetections.length}</strong> record{filteredDetections.length !== 1 ? 's' : ''} matched</span>
                    </div>
                    <div className="export-count-box">
                        <div className="export-count-label">Fuzzy Assessments</div>
                        <span className="export-count-text"><strong>{filteredAssessments.length}</strong> record{filteredAssessments.length !== 1 ? 's' : ''} matched</span>
                    </div>
                </div>

                {exportMessage && (
                    <div className={`export-toast ${exportMessage.type}`}>
                        <CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                        {exportMessage.text}
                    </div>
                )}

                <div className="export-options-grid">
                    <div className="export-option-card green">
                        <div className="export-option-icon green"><FileSpreadsheet style={{ width: 22, height: 22, color: '#2e8b4a' }} /></div>
                        <h3 className="export-option-title">Image Detection</h3>
                        <p className="export-option-sub">YOLOv11 · Instance Segmentation</p>
                        <p className="export-option-desc">Export all image scan records with location, severity, confidence scores, and optional photo URLs.</p>
                        <div className="export-btn-row">
                            <button className="export-dl-btn green" onClick={handleDetectionCSV} disabled={!filteredDetections.length}><FileSpreadsheet style={{ width: 15, height: 15 }} />Download CSV</button>
                            <button className="export-dl-btn blue" onClick={handleDetectionSummary} disabled={!filteredDetections.length}><FileText style={{ width: 15, height: 15 }} />Download Summary TXT</button>
                        </div>
                    </div>

                    <div className="export-option-card blue">
                        <div className="export-option-icon blue"><FileSpreadsheet style={{ width: 22, height: 22, color: '#3b82f6' }} /></div>
                        <h3 className="export-option-title">Fuzzy Logic Assessment</h3>
                        <p className="export-option-sub">Mamdani · 81-Rule Inference</p>
                        <p className="export-option-desc">Export fuzzy logic risk assessments with environmental parameters, farm impact, and PCA intervention notes.</p>
                        <div className="export-btn-row">
                            <button className="export-dl-btn green" onClick={handleFuzzyCSV} disabled={!filteredAssessments.length}><FileSpreadsheet style={{ width: 15, height: 15 }} />Download CSV</button>
                            <button className="export-dl-btn blue" onClick={handleFuzzySummary} disabled={!filteredAssessments.length}><FileText style={{ width: 15, height: 15 }} />Download Summary TXT</button>
                        </div>
                    </div>

                    <div className="export-option-card purple">
                        <div className="export-option-icon purple"><Layers style={{ width: 22, height: 22, color: '#8b5cf6' }} /></div>
                        <h3 className="export-option-title">Combined Summary</h3>
                        <p className="export-option-sub">Integrated · Detection + Fuzzy</p>
                        <p className="export-option-desc">Generate a unified monitoring report combining image detection and fuzzy logic data with integrated recommendations.</p>
                        <div className="export-btn-row">
                            <button className="export-dl-btn purple" onClick={handleCombinedSummary} disabled={!filteredDetections.length && !filteredAssessments.length}><FileText style={{ width: 15, height: 15 }} />Download Combined Report</button>
                        </div>
                    </div>
                </div>

                <div className="export-tips">
                    <div className="export-tips-icon"><Info style={{ width: 18, height: 18, color: '#3b82f6' }} /></div>
                    <div>
                        <p className="export-tips-title">Usage Tips</p>
                        <ul className="export-tips-list">
                            <li>· CSV exports are ideal for data analysis in Excel or Google Sheets</li>
                            <li>· Summary TXT reports are formatted for government documentation and briefings</li>
                            <li>· The Combined Report merges both datasets for a full integrated overview</li>
                            <li>· Use date and province filters to generate targeted regional reports</li>
                            <li>· Fuzzy Logic assessments are saved automatically after each analysis</li>
                        </ul>
                    </div>
                </div>

                <div className="export-footer">
                    <span>Cocolisap Detection System · Data Export Module</span>
                    <span>Built for coconut pest management research</span>
                </div>
            </div>
        </div>
    );
}