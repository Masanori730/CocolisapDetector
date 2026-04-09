import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScanSearch, Map, FlaskConical, Download, ArrowRight, ShieldAlert, Wind, Thermometer, TreePine } from 'lucide-react';

const homeStyles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap');
    .landing-root { background: #f4f7f4; min-height: 100vh; color: #1a3326; font-family: 'Outfit', sans-serif; overflow-x: hidden; }
    .landing-root::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0; background: radial-gradient(ellipse 80% 60% at 20% 10%, rgba(46,139,74,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(46,139,74,0.05) 0%, transparent 55%); }
    .landing-hero { position:relative; z-index:1; max-width:900px; margin:0 auto; padding:80px 24px 64px; text-align:center; }
    .landing-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(46,139,74,0.10); border:1px solid rgba(46,139,74,0.28); border-radius:100px; padding:6px 16px; font-family:'DM Mono',monospace; font-size:11px; letter-spacing:.1em; color:#2e8b4a; text-transform:uppercase; margin-bottom:24px; }
    .landing-badge-dot { width:7px; height:7px; border-radius:50%; background:#2e8b4a; box-shadow:0 0 8px rgba(46,139,74,0.6); animation:l-pulse 2s ease-in-out infinite; flex-shrink:0; }
    @keyframes l-pulse { 0%,100%{opacity:1}50%{opacity:.3} }
    @keyframes l-fadein { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
    .landing-h1 { font-family:'DM Serif Display',serif; font-size:clamp(36px,6vw,64px); font-weight:400; line-height:1.08; color:#1a3326; letter-spacing:-.03em; margin:0 0 20px; }
    .landing-h1 em { font-style:italic; color:#2e8b4a; }
    .landing-sub { font-size:16px; color:#5a8068; line-height:1.7; max-width:560px; margin:0 auto 40px; }
    .landing-cta-row { display:flex; align-items:center; justify-content:center; gap:14px; flex-wrap:wrap; }
    .landing-cta-primary { display:inline-flex; align-items:center; gap:8px; padding:14px 32px; background:#2e8b4a; color:#fff; border:none; border-radius:14px; font-family:'Outfit',sans-serif; font-size:15px; font-weight:600; letter-spacing:.03em; cursor:pointer; text-decoration:none; transition:background .2s,transform .15s,box-shadow .2s; }
    .landing-cta-primary:hover { background:#25763e; transform:translateY(-2px); box-shadow:0 8px 24px rgba(46,139,74,.30); }
    .landing-cta-secondary { display:inline-flex; align-items:center; gap:8px; padding:14px 28px; background:transparent; color:#5a8068; border:1px solid #c8dfc8; border-radius:14px; font-family:'Outfit',sans-serif; font-size:15px; font-weight:500; cursor:pointer; text-decoration:none; transition:background .2s,color .2s,border-color .2s; }
    .landing-cta-secondary:hover { background:rgba(46,139,74,0.07); color:#1a3326; border-color:rgba(46,139,74,0.4); }
    .landing-divider { height:1px; background:linear-gradient(90deg,transparent,rgba(46,139,74,0.25),transparent); margin:64px 0; }
    .landing-section { position:relative; z-index:1; max-width:1100px; margin:0 auto; padding:0 24px; }
    .landing-section-label { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.16em; color:#8aaa96; text-transform:uppercase; text-align:center; margin-bottom:12px; }
    .landing-section-title { font-family:'DM Serif Display',serif; font-size:clamp(26px,4vw,38px); font-weight:400; color:#1a3326; text-align:center; margin:0 0 8px; letter-spacing:-.02em; }
    .landing-section-title em { font-style:italic; color:#2e8b4a; }
    .landing-section-sub { font-size:14px; color:#5a8068; text-align:center; margin:0 auto 48px; max-width:500px; line-height:1.6; }
    .landing-features-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; }
    @media(max-width:700px){ .landing-features-grid { grid-template-columns:1fr; } }
    .landing-feature-card { background:#ffffff; border:1px solid #d6e8d6; border-radius:20px; padding:28px 28px 24px; position:relative; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,0.05); text-decoration:none; color:inherit; display:block; transition:transform .2s,box-shadow .2s; }
    .landing-feature-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.10); }
    .landing-feature-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
    .landing-feature-card.green::before { background:linear-gradient(90deg,#2e8b4a,transparent); }
    .landing-feature-card.blue::before { background:linear-gradient(90deg,#3b82f6,transparent); }
    .landing-feature-card.amber::before { background:linear-gradient(90deg,#d97706,transparent); }
    .landing-feature-card.purple::before { background:linear-gradient(90deg,#8b5cf6,transparent); }
    .landing-feature-icon { width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; margin-bottom:16px; }
    .landing-feature-icon.green { background:rgba(46,139,74,0.10); }
    .landing-feature-icon.blue { background:rgba(59,130,246,0.10); }
    .landing-feature-icon.amber { background:rgba(217,119,6,0.10); }
    .landing-feature-icon.purple { background:rgba(139,92,246,0.10); }
    .landing-feature-title { font-size:16px; font-weight:600; color:#1a3326; margin:0 0 6px; }
    .landing-feature-desc { font-size:13px; color:#5a8068; line-height:1.6; margin:0 0 16px; }
    .landing-feature-link { display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; letter-spacing:.04em; }
    .landing-feature-link.green { color:#2e8b4a; }
    .landing-feature-link.blue { color:#3b82f6; }
    .landing-feature-link.amber { color:#d97706; }
    .landing-feature-link.purple { color:#8b5cf6; }
    .landing-about-grid { display:grid; grid-template-columns:1fr 1fr; gap:32px; align-items:center; }
    @media(max-width:700px){ .landing-about-grid { grid-template-columns:1fr; } }
    .landing-about-card { background:#ffffff; border:1px solid #d6e8d6; border-radius:20px; padding:36px; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
    .landing-about-title { font-family:'DM Serif Display',serif; font-size:26px; font-weight:400; color:#1a3326; margin:0 0 14px; letter-spacing:-.02em; }
    .landing-about-title em { font-style:italic; color:#2e8b4a; }
    .landing-about-text { font-size:14px; color:#5a8068; line-height:1.8; margin:0 0 16px; }
    .landing-stat-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:20px; }
    .landing-stat-box { background:#f4f7f4; border:1px solid #d6e8d6; border-radius:14px; padding:16px; }
    .landing-stat-num { font-family:'DM Serif Display',serif; font-size:28px; color:#2e8b4a; line-height:1; margin-bottom:4px; }
    .landing-stat-label { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:#8aaa96; }
    .landing-env-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
    @media(max-width:700px){ .landing-env-grid { grid-template-columns:1fr 1fr; } }
    .landing-env-item { background:#ffffff; border:1px solid #d6e8d6; border-radius:14px; padding:20px 16px; text-align:center; box-shadow:0 1px 4px rgba(0,0,0,0.04); }
    .landing-env-icon { width:40px; height:40px; border-radius:12px; background:rgba(46,139,74,0.08); border:1px solid rgba(46,139,74,0.15); display:flex; align-items:center; justify-content:center; margin:0 auto 10px; }
    .landing-env-label { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.1em; text-transform:uppercase; color:#8aaa96; margin-bottom:4px; }
    .landing-env-val { font-family:'DM Mono',monospace; font-size:13px; color:#2e8b4a; font-weight:500; }
    .landing-footer { position:relative; z-index:1; border-top:1px solid #d6e8d6; padding:28px 24px; margin-top:80px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; max-width:1100px; margin-left:auto; margin-right:auto; }
    .landing-footer-text { font-size:11px; color:#8aaa96; font-family:'DM Mono',monospace; }

    /* ── METRICS SECTION ── */
    .lm-metrics-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:40px; }
    @media(max-width:700px){ .lm-metrics-grid { grid-template-columns:1fr 1fr; } }
    .lm-metric-card { background:#fff; border:1px solid #d6e8d6; border-radius:18px; padding:22px 20px; text-align:center; box-shadow:0 1px 6px rgba(0,0,0,0.05); position:relative; overflow:hidden; }
    .lm-metric-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg,#2e8b4a,#6fcf8a); }
    .lm-metric-val { font-family:'DM Serif Display',serif; font-size:36px; color:#2e8b4a; line-height:1; margin-bottom:6px; }
    .lm-metric-label { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:#8aaa96; }
    .lm-metric-sub { font-size:11px; color:#a8c4b0; margin-top:4px; font-family:'DM Mono',monospace; }
    .lm-charts-row { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
    @media(max-width:800px){ .lm-charts-row { grid-template-columns:1fr; } }
    .lm-chart-card { background:#fff; border:1px solid #d6e8d6; border-radius:18px; padding:24px; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
    .lm-chart-title { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#8aaa96; margin-bottom:4px; }
    .lm-chart-subtitle { font-size:13px; color:#5a8068; margin-bottom:20px; }

    /* Training Chart */
    .lm-training-chart { width:100%; height:200px; position:relative; }
    .lm-chart-svg { width:100%; height:100%; }
    .lm-chart-legend { display:flex; gap:16px; margin-top:12px; }
    .lm-legend-item { display:flex; align-items:center; gap:6px; font-family:'DM Mono',monospace; font-size:10px; color:#8aaa96; }
    .lm-legend-dot { width:10px; height:3px; border-radius:2px; }

    /* Confusion Matrix */
    .lm-cm-wrap { display:flex; flex-direction:column; align-items:center; gap:8px; }
    .lm-cm-grid { display:grid; grid-template-columns:1fr 1fr; gap:4px; width:100%; max-width:280px; }
    .lm-cm-cell { border-radius:10px; padding:16px 12px; text-align:center; }
    .lm-cm-cell-num { font-family:'DM Serif Display',serif; font-size:24px; line-height:1; margin-bottom:4px; }
    .lm-cm-cell-label { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.1em; text-transform:uppercase; }
    .lm-cm-tp { background:#1a6b8a; color:#fff; }
    .lm-cm-fp { background:#f4b8cc; color:#6b1a35; }
    .lm-cm-fn { background:#f4b8cc; color:#6b1a35; }
    .lm-cm-tn { background:#f0f0f0; color:#888; }
    .lm-cm-axis-row { display:flex; gap:4px; width:100%; max-width:280px; }
    .lm-cm-axis-label { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.1em; text-transform:uppercase; color:#8aaa96; text-align:center; flex:1; }
    .lm-cm-row-labels { display:flex; flex-direction:column; gap:4px; margin-right:8px; justify-content:space-around; }
    .lm-cm-row-label { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.1em; text-transform:uppercase; color:#8aaa96; writing-mode:horizontal-tb; }
    .lm-cm-outer { display:flex; align-items:center; }
`;

// Training data approximated from the graph screenshot
const trainingData = [
  [1,53,20],[3,47,17],[5,65,26],[6,65,27],[7,70,27],[8,68,26],[9,70,28],
  [10,80,30],[11,80,32],[12,82,34],[13,83,35],[14,84,36],[15,85,37],[16,87,38],
  [17,89,39],[18,90,40],[19,90,41],[20,91,42],[21,91,43],[22,91,44],[23,92,45],
  [24,92,46],[25,92,47],[26,92,48],[27,93,49],[28,93,49],[30,93,50],[32,93,51],
  [34,93,52],[35,93,52],[36,94,53],[37,94,57],[38,94,57],[40,94,57],[42,94,58],
  [44,94,58],[46,94,59],[48,94,60],[50,94,60],[52,94,61],[54,94,61],[56,94,62],
  [58,94,62],[60,94,62],[62,94,63],[64,94,63],[66,94,63],[68,94,64],[70,94,64],
  [72,94,64],[74,94,64],[76,94,65],[78,95,65],[80,95,65],[82,95,65],[84,95,65],[85,95,65],
];

function TrainingChart() {
  const W = 400, H = 180, PL = 36, PR = 12, PT = 10, PB = 28;
  const chartW = W - PL - PR, chartH = H - PT - PB;
  const maxEpoch = 85, minY = 10, maxY = 100;

  const toX = ep => PL + ((ep - 1) / (maxEpoch - 1)) * chartW;
  const toY = val => PT + chartH - ((val - minY) / (maxY - minY)) * chartH;

  const mapPath = trainingData.map(([e, m], i) => `${i === 0 ? 'M' : 'L'}${toX(e).toFixed(1)},${toY(m).toFixed(1)}`).join(' ');
  const map5095Path = trainingData.map(([e, , m], i) => `${i === 0 ? 'M' : 'L'}${toX(e).toFixed(1)},${toY(m).toFixed(1)}`).join(' ');

  // Y axis ticks
  const yTicks = [20, 40, 60, 80, 100];
  const xTicks = [1, 20, 40, 60, 85];

  return (
    <div className="lm-training-chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="lm-chart-svg" preserveAspectRatio="none">
        {/* Grid lines */}
        {yTicks.map(v => (
          <line key={v} x1={PL} y1={toY(v)} x2={W - PR} y2={toY(v)}
            stroke="rgba(46,139,74,0.08)" strokeWidth="1" />
        ))}
        {/* Y axis labels */}
        {yTicks.map(v => (
          <text key={v} x={PL - 4} y={toY(v) + 3} textAnchor="end"
            fill="#8aaa96" fontSize="8" fontFamily="DM Mono, monospace">{v}%</text>
        ))}
        {/* X axis labels */}
        {xTicks.map(v => (
          <text key={v} x={toX(v)} y={H - 4} textAnchor="middle"
            fill="#8aaa96" fontSize="8" fontFamily="DM Mono, monospace">{v}</text>
        ))}
        {/* mAP@50:95 line */}
        <path d={map5095Path} fill="none" stroke="#c8dfc8" strokeWidth="2" strokeLinejoin="round" />
        {/* mAP line */}
        <path d={mapPath} fill="none" stroke="#2e8b4a" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
      <div className="lm-chart-legend">
        <div className="lm-legend-item">
          <div className="lm-legend-dot" style={{ background: '#2e8b4a' }} /> mAP@50
        </div>
        <div className="lm-legend-item">
          <div className="lm-legend-dot" style={{ background: '#c8dfc8' }} /> mAP@50:95
        </div>
      </div>
    </div>
  );
}

function ConfusionMatrix() {
  return (
    <div className="lm-cm-wrap">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8aaa96', marginRight: 4 }}>
          Actual
        </div>
        <div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 4, paddingLeft: 0 }}>
            <div style={{ flex: 1, fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8aaa96', textAlign: 'center' }}>Predicted +</div>
            <div style={{ flex: 1, fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8aaa96', textAlign: 'center' }}>Predicted −</div>
          </div>
          <div className="lm-cm-grid">
            <div className="lm-cm-cell lm-cm-tp">
              <div className="lm-cm-cell-num">12,811</div>
              <div className="lm-cm-cell-label">True Positive</div>
            </div>
            <div className="lm-cm-cell lm-cm-fp">
              <div className="lm-cm-cell-num">2,014</div>
              <div className="lm-cm-cell-label">False Positive</div>
            </div>
            <div className="lm-cm-cell lm-cm-fn">
              <div className="lm-cm-cell-num">542</div>
              <div className="lm-cm-cell-label">False Negative</div>
            </div>
            <div className="lm-cm-cell lm-cm-tn">
              <div className="lm-cm-cell-num">0</div>
              <div className="lm-cm-cell-label">True Negative</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            <div style={{ flex: 1, fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#8aaa96', textAlign: 'center' }}>Actual +</div>
            <div style={{ flex: 1, fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#8aaa96', textAlign: 'center' }}>Actual −</div>
          </div>
        </div>
      </div>
      <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#8aaa96', textAlign: 'center', margin: '8px 0 0', lineHeight: 1.5 }}>
        TN = 0 expected for single-class detection
      </p>
    </div>
  );
}

const features = [
  {
    color: 'green',
    icon: <ScanSearch style={{ width: 22, height: 22, color: '#2e8b4a' }} />,
    title: 'AI Image Detection',
    desc: 'Upload a photo of a coconut leaf to detect cocolisap insects. The system counts the insects and tells you if the infestation is low, moderate, or severe.',
    link: '/ImageDetection',
    linkLabel: 'Start Detection',
  },
  {
    color: 'blue',
    icon: <Map style={{ width: 22, height: 22, color: '#3b82f6' }} />,
    title: 'Map Dashboard',
    desc: 'See all detections on a map. Shows where infestations have been found across the Philippines.',
    link: '/MapDashboard',
    linkLabel: 'View Map',
  },
  {
    color: 'amber',
    icon: <FlaskConical style={{ width: 22, height: 22, color: '#d97706' }} />,
    title: 'Fuzzy Logic Analyzer',
    desc: 'Assess infestation risk using an 81-rule Mamdani inference system with live weather data and spread cone visualization.',
    link: '/FuzzyLogic',
    linkLabel: 'Run Assessment',
  },
  {
    color: 'purple',
    icon: <Download style={{ width: 22, height: 22, color: '#8b5cf6' }} />,
    title: 'Data Export',
    desc: 'Download detection records and assessment results as Excel or text files for reporting and documentation.',
    link: '/DataExport',
    linkLabel: 'Export Data',
  },
];

const envFactors = [
  { icon: <Thermometer style={{ width: 18, height: 18, color: '#2e8b4a' }} />, label: 'Temperature', val: '20–35 °C' },
  { icon: <Wind style={{ width: 18, height: 18, color: '#2e8b4a' }} />, label: 'Humidity', val: '65–74 %' },
  { icon: <Wind style={{ width: 18, height: 18, color: '#2e8b4a' }} />, label: 'Wind Speed', val: '11–24 km/h' },
  { icon: <TreePine style={{ width: 18, height: 18, color: '#2e8b4a' }} />, label: 'Density', val: '100–130 /ha' },
];

export default function Home() {
  return (
    <div className="landing-root">
      <style>{homeStyles}</style>

      {/* Hero */}
      <motion.div className="landing-hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="landing-badge">
          <span className="landing-badge-dot" />
          Aspidiotus rigidus · Philippine Coconut Farms
        </div>
        <h1 className="landing-h1">
          Cocolisap<em>Scan</em>
        </h1>
        <p className="landing-sub">
          A detection and monitoring system for coconut scale insect infestations
          using YOLOv26 instance segmentation and an 81-rule Mamdani fuzzy logic system.
        </p>
        <div className="landing-cta-row">
          <Link to="/ImageDetection" className="landing-cta-primary">
            Start Detection
            <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
          <Link to="/MapDashboard" className="landing-cta-secondary">
            View Map Dashboard
          </Link>
        </div>
      </motion.div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div className="landing-divider" />
      </div>

      {/* Features */}
      <motion.div className="landing-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
        <p className="landing-section-label">Platform Features</p>
        <h2 className="landing-section-title">Everything you need to <em>monitor</em> infestations</h2>
        <p className="landing-section-sub">Four integrated tools working together to give a complete picture of Cocolisap spread and risk.</p>
        <div className="landing-features-grid">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.07 }}>
              <Link to={f.link} className={`landing-feature-card ${f.color}`}>
                <div className={`landing-feature-icon ${f.color}`}>{f.icon}</div>
                <h3 className="landing-feature-title">{f.title}</h3>
                <p className="landing-feature-desc">{f.desc}</p>
                <span className={`landing-feature-link ${f.color}`}>
                  {f.linkLabel} <ArrowRight style={{ width: 13, height: 13 }} />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div className="landing-divider" />
      </div>

      {/* Model Performance Section */}
      <motion.div className="landing-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
        <p className="landing-section-label">Model Performance</p>
        <h2 className="landing-section-title">YOLOv26 <em>Detection</em> Metrics</h2>
        <p className="landing-section-sub">Trained on 8,658 annotated images of <em>Aspidiotus rigidus</em> across 85 epochs — 7,569 train · 730 validation · 362 test — using instance segmentation.</p>

        {/* Metric Cards */}
        <div className="lm-metrics-grid">
          {[
            { val: '90.0%', label: 'mAP@50', sub: 'Mean Avg. Precision' },
            { val: '95.9%', label: 'Precision', sub: 'Positive predictive value' },
            { val: '86.4%', label: 'Recall', sub: 'True positive rate' },
            { val: '91.0%', label: 'F1 Score', sub: 'Harmonic mean P & R' },
          ].map(m => (
            <div key={m.label} className="lm-metric-card">
              <div className="lm-metric-val">{m.val}</div>
              <div className="lm-metric-label">{m.label}</div>
              <div className="lm-metric-sub">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="lm-charts-row">
          <div className="lm-chart-card">
            <div className="lm-chart-title">Training Curve</div>
            <div className="lm-chart-subtitle">mAP over 85 training epochs</div>
            <TrainingChart />
          </div>
          <div className="lm-chart-card">
            <div className="lm-chart-title">Confusion Matrix</div>
            <div className="lm-chart-subtitle">Prediction outcomes on test set</div>
            <ConfusionMatrix />
          </div>
        </div>
      </motion.div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div className="landing-divider" />
      </div>

      {/* About / Environmental Factors */}
      <motion.div className="landing-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
        <div className="landing-about-grid">
          <div className="landing-about-card">
            <h3 className="landing-about-title">About <em>Cocolisap</em></h3>
            <p className="landing-about-text">
              <em>Aspidiotus rigidus</em> Reyne (Hemiptera: Diaspididae), locally known as <em>Cocolisap</em>,
              is an armored scale insect that feeds exclusively on coconut palms (<em>Cocos nucifera</em>).
              It was first recorded as a major pest in the Philippines in 2009, triggering a nationwide
              outbreak that devastated coconut-farming communities across Laguna, Quezon, and neighboring provinces.
            </p>
            <p className="landing-about-text">
              The pest attacks by inserting its stylets into leaf tissue and extracting plant sap, causing
              chlorosis (yellowing), premature frond drying, and in severe cases, complete tree death.
              Infestations spread rapidly through wind-dispersed crawlers — the mobile first-instar nymphs —
              making early detection essential before populations establish across an entire farm.
            </p>
            <p className="landing-about-text">
              The Philippine Coconut Authority (PCA) has documented that farms left unattended at high
              infestation levels for extended periods suffer catastrophic yield and tree losses.
              Biological control using the parasitoid wasp <em>Comperiella calauanica</em> and chemical
              control with white oil emulsion remain the primary management strategies recommended by PCA.
            </p>
            <p className="landing-about-text">
              This system combines YOLOv26 deep learning image analysis with an 81-rule Mamdani fuzzy logic
              environmental model to give farm managers and PCA personnel a fast, data-driven tool for
              detecting infestations and assessing spread risk before it reaches critical levels.
            </p>
            <div className="landing-stat-row">
              <div className="landing-stat-box">
                <div className="landing-stat-num">90.0%</div>
                <div className="landing-stat-label">YOLOv26 mAP</div>
              </div>
              <div className="landing-stat-box">
                <div className="landing-stat-num">81</div>
                <div className="landing-stat-label">Fuzzy Rules</div>
              </div>
              <div className="landing-stat-box">
                <div className="landing-stat-num">8,658</div>
                <div className="landing-stat-label">Training Images</div>
              </div>
              <div className="landing-stat-box">
                <div className="landing-stat-num">4</div>
                <div className="landing-stat-label">Input Variables</div>
              </div>
            </div>
          </div>

          <div>
            <p className="landing-section-label" style={{ textAlign: 'left', marginBottom: 16 }}>Key Environmental Factors</p>
            <p style={{ fontSize: 14, color: '#5a8068', lineHeight: 1.7, marginBottom: 20 }}>
              The fuzzy logic system analyzes these critical environmental parameters to determine
              infestation risk levels and guide intervention decisions.
            </p>
            <div className="landing-env-grid" style={{ marginBottom: 24 }}>
              {envFactors.map(e => (
                <div key={e.label} className="landing-env-item">
                  <div className="landing-env-icon">{e.icon}</div>
                  <div className="landing-env-label">{e.label}</div>
                  <div className="landing-env-val">{e.val}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.18)', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <ShieldAlert style={{ width: 18, height: 18, color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', margin: '0 0 4px' }}>HIGH Risk Threshold</p>
                <p style={{ fontSize: 12, color: '#a07070', margin: 0, lineHeight: 1.6, fontFamily: "'DM Mono',monospace" }}>
                  Field data shows 14+ days without intervention at HIGH risk leads to 90%+ tree loss. Immediate action is critical.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="landing-footer">
        <span className="landing-footer-text">Cocolisap Expert System · Undergraduate Thesis Project</span>
        <span className="landing-footer-text">YOLOv26 · Mamdani Fuzzy Inference · Philippine Coconut Authority Reference Data</span>
      </div>
    </div>
  );
}