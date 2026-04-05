import React from 'react';
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
`;

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
                    using YOLOv11 instance segmentation and an 81-rule Mamdani fuzzy logic system.
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

            {/* About Section */}
            <motion.div className="landing-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
                <div className="landing-about-grid">
                    <div className="landing-about-card">
                        <h3 className="landing-about-title">About <em>Cocolisap</em></h3>
                        <p className="landing-about-text">
                            <em>Aspidiotus rigidus</em> (Cocolisap) is a coconut scale insect native to Southeast Asia.
                            It causes yellowing and premature drying of fronds, leading to significant yield loss
                            if left undetected. Early identification is critical for effective pest management.
                        </p>
                        <p className="landing-about-text">
                            This system combines deep learning image analysis with fuzzy logic environmental modeling
                            to provide accurate, real-time infestation risk assessments for farm managers and PCA personnel.
                        </p>
                        <div className="landing-stat-row">
                            <div className="landing-stat-box">
                                <div className="landing-stat-num">89.9%</div>
                                <div className="landing-stat-label">YOLOv11 mAP</div>
                            </div>
                            <div className="landing-stat-box">
                                <div className="landing-stat-num">81</div>
                                <div className="landing-stat-label">Fuzzy Rules</div>
                            </div>
                            <div className="landing-stat-box">
                                <div className="landing-stat-num">670</div>
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
                <span className="landing-footer-text">YOLOv11 · Mamdani Fuzzy Inference · Philippine Coconut Authority Reference Data</span>
            </div>
        </div>
    );
}