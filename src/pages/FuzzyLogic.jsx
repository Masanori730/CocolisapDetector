import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const API = 'https://cocolisap-detector-398384683490.asia-southeast1.run.app';

const fuzzyStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap');
  .fl-root {
    --bg:#f4f7f4;--bg2:#eef3ee;--bg3:#e8f0e8;
    --surface:#ffffff;--surface2:#f0f5f0;
    --border:rgba(46,139,74,0.18);--border2:rgba(46,139,74,0.28);
    --green:#2e8b4a;--green-bright:#25763e;--green-dim:#c8dfc8;
    --amber:#d97706;--amber-dim:#fef3c7;
    --red:#dc2626;--red-dim:#fee2e2;
    --blue:#3b82f6;--blue-dim:#eff6ff;--blue-bg:rgba(59,130,246,0.07);
    --text:#1a3326;--text-muted:#5a8068;--text-dim:#8aaa96;
    --mono:'DM Mono',monospace;--serif:'DM Serif Display',serif;--sans:'Outfit',sans-serif;
    --r:12px;--rl:20px;
    font-family:var(--sans);
    background:var(--bg);
    color:var(--text);
    min-height:100vh;
    position:relative;
    overflow-x:hidden;
  }
  .fl-root::before {
    content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
    background:
      radial-gradient(ellipse 75% 60% at 20% 90%, rgba(46,139,74,0.09) 0%, transparent 55%),
      radial-gradient(ellipse 70% 55% at 90% 18%, rgba(46,139,74,0.08) 0%, transparent 55%),
      radial-gradient(ellipse 50% 45% at 60% 58%, rgba(46,139,74,0.04) 0%, transparent 60%);
  }
  .fl-page {position:relative;z-index:1;max-width:860px;margin:0 auto;padding:0 24px 80px;}
  .fl-header {padding:56px 0 40px;display:flex;flex-direction:column;gap:10px;}
  .fl-badge {
    display:inline-flex;align-items:center;gap:8px;
    background:rgba(46,139,74,0.08);border:1px solid var(--border2);
    border-radius:100px;padding:5px 14px;width:fit-content;
    font-family:var(--mono);font-size:11px;letter-spacing:.08em;
    color:var(--green);text-transform:uppercase;
  }
  .fl-badge-dot {
    width:7px;height:7px;border-radius:50%;background:var(--green);
    box-shadow:0 0 6px rgba(46,139,74,0.5);
    animation:fl-pulse 2s ease-in-out infinite;flex-shrink:0;
  }
  @keyframes fl-pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes fl-spin{to{transform:rotate(360deg)}}
  @keyframes fl-fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  .fl-h1 {
    font-family:var(--serif);font-size:clamp(32px,5vw,48px);font-weight:400;
    line-height:1.12;color:#1a3326;letter-spacing:-.02em;margin:0;
  }
  .fl-h1 em {font-style:italic;color:var(--green);}
  .fl-subtitle {font-size:14px;color:var(--text-muted);line-height:1.6;max-width:540px;}
  .fl-divider {height:1px;background:linear-gradient(90deg,var(--border2),transparent 80%);margin:8px 0 32px;}
  .fl-mode-toggle {
    display:flex;background:var(--bg2);border:1px solid var(--border);
    border-radius:var(--r);padding:4px;width:fit-content;margin-bottom:24px;
    position:relative;z-index:2;
  }
  .fl-mode-btn {
    display:flex;align-items:center;gap:8px;padding:10px 22px;border-radius:9px;
    border:none;background:transparent;color:var(--text-muted);
    font-family:var(--sans);font-size:13px;font-weight:500;cursor:pointer;
    transition:background .2s,color .2s;white-space:nowrap;
  }
  .fl-mode-btn svg {width:15px;height:15px;flex-shrink:0;opacity:.6;transition:opacity .2s;}
  .fl-mode-btn.active {background:var(--surface2);color:var(--green-bright);box-shadow:0 1px 6px rgba(0,0,0,.1);}
  .fl-mode-btn.active svg {opacity:1;}
  .fl-form-card {
    background:var(--surface);border:1px solid var(--border);
    border-radius:var(--rl);padding:36px 40px;position:relative;overflow:hidden;
    box-shadow:0 2px 12px rgba(0,0,0,0.06);
  }
  .fl-form-card::before {
    content:'';position:absolute;top:0;left:0;right:0;height:2px;
    background:linear-gradient(90deg,var(--green),transparent);
  }
  .fl-sec-label {
    font-family:var(--mono);font-size:10px;letter-spacing:.14em;
    color:var(--text-dim);text-transform:uppercase;margin-bottom:20px;display:block;
  }
  .fl-grid2 {display:grid;grid-template-columns:1fr 1fr;gap:20px;}
  .fl-ig {display:flex;flex-direction:column;gap:8px;}
  .fl-ig.full {grid-column:1/-1;}
  .fl-label {
    font-size:12px;font-weight:500;letter-spacing:.04em;color:var(--text-muted);
    display:flex;align-items:center;gap:8px;
  }
  .fl-unit {
    font-family:var(--mono);font-size:10px;color:var(--text-dim);
    background:var(--bg3);border:1px solid var(--border);border-radius:4px;
    padding:1px 6px;margin-left:auto;
  }
  .fl-input {
    background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);
    color:var(--text);font-family:var(--mono);font-size:15px;padding:12px 16px;
    width:100%;outline:none;transition:border-color .2s,box-shadow .2s,background .2s;
    -moz-appearance:textfield;box-sizing:border-box;
  }
  .fl-input::-webkit-inner-spin-button,.fl-input::-webkit-outer-spin-button{-webkit-appearance:none;}
  .fl-input::placeholder {color:var(--text-dim);font-size:13px;}
  .fl-input:focus {border-color:var(--green);box-shadow:0 0 0 3px rgba(46,139,74,.10);background:var(--bg3);}
  .fl-input.error {border-color:var(--red)!important;box-shadow:0 0 0 3px rgba(220,38,38,.10)!important;}
  .fl-hint {font-size:10px;color:var(--text-dim);font-family:var(--mono);}
  .fl-ferr {font-size:10px;color:var(--red);font-family:var(--mono);}
  .fl-slider-row {display:flex;align-items:center;gap:12px;margin-top:4px;}
  .fl-range {
    flex:1;-webkit-appearance:none;height:3px;background:var(--green-dim);
    border-radius:10px;outline:none;cursor:pointer;
  }
  .fl-range::-webkit-slider-thumb {
    -webkit-appearance:none;width:16px;height:16px;border-radius:50%;
    background:var(--green);box-shadow:0 2px 6px rgba(46,139,74,.4);cursor:pointer;border:2px solid #fff;
  }
  .fl-sval {font-family:var(--mono);font-size:13px;color:var(--green);min-width:40px;text-align:right;}
  .fl-card-sep {height:1px;background:var(--border);margin:28px 0;}
  .fl-fetch-btn {
    display:flex;align-items:center;gap:8px;padding:11px 22px;
    background:var(--blue-dim);border:1px solid rgba(59,130,246,.25);
    border-radius:var(--r);color:var(--blue);font-family:var(--sans);
    font-size:13px;font-weight:600;cursor:pointer;
    transition:background .2s,border-color .2s,transform .15s;white-space:nowrap;
  }
  .fl-fetch-btn:hover {background:rgba(59,130,246,.15);border-color:rgba(59,130,246,.40);transform:translateY(-1px);}
  .fl-fetch-btn:disabled {opacity:.45;cursor:not-allowed;transform:none;}
  .fl-fetch-btn svg {width:15px;height:15px;}
  .fl-submit-btn {
    background:var(--green);color:#fff;border:none;border-radius:var(--r);
    font-family:var(--sans);font-size:14px;font-weight:600;letter-spacing:.04em;
    padding:14px 36px;cursor:pointer;transition:background .2s,transform .15s,box-shadow .2s;
    position:relative;overflow:hidden;
  }
  .fl-submit-btn:hover {background:var(--green-bright);transform:translateY(-1px);box-shadow:0 6px 20px rgba(46,139,74,.25);}
  .fl-submit-btn:disabled {opacity:.5;cursor:not-allowed;transform:none;}
  .fl-submit-row {margin-top:32px;display:flex;align-items:center;gap:16px;}
  .fl-spin {
    width:18px;height:18px;border:2px solid rgba(46,139,74,.25);border-top-color:var(--green);
    border-radius:50%;animation:fl-spin .7s linear infinite;flex-shrink:0;
  }
  .fl-wx-preview {
    margin-top:20px;background:var(--blue-bg);border:1px solid rgba(59,130,246,.20);
    border-radius:var(--r);padding:18px 20px;animation:fl-fadein .35s ease;
  }
  .fl-wx-label {
    font-family:var(--mono);font-size:9px;letter-spacing:.14em;color:var(--blue);
    text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px;
  }
  .fl-wx-label::after {content:'';flex:1;height:1px;background:rgba(59,130,246,.15);}
  .fl-chips {display:flex;gap:12px;flex-wrap:wrap;}
  .fl-chip {
    display:flex;flex-direction:column;gap:3px;background:rgba(59,130,246,.06);
    border:1px solid rgba(59,130,246,.15);border-radius:8px;padding:10px 16px;min-width:110px;
  }
  .fl-chip-l {font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:rgba(59,130,246,.7);}
  .fl-chip-v {font-family:var(--mono);font-size:18px;font-weight:500;color:var(--blue);}
  .fl-chip-v span {font-size:11px;opacity:.7;}
  .fl-loc-res {font-family:var(--mono);font-size:11px;color:var(--text-muted);margin-top:10px;line-height:1.5;}
  .fl-err-toast {
    margin-top:16px;padding:14px 18px;background:rgba(220,38,38,.06);
    border:1px solid rgba(220,38,38,.20);border-radius:var(--r);
    color:var(--red);font-size:13px;font-family:var(--mono);
    animation:fl-fadein .3s ease;
  }
  .fl-inline-err {
    margin-top:14px;padding:12px 16px;background:rgba(220,38,38,.06);
    border:1px solid rgba(220,38,38,.18);border-radius:var(--r);
    color:var(--red);font-family:var(--mono);font-size:12px;
    animation:fl-fadein .3s ease;
  }
  .fl-results {margin-top:32px;animation:fl-fadein .5s ease;}
  .fl-score-card {
    border-radius:var(--rl);padding:36px 40px;position:relative;overflow:hidden;
    border:1px solid transparent;box-shadow:0 2px 12px rgba(0,0,0,0.06);
  }
  .fl-score-card.low {background:linear-gradient(135deg,rgba(46,139,74,.07),rgba(46,139,74,.02));border-color:rgba(46,139,74,.22);}
  .fl-score-card.moderate {background:linear-gradient(135deg,rgba(217,119,6,.07),rgba(217,119,6,.02));border-color:rgba(217,119,6,.22);}
  .fl-score-card.high {background:linear-gradient(135deg,rgba(220,38,38,.07),rgba(220,38,38,.02));border-color:rgba(220,38,38,.22);}
  .fl-score-card::before {content:'';position:absolute;top:0;left:0;right:0;height:2px;}
  .fl-score-card.low::before {background:linear-gradient(90deg,var(--green),transparent);}
  .fl-score-card.moderate::before {background:linear-gradient(90deg,var(--amber),transparent);}
  .fl-score-card.high::before {background:linear-gradient(90deg,var(--red),transparent);}
  .fl-score-top {display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}
  .fl-score-eyebrow {font-family:var(--mono);font-size:10px;letter-spacing:.14em;color:var(--text-dim);text-transform:uppercase;}
  .fl-score-num {font-family:var(--serif);font-size:clamp(56px,9vw,80px);line-height:1;letter-spacing:-.02em;}
  .fl-score-num.low {color:var(--green);}
  .fl-score-num.moderate {color:var(--amber);}
  .fl-score-num.high {color:var(--red);}
  .fl-score-num sup {font-family:var(--sans);font-size:.35em;font-weight:300;vertical-align:super;letter-spacing:0;opacity:.7;}
  .fl-badge-pill {
    display:inline-flex;align-items:center;gap:6px;border-radius:100px;
    padding:7px 16px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
  }
  .fl-badge-pill.low {background:rgba(46,139,74,.10);color:var(--green);border:1px solid rgba(46,139,74,.25);}
  .fl-badge-pill.moderate {background:rgba(217,119,6,.08);color:var(--amber);border:1px solid rgba(217,119,6,.25);}
  .fl-badge-pill.high {background:rgba(220,38,38,.08);color:var(--red);border:1px solid rgba(220,38,38,.25);}
  .fl-badge-pill::before {content:'';width:6px;height:6px;border-radius:50%;}
  .fl-badge-pill.low::before {background:var(--green);}
  .fl-badge-pill.moderate::before {background:var(--amber);}
  .fl-badge-pill.high::before {background:var(--red);}
  .fl-progress-track {margin-top:28px;height:6px;background:rgba(0,0,0,.07);border-radius:10px;overflow:hidden;}
  .fl-progress-fill {height:100%;border-radius:10px;transition:width 1s cubic-bezier(.4,0,.2,1);}
  .fl-progress-fill.low {background:linear-gradient(90deg,#a7d4b4,var(--green));}
  .fl-progress-fill.moderate {background:linear-gradient(90deg,#fde68a,var(--amber));}
  .fl-progress-fill.high {background:linear-gradient(90deg,#fca5a5,var(--red));}
  .fl-stats-row {display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:24px;}
  .fl-stat-box {background:rgba(0,0,0,.03);border:1px solid var(--border);border-radius:var(--r);padding:16px 18px;}
  .fl-stat-box-l {font-family:var(--mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:8px;}
  .fl-stat-box-v {font-family:var(--mono);font-size:18px;font-weight:500;color:var(--text);letter-spacing:-.02em;}
  .fl-advisory {margin-top:20px;padding:16px 20px;border-radius:var(--r);font-size:13px;line-height:1.6;border-left:3px solid transparent;}
  .fl-advisory.low {background:rgba(46,139,74,.06);border-color:var(--green);}
  .fl-advisory.moderate {background:rgba(217,119,6,.06);border-color:var(--amber);}
  .fl-advisory.high {background:rgba(220,38,38,.06);border-color:var(--red);}
  .fl-advisory strong {display:block;margin-bottom:4px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;}
  .fl-advisory.low strong {color:var(--green);}
  .fl-advisory.moderate strong {color:var(--amber);}
  .fl-advisory.high strong {color:var(--red);}
  .fl-detail-grid {display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px;}
  .fl-drow {
    display:flex;justify-content:space-between;align-items:center;
    padding:9px 14px;background:rgba(0,0,0,.02);border:1px solid var(--border);border-radius:8px;
  }
  .fl-drow.wide {grid-column:1/-1;}
  .fl-dkey {color:var(--text-dim);font-family:var(--mono);font-size:11px;}
  .fl-dval {color:var(--text);font-family:var(--mono);font-size:12px;font-weight:500;}
  .fl-risk-subbox {
    margin-top:20px;background:rgba(0,0,0,.02);
    border:1px solid var(--border2);border-radius:var(--r);overflow:hidden;
  }
  .fl-risk-subbox-header {
    display:flex;align-items:center;justify-content:space-between;
    padding:10px 18px;border-bottom:1px solid var(--border);
    background:rgba(0,0,0,.03);
  }
  .fl-risk-subbox-eyebrow {
    font-family:var(--mono);font-size:10px;letter-spacing:.14em;
    color:var(--text-dim);text-transform:uppercase;
  }
  .fl-risk-subbox-body {padding:16px 18px 14px;}
  .fl-risk-subbox-score-row {display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:12px;}
  .fl-risk-subbox-num {
    font-family:var(--serif);font-size:clamp(32px,5vw,44px);
    line-height:1;letter-spacing:-.02em;
  }
  .fl-risk-subbox-num.low {color:var(--green);}
  .fl-risk-subbox-num.moderate {color:var(--amber);}
  .fl-risk-subbox-num.high {color:var(--red);}
  .fl-risk-subbox-trees {display:flex;flex-direction:column;gap:6px;flex:1;}
  .fl-risk-tree-item {
    display:flex;justify-content:space-between;align-items:center;
    background:rgba(0,0,0,.03);border:1px solid var(--border);
    border-radius:6px;padding:7px 12px;
  }
  .fl-risk-tree-l {font-family:var(--mono);font-size:9px;letter-spacing:.10em;text-transform:uppercase;color:var(--text-dim);}
  .fl-risk-tree-v {font-family:var(--mono);font-size:13px;font-weight:500;color:var(--text);}
  .fl-risk-subbox-note {
    font-size:10px;color:var(--text-dim);font-family:var(--mono);line-height:1.6;
    border-top:1px solid var(--border);padding-top:10px;margin-top:4px;
  }
  .fl-spread-trigger {
    width:100%;display:flex;align-items:center;justify-content:center;gap:10px;
    padding:17px 24px;background:rgba(46,139,74,.04);
    border:1px dashed var(--border2);border-radius:var(--rl);
    color:var(--green);font-family:var(--sans);font-size:14px;font-weight:500;
    cursor:pointer;transition:background .2s,border-color .2s,transform .15s;letter-spacing:.02em;
    margin-top:20px;
  }
  .fl-spread-trigger:hover {background:rgba(46,139,74,.09);border-color:var(--green);transform:translateY(-1px);}
  .fl-spread-trigger:disabled {opacity:.4;cursor:not-allowed;transform:none;}
  .fl-spread-trigger svg {width:18px;height:18px;flex-shrink:0;}
  .fl-spread-card {
    margin-top:16px;background:var(--surface);border:1px solid var(--border);
    border-radius:var(--rl);overflow:hidden;animation:fl-fadein .45s ease;
    box-shadow:0 2px 10px rgba(0,0,0,0.06);
  }
  .fl-spread-header {
    padding:22px 28px 18px;border-bottom:1px solid var(--border);
    display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:14px;
  }
  .fl-spread-title {font-family:var(--serif);font-size:22px;font-weight:400;color:#1a3326;}
  .fl-spread-title em {font-style:italic;color:var(--green);}
  .fl-spread-sub {font-family:var(--mono);font-size:11px;color:var(--text-muted);margin-top:4px;}
  .fl-wind-chips {display:flex;gap:10px;flex-wrap:wrap;}
  .fl-wchip {
    display:flex;flex-direction:column;gap:3px;background:var(--bg3);
    border:1px solid var(--border);border-radius:8px;padding:9px 14px;
  }
  .fl-wchip-l {font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);}
  .fl-wchip-v {font-family:var(--mono);font-size:14px;font-weight:500;color:var(--green);}
  .fl-spread-map-wrap {width:100%;height:480px;background:var(--bg2);}
  .fl-spread-legend {
    padding:16px 28px;border-top:1px solid var(--border);
    display:flex;gap:18px;flex-wrap:wrap;align-items:center;
  }
  .fl-leg-item {display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-muted);font-family:var(--mono);}
  .fl-leg-dot {width:10px;height:10px;border-radius:50%;flex-shrink:0;}
  .fl-leg-sw {width:22px;height:10px;border-radius:3px;flex-shrink:0;}
  .fl-spread-meta {
    padding:18px 28px 24px;border-top:1px solid var(--border);
    display:grid;grid-template-columns:1fr 1fr;gap:10px;
  }
  .fl-footer {
    margin-top:60px;padding-top:24px;border-top:1px solid var(--border);
    font-size:11px;color:var(--text-dim);font-family:var(--mono);
    display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;
  }
  .fl-wx-status {font-family:var(--mono);font-size:11px;color:var(--text-muted);}

  /* PSGC select styles */
  .fl-select-wrap {position:relative;width:100%;}
  .fl-select {
    background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);
    color:var(--text);font-family:var(--mono);font-size:14px;padding:12px 36px 12px 16px;
    width:100%;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none;
    transition:border-color .2s,box-shadow .2s,background .2s;box-sizing:border-box;
  }
  .fl-select:focus {border-color:var(--green);box-shadow:0 0 0 3px rgba(46,139,74,.10);background:var(--bg3);}
  .fl-select:disabled {opacity:.5;cursor:not-allowed;}
  .fl-select-wrap::after {
    content:'';position:absolute;right:14px;top:50%;transform:translateY(-50%);
    width:8px;height:8px;border-right:2px solid var(--text-dim);border-bottom:2px solid var(--text-dim);
    transform:translateY(-65%) rotate(45deg);pointer-events:none;
  }
  .fl-psgc-loading {
    font-family:var(--mono);font-size:10px;color:var(--text-dim);
    display:flex;align-items:center;gap:6px;margin-top:4px;
  }
  .fl-psgc-spin {
    width:10px;height:10px;border:1.5px solid rgba(46,139,74,.2);border-top-color:var(--green);
    border-radius:50%;animation:fl-spin .7s linear infinite;flex-shrink:0;
  }

  /* How To Use */
  .fl-htu-wrap { background:#fff; border:1px solid rgba(46,139,74,0.18); border-radius:16px; margin-bottom:24px; position:relative; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
  .fl-htu-wrap::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,#2e8b4a,transparent); }
  .fl-htu-header { padding:18px 24px 0; display:flex; align-items:center; gap:10px; }
  .fl-htu-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(46,139,74,0.10); border:1px solid rgba(46,139,74,0.25); border-radius:100px; padding:3px 10px; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.12em; color:#2e8b4a; text-transform:uppercase; }
  .fl-htu-title { font-family:'DM Serif Display',serif; font-size:17px; font-weight:400; color:#1a3326; margin:6px 24px 0; }
  .fl-htu-subtitle { font-family:'DM Mono',monospace; font-size:11px; color:#8aaa96; margin:4px 24px 20px; }
  .fl-htu-steps { display:grid; grid-template-columns:repeat(4,1fr); gap:0; border-top:1px solid #eaf2ea; }
  @media(max-width:700px){ .fl-htu-steps { grid-template-columns:repeat(2,1fr); } }
  @media(max-width:400px){ .fl-htu-steps { grid-template-columns:1fr; } }
  .fl-htu-step { padding:20px; border-right:1px solid #eaf2ea; }
  .fl-htu-step:last-child { border-right:none; }
  @media(max-width:700px){ .fl-htu-step:nth-child(2n) { border-right:none; } }
  .fl-htu-num { width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,#2e8b4a,#4caf72); color:#fff; font-family:'DM Mono',monospace; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; margin-bottom:12px; box-shadow:0 2px 8px rgba(46,139,74,0.28); }
  .fl-htu-step-title { font-size:13px; font-weight:600; color:#1a3326; margin-bottom:6px; line-height:1.3; }
  .fl-htu-step-desc { font-size:11.5px; color:#5a8068; line-height:1.6; font-family:'Outfit',sans-serif; }
  .fl-htu-tip { margin:0 24px 20px; background:rgba(46,139,74,0.04); border:1px solid rgba(46,139,74,0.15); border-radius:10px; padding:10px 14px; display:flex; align-items:flex-start; gap:8px; }
  .fl-htu-tip-icon { font-size:14px; flex-shrink:0; margin-top:1px; }
  .fl-htu-tip-text { font-size:12px; color:#5a8068; font-family:'DM Mono',monospace; line-height:1.6; }
  .fl-htu-tip-text strong { color:#2e8b4a; }

  @media(max-width:600px){
    .fl-grid2{grid-template-columns:1fr;}
    .fl-form-card{padding:24px 20px;}
    .fl-mode-btn{padding:10px 14px;font-size:12px;}
    .fl-stats-row{grid-template-columns:1fr;}
    .fl-detail-grid{grid-column:1/-1;}
    .fl-spread-meta{grid-template-columns:1fr;}
  }
`;

function geodest(lat, lon, bearDeg, km) {
  const R = 6371, la = lat * Math.PI / 180, lo = lon * Math.PI / 180, b = bearDeg * Math.PI / 180;
  const la2 = Math.asin(Math.sin(la) * Math.cos(km / R) + Math.cos(la) * Math.sin(km / R) * Math.cos(b));
  const lo2 = lo + Math.atan2(Math.sin(b) * Math.sin(km / R) * Math.cos(la), Math.cos(km / R) - Math.sin(la) * Math.sin(la2));
  return [la2 * 180 / Math.PI, lo2 * 180 / Math.PI];
}

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target == null) return;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(target * e);
      if (p < 1) requestAnimationFrame(step);
      else setVal(target);
    };
    requestAnimationFrame(step);
  }, [target]);
  return val;
}

// ✅ FIXED: SliderInput now clamps values to min/max on both change and blur
function SliderInput({ label, unit, hint, min, max, step, value, onChange, error }) {
  return (
    <div className="fl-ig">
      <label className="fl-label">{label} <span className="fl-unit">{unit}</span></label>
      <div className="fl-slider-row">
        <input type="range" className="fl-range" min={min} max={max} step={step}
          value={value} onChange={e => onChange(parseFloat(e.target.value))} />
        <span className="fl-sval">{value}</span>
      </div>
      <input
        type="number"
        className={`fl-input${error ? ' error' : ''}`}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
        }}
        onBlur={e => {
          const v = parseFloat(e.target.value);
          if (isNaN(v) || v < min) onChange(min);
          else if (v > max) onChange(max);
        }}
        placeholder={`e.g. ${value}`}
      />
      {hint && <span className="fl-hint">{hint}</span>}
      {error && <span className="fl-ferr">{error}</span>}
    </div>
  );
}

function HowToUse() {
  const steps = [
    {
      num: 1,
      title: 'Choose a mode',
      desc: 'Manual lets you input values directly. Smart Location auto-fetches live weather from your selected farm location via PSGC dropdown.',
    },
    {
      num: 2,
      title: 'Enter farm data',
      desc: 'Fill in planting density, total trees, and days without intervention. These drive the fuzzy inference engine.',
    },
    {
      num: 3,
      title: 'Get weather (Smart only)',
      desc: 'Select your region, province, city, and barangay using the cascading dropdown, then click "Get Weather Data".',
    },
    {
      num: 4,
      title: 'Analyze & view results',
      desc: 'Click Analyze Infestation to get the fuzzy risk score. In Smart mode, you can also view the spread cone map after.',
    },
  ];

  return (
    <div className="fl-htu-wrap">
      <div className="fl-htu-header">
        <span className="fl-htu-badge">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4.5" stroke="#2e8b4a"/><path d="M5 4.5v3M5 3h.01" stroke="#2e8b4a" strokeWidth="1.2" strokeLinecap="round"/></svg>
          How to Use
        </span>
      </div>
      <div className="fl-htu-title">Getting Started with the Fuzzy Logic Analyzer</div>
      <div className="fl-htu-subtitle">Follow these steps to assess cocolisap infestation risk for your farm.</div>
      <div className="fl-htu-steps">
        {steps.map(s => (
          <div key={s.num} className="fl-htu-step">
            <div className="fl-htu-num">{s.num}</div>
            <div className="fl-htu-step-title">{s.title}</div>
            <div className="fl-htu-step-desc">{s.desc}</div>
          </div>
        ))}
      </div>
      <div className="fl-htu-tip">
        <span className="fl-htu-tip-icon">💡</span>
        <span className="fl-htu-tip-text">
          <strong>Pro tip:</strong> Use Smart Location mode for the most accurate results. It pulls live temperature, humidity, and wind data directly from your farm's coordinates.
        </span>
      </div>
    </div>
  );
}

function SpreadLayers({ cone, pred }) {
  const map = useMap();
  useEffect(() => {
    if (cone?.outer_polygon?.length) {
      const bounds = L.latLngBounds(cone.outer_polygon.map(p => L.latLng(p[0], p[1]))).pad(0.15);
      map.fitBounds(bounds);
    }
  }, [cone, map]);
  if (!cone || !pred) return null;
  const RC = { LOW: '#4caf72', MODERATE: '#e8a440', HIGH: '#e05555' }[pred.adjusted_risk_label] || '#e8a440';
  const arrowEnd = geodest(cone.origin[0], cone.origin[1], cone.wind_to_bearing, cone.cone_length_km * 0.60);
  const arrowIcon = L.divIcon({
    html: `<svg width="22" height="22" viewBox="0 0 22 22" style="transform:rotate(${cone.wind_to_bearing}deg);overflow:visible"><polygon points="11,0 20,20 11,13 2,20" fill="#4a9edd" opacity="0.95"/></svg>`,
    className: '', iconSize: [22, 22], iconAnchor: [11, 11]
  });
  const originIcon = L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:#2e8b4a;border:3px solid #ffffff;box-shadow:0 0 10px rgba(46,139,74,0.6);"></div>`,
    className: '', iconSize: [14, 14], iconAnchor: [7, 7]
  });
  return (
    <>
      <Polygon positions={cone.outer_polygon}
        pathOptions={{ color: RC, weight: 2, opacity: 0.85, fillColor: RC, fillOpacity: 0.17, dashArray: '7,4' }} />
      <Polygon positions={cone.inner_polygon}
        pathOptions={{ color: '#e05555', weight: 1.5, opacity: 0.75, fillColor: '#e05555', fillOpacity: 0.22 }} />
      <Polyline positions={[cone.origin, arrowEnd]}
        pathOptions={{ color: '#4a9edd', weight: 2.5, opacity: 0.9, dashArray: '8,5' }} />
      <Marker position={arrowEnd} icon={arrowIcon} />
      <Circle center={cone.origin} radius={cone.cone_length_km * 1000}
        pathOptions={{ color: RC, weight: 1, opacity: 0.14, fillOpacity: 0, dashArray: '5,9' }} />
      <Polyline positions={[cone.origin, cone.tail_point]}
        pathOptions={{ color: 'rgba(46,139,74,0.35)', weight: 1.5, dashArray: '4,7' }} />
      <Marker position={cone.origin} icon={originIcon} />
    </>
  );
}

export default function FuzzyLogic() {
  const [mode, setMode] = useState('manual');
  const [loc, setLoc] = useState({ barangay: '', city: '', province: '', region: '', country: 'Philippines' });

  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [psgcLoading, setPsgcLoading] = useState('');

  const [wx, setWx] = useState(null);
  const [wxStatus, setWxStatus] = useState('');
  const [wxErr, setWxErr] = useState('');
  const [wxLoading, setWxLoading] = useState(false);
  const [sDens, setSDens] = useState(115);
  const [sTrees, setSTrees] = useState(500);
  const [sDays, setSDays] = useState(0);
  const [temp, setTemp] = useState(28);
  const [hum, setHum] = useState(70);
  const [wind, setWind] = useState(18);
  const [dens, setDens] = useState(115);
  const [trees, setTrees] = useState(500);
  const [days, setDays] = useState(0);
  const [pred, setPred] = useState(null);
  const [cone, setCone] = useState(null);
  const [showSpread, setShowSpread] = useState(false);
  const [showSpreadCard, setShowSpreadCard] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [spreadLoading, setSpreadLoading] = useState(false);
  const [errToast, setErrToast] = useState('');
  const [errs, setErrs] = useState({});
  const [savedDocId, setSavedDocId] = useState(null);

  const resultsRef = useRef(null);
  const spreadCardRef = useRef(null);

  const baseScoreAnim = useCountUp(pred ? pred.fuzzy_base_score : null);
  const adjScoreAnim = useCountUp(pred ? pred.adjusted_risk_score : null);
  const infectedAnim = useCountUp(pred ? pred.estimated_infected_trees : null);
  const healthyAnim = useCountUp(pred ? pred.estimated_healthy_trees : null);

  const baseLc = pred ? pred.fuzzy_base_label.toLowerCase() : 'low';
  const adjLc = pred ? pred.adjusted_risk_label.toLowerCase() : 'low';

  useEffect(() => {
    fetch('https://psgc.cloud/api/regions')
      .then(r => r.json())
      .then(data => setRegions(data || []))
      .catch(() => {});
  }, []);

  async function handleRegionChange(regionCode) {
    const selected = regions.find(r => r.code === regionCode);
    setLoc(l => ({ ...l, region: selected?.name || '', province: '', city: '', barangay: '' }));
    setProvinces([]); setCities([]); setBarangays([]);
    if (!regionCode) return;
    setPsgcLoading('provinces');
    try {
      const r = await fetch(`https://psgc.cloud/api/regions/${regionCode}/provinces`);
      const data = await r.json();
      if (Array.isArray(data) && data.length > 0) {
        setProvinces(data);
      } else {
        const r2 = await fetch(`https://psgc.cloud/api/regions/${regionCode}/cities-municipalities`);
        const data2 = await r2.json();
        setCities(data2 || []);
      }
    } catch {}
    setPsgcLoading('');
  }

  async function handleProvinceChange(provinceCode) {
    const selected = provinces.find(p => p.code === provinceCode);
    setLoc(l => ({ ...l, province: selected?.name || '', city: '', barangay: '' }));
    setCities([]); setBarangays([]);
    if (!provinceCode) return;
    setPsgcLoading('cities');
    try {
      const r = await fetch(`https://psgc.cloud/api/provinces/${provinceCode}/cities-municipalities`);
      const data = await r.json();
      setCities(data || []);
    } catch {}
    setPsgcLoading('');
  }

  async function handleCityChange(cityCode) {
    const selected = cities.find(c => c.code === cityCode);
    setLoc(l => ({ ...l, city: selected?.name || '', barangay: '' }));
    setBarangays([]);
    if (!cityCode) return;
    setPsgcLoading('barangays');
    try {
      const r = await fetch(`https://psgc.cloud/api/cities-municipalities/${cityCode}/barangays`);
      const data = await r.json();
      setBarangays(data || []);
    } catch {}
    setPsgcLoading('');
  }

  function handleBarangayChange(barangayCode) {
    const selected = barangays.find(b => b.code === barangayCode);
    setLoc(l => ({ ...l, barangay: selected?.name || '' }));
  }

  function switchMode(m) {
    setMode(m);
    setPred(null);
    setCone(null);
    setShowSpread(false);
    setShowSpreadCard(false);
    setErrToast('');
    setErrs({});
  }

  async function fetchWeather() {
    if (!loc.city && !loc.province) { setWxErr('Please select at least City/Municipality and Province.'); return; }
    setWxErr(''); setWx(null); setWxLoading(true); setWxStatus('Resolving address…');
    try {
      const gRes = await fetch(`${API}/geocode`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barangay: loc.barangay, city: loc.city, province: loc.province, region: loc.region, country: loc.country || 'Philippines' })
      });
      if (!gRes.ok) { const e = await gRes.json(); throw new Error(e.detail || e.error || 'Geocoding failed.'); }
      const geo = await gRes.json();
      setWxStatus('Fetching weather…');
      const wRes = await fetch(`${API}/weather`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: geo.latitude, longitude: geo.longitude })
      });
      if (!wRes.ok) { const e = await wRes.json(); throw new Error(e.detail || e.error || 'Weather failed.'); }
      const weather = await wRes.json();
      setWx({ ...weather, latitude: geo.latitude, longitude: geo.longitude, display_name: geo.display_name });
      setWxStatus('✓ Weather loaded');
    } catch (err) { setWxErr('⚠ ' + err.message); setWxStatus(''); }
    finally { setWxLoading(false); }
  }

  function validate() {
    const e = {};
    if (mode === 'smart') {
      if (isNaN(sDens) || sDens < 1 || sDens > 200) e.sDens = 'Must be between 1 and 200';
      if (isNaN(sTrees) || sTrees < 1) e.sTrees = 'Must be at least 1';
      if (isNaN(sDays) || sDays < 0) e.sDays = 'Must be 0 or greater';
      if (!e.sDens && !e.sTrees && sDens > sTrees) e.sDensCross = 'Planting density cannot exceed total number of trees';
    } else {
      if (isNaN(temp) || temp < 1 || temp > 45) e.temp = 'Must be between 1 and 45';
      if (isNaN(hum) || hum < 0 || hum > 100) e.hum = 'Must be between 0 and 100';
      if (isNaN(wind) || wind < 1 || wind > 85) e.wind = 'Must be between 1 and 85';
      if (isNaN(dens) || dens < 1 || dens > 200) e.dens = 'Must be between 1 and 200';
      if (isNaN(trees) || trees < 1) e.trees = 'Must be at least 1';
      if (isNaN(days) || days < 0) e.days = 'Must be 0 or greater';
      if (!e.dens && !e.trees && dens > trees) e.densCross = 'Planting density cannot exceed total number of trees';
    }
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrToast('');
    setShowSpread(false);
    setShowSpreadCard(false);
    setCone(null);
    if (mode === 'smart' && !wx) { setErrToast('⚠ Please fetch weather data first using "Get Weather Data".'); return; }
    if (!validate()) return;

    const payload = mode === 'smart'
      ? { temperature: wx.temperature_c, humidity: wx.humidity_pct, wind_speed: wx.wind_speed_kmh, planting_density: sDens, total_trees: sTrees, days_undetected: sDays }
      : { temperature: temp, humidity: hum, wind_speed: wind, planting_density: dens, total_trees: trees, days_undetected: days };

    setSubmitLoading(true);
    try {
      const r = await fetch(`${API}/predict`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) { const err = await r.json(); throw new Error(err.detail || err.error || 'Server error'); }
      const result = await r.json();
      setPred(result);
      if (mode === 'smart' && wx) setShowSpread(true);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

      const assessmentData = {
        temperature_c: payload.temperature,
        humidity_pct: payload.humidity,
        wind_speed_kmh: payload.wind_speed,
        planting_density: payload.planting_density,
        total_trees: payload.total_trees,
        days_without_intervention: payload.days_undetected,
        fuzzy_base_score: result.fuzzy_base_score,
        fuzzy_base_label: result.fuzzy_base_label,
        intervention_multiplier: result.intervention_multiplier,
        adjusted_risk_score: result.adjusted_risk_score,
        adjusted_risk_label: result.adjusted_risk_label,
        degree_of_infestation_pct: result.degree_of_infestation_pct,
        estimated_infected_trees: result.estimated_infected_trees,
        estimated_healthy_trees: result.estimated_healthy_trees,
        intervention_note: result.intervention_note,
        created_date: new Date().toISOString(),
        ...(mode === 'smart' && wx ? {
          latitude: wx.latitude,
          longitude: wx.longitude,
          wind_direction_deg: wx.wind_direction_deg,
          wind_direction_compass: wx.wind_direction_compass,
          province: loc.province || null,
          municipality: loc.city || null,
          barangay: loc.barangay || null,
        } : {}),
      };

      try {
        const docRef = await addDoc(collection(db, 'fuzzyAssessments'), assessmentData);
        setSavedDocId(docRef.id);
      } catch (fbErr) {
        console.error('Failed to save to Firebase:', fbErr);
      }

    } catch (err) { setErrToast('⚠ ' + (err.message || 'Could not reach backend.')); }
    finally { setSubmitLoading(false); }
  }

  async function openSpreadMap() {
    if (!wx || !pred) return;
    setSpreadLoading(true);
    try {
      const r = await fetch(`${API}/spread`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: wx.latitude, longitude: wx.longitude,
          wind_direction_from: wx.wind_direction_deg,
          wind_speed_kmh: wx.wind_speed_kmh,
          infestation_score: pred.degree_of_infestation_pct,
          risk_label: pred.adjusted_risk_label,
        })
      });
      if (!r.ok) { const err = await r.json(); throw new Error(err.detail || err.error || 'Spread calculation failed.'); }
      const coneData = await r.json();
      setCone(coneData);
      setShowSpreadCard(true);
      setTimeout(() => spreadCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) { setErrToast('⚠ Map error: ' + err.message); }
    finally { setSpreadLoading(false); }
  }

  const guidance = pred ? {
    LOW: 'Low infestation risk. Monitor farms within the cone area quarterly.',
    MODERATE: 'Moderate risk detected. PCA personnel should inspect farms within 1 km of the cone axis within 2–4 weeks.',
    HIGH: 'HIGH RISK. Immediate field inspection of all farms within the cone is strongly recommended. Coordinate with the LGU for rapid response.'
  }[pred.adjusted_risk_label] || '' : '';

  return (
    <div className="fl-root">
      <style>{fuzzyStyles}</style>

      <div className="fl-page">
        <header className="fl-header">
          <span className="fl-badge">
            <span className="fl-badge-dot" />
            Fuzzy Logic Expert System
          </span>
          <h1 className="fl-h1">Cocolisap <em>Infestation</em><br />Severity Analyzer</h1>
          <p className="fl-subtitle">
            Input your farm's environmental and structural data to estimate the degree of infestation.
          </p>
        </header>
        <div className="fl-divider" />

        <HowToUse />

        {/* Mode toggle */}
        <div className="fl-mode-toggle">
          <button className={`fl-mode-btn${mode === 'manual' ? ' active' : ''}`} onClick={() => switchMode('manual')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Manual Prediction
          </button>
          <button className={`fl-mode-btn${mode === 'smart' ? ' active' : ''}`} onClick={() => switchMode('smart')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Smart Location
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fl-form-card">

            {/* SMART MODE */}
            {mode === 'smart' && (
              <div>
                <span className="fl-sec-label">Farm Location - Philippine Address</span>
                <div className="fl-grid2">
                  <div className="fl-ig">
                    <label className="fl-label">Region</label>
                    <div className="fl-select-wrap">
                      <select className="fl-select" onChange={e => handleRegionChange(e.target.value)} defaultValue="">
                        <option value="" disabled>Select Region</option>
                        {regions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
                      </select>
                    </div>
                    {psgcLoading === 'provinces' && <div className="fl-psgc-loading"><div className="fl-psgc-spin" />Loading provinces…</div>}
                  </div>

                  <div className="fl-ig">
                    <label className="fl-label">Province</label>
                    <div className="fl-select-wrap">
                      <select className="fl-select" onChange={e => handleProvinceChange(e.target.value)} defaultValue="" disabled={provinces.length === 0 && cities.length === 0}>
                        <option value="" disabled>Select Province</option>
                        {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                      </select>
                    </div>
                    {psgcLoading === 'cities' && <div className="fl-psgc-loading"><div className="fl-psgc-spin" />Loading cities…</div>}
                  </div>

                  <div className="fl-ig">
                    <label className="fl-label">City / Municipality</label>
                    <div className="fl-select-wrap">
                      <select className="fl-select" onChange={e => handleCityChange(e.target.value)} defaultValue="" disabled={cities.length === 0}>
                        <option value="" disabled>Select City / Municipality</option>
                        {cities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                      </select>
                    </div>
                    {psgcLoading === 'barangays' && <div className="fl-psgc-loading"><div className="fl-psgc-spin" />Loading barangays…</div>}
                  </div>

                  <div className="fl-ig">
                    <label className="fl-label">Barangay</label>
                    <div className="fl-select-wrap">
                      <select className="fl-select" onChange={e => handleBarangayChange(e.target.value)} defaultValue="" disabled={barangays.length === 0}>
                        <option value="" disabled>Select Barangay</option>
                        {barangays.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <button type="button" className="fl-fetch-btn" onClick={fetchWeather} disabled={wxLoading}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" />
                    </svg>
                    Get Weather Data
                  </button>
                  {wxLoading && <div className="fl-spin" />}
                  <span className="fl-wx-status">{wxStatus}</span>
                </div>
                {wx && (
                  <div className="fl-wx-preview">
                    <div className="fl-wx-label">Live Weather Retrieved</div>
                    <div className="fl-chips">
                      <div className="fl-chip"><span className="fl-chip-l">Temperature</span><div className="fl-chip-v">{wx.temperature_c}<span>°C</span></div></div>
                      <div className="fl-chip"><span className="fl-chip-l">Humidity</span><div className="fl-chip-v">{wx.humidity_pct}<span>%</span></div></div>
                      <div className="fl-chip"><span className="fl-chip-l">Wind Speed</span><div className="fl-chip-v">{wx.wind_speed_kmh}<span>km/h</span></div></div>
                      <div className="fl-chip"><span className="fl-chip-l">Wind Direction</span><div className="fl-chip-v">{wx.wind_direction_compass}<span> ({wx.wind_direction_deg}°)</span></div></div>
                    </div>
                    {wx.display_name && <div className="fl-loc-res">📍 {wx.display_name}</div>}
                  </div>
                )}
                {wxErr && <div className="fl-inline-err">{wxErr}</div>}
                <div className="fl-card-sep" />
                <span className="fl-sec-label">Additional Farm Parameters</span>
                <div className="fl-grid2">
                  <SliderInput label="Planting Density" unit="1-200 /ha" hint="Observed range: 100-130 trees/ha"
                    min={1} max={200} step={1} value={sDens} onChange={setSDens} error={errs.sDens || errs.sDensCross} />
                  <div className="fl-ig">
                    <label className="fl-label">Total Coconut Trees <span className="fl-unit">≥ 1</span></label>
                    <input className={`fl-input${errs.sTrees ? ' error' : ''}`} type="number" placeholder="e.g. 500"
                      min={1} step={1} value={sTrees} onChange={e => setSTrees(parseInt(e.target.value))} />
                    <span className="fl-hint">Used to estimate infected tree count</span>
                    {errs.sTrees && <span className="fl-ferr">{errs.sTrees}</span>}
                  </div>
                  <div className="fl-ig full">
                    <label className="fl-label">Days Without Intervention <span className="fl-unit">0 = N/A</span></label>
                    <input className={`fl-input${errs.sDays ? ' error' : ''}`} type="number" placeholder="0"
                      min={0} step={1} value={sDays}
                      onChange={e => setSDays(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                      onFocus={e => e.target.select()} />
                    <span className="fl-hint">Days farm was at HIGH risk without action. Field data: 21+ days → 90%+ tree loss.</span>
                    {errs.sDays && <span className="fl-ferr">{errs.sDays}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* MANUAL MODE */}
            {mode === 'manual' && (
              <div>
                <span className="fl-sec-label">Environmental Parameters</span>
                <div className="fl-grid2">
                  <SliderInput label="Temperature" unit="1-45 °C" hint="Observed range: 20-35 °C"
                    min={1} max={45} step={0.5} value={temp} onChange={setTemp} error={errs.temp} />
                  <SliderInput label="Relative Humidity" unit="0-100 %" hint="Observed range: 65-74 %"
                    min={0} max={100} step={1} value={hum} onChange={setHum} error={errs.hum} />
                  <SliderInput label="Wind Speed" unit="1-85 km/h" hint="Observed range: 11-24 km/h"
                    min={1} max={85} step={1} value={wind} onChange={setWind} error={errs.wind} />
                  <SliderInput label="Planting Density" unit="1-200 /ha" hint="Observed range: 100-130 trees/ha"
                    min={1} max={200} step={1} value={dens} onChange={setDens} error={errs.dens || errs.densCross} />
                  <div className="fl-ig full">
                    <label className="fl-label">Total Coconut Trees in Farm <span className="fl-unit">≥ 1</span></label>
                    <input className={`fl-input${errs.trees ? ' error' : ''}`} type="number" placeholder="e.g. 500"
                      min={1} step={1} value={trees} onChange={e => setTrees(parseInt(e.target.value))} />
                    <span className="fl-hint">Used to estimate the number of infected trees</span>
                    {errs.trees && <span className="fl-ferr">{errs.trees}</span>}
                    {errs.densCross && <span className="fl-ferr">{errs.densCross}</span>}
                  </div>
                  <div className="fl-ig full">
                    <label className="fl-label">Days Without Intervention <span className="fl-unit">0 = N/A</span></label>
                    <input className={`fl-input${errs.days ? ' error' : ''}`} type="number" placeholder="0"
                      min={0} step={1} value={days}
                      onChange={e => setDays(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                      onFocus={e => e.target.select()} />
                    <span className="fl-hint">Number of days at HIGH risk without action. Field data: 21+ days → 90%+ tree loss.</span>
                    {errs.days && <span className="fl-ferr">{errs.days}</span>}
                  </div>
                </div>
              </div>
            )}

            <div className="fl-submit-row">
              <button type="submit" className="fl-submit-btn" disabled={submitLoading}>Analyze Infestation</button>
              {submitLoading && <div className="fl-spin" />}
            </div>
            {errToast && <div className="fl-err-toast">{errToast}</div>}
          </div>
        </form>

        {/* RESULTS */}
        {pred && (
          <div className="fl-results" ref={resultsRef}>
            <div className={`fl-score-card ${baseLc}`}>
              <div className="fl-score-top">
                <div>
                  <div className="fl-score-eyebrow">Infestation Suitability</div>
                  <div className={`fl-score-num ${baseLc}`}>
                    <span>{baseScoreAnim.toFixed(2)}</span><sup>%</sup>
                  </div>
                </div>
                <span className={`fl-badge-pill ${baseLc}`}>{pred.fuzzy_base_label}</span>
              </div>
              <div className="fl-progress-track">
                <div className={`fl-progress-fill ${baseLc}`} style={{ width: `${Math.min(pred.fuzzy_base_score, 100)}%` }} />
              </div>
              <div className={`fl-advisory ${baseLc}`}>
                <strong>{pred.fuzzy_base_label} Risk Advisory</strong>
                <span>{pred.intervention_note}</span>
              </div>
              <div className="fl-detail-grid">
                <div className="fl-drow"><span className="fl-dkey">Spread Factor</span><span className="fl-dval">{pred.spread_factor.toFixed(4)}</span></div>
                <div className="fl-drow"><span className="fl-dkey">Intervention Mult.</span><span className="fl-dval">×{pred.intervention_multiplier.toFixed(4)}</span></div>
                <div className="fl-drow"><span className="fl-dkey">Base Risk Label</span><span className="fl-dval">{pred.fuzzy_base_label}</span></div>
                <div className="fl-drow"><span className="fl-dkey">Total Trees</span><span className="fl-dval">{pred.inputs.total_trees.toLocaleString()}</span></div>
              </div>

              <div className="fl-risk-subbox">
                <div className="fl-risk-subbox-header">
                  <span className="fl-risk-subbox-eyebrow">Adjusted Risk Score</span>
                  <span className={`fl-badge-pill ${adjLc}`} style={{ fontSize: '10px', padding: '4px 12px' }}>
                    {pred.adjusted_risk_label}
                  </span>
                </div>
                <div className="fl-risk-subbox-body">
                  <div className="fl-risk-subbox-score-row">
                    <div className={`fl-risk-subbox-num ${adjLc}`}>
                      {adjScoreAnim.toFixed(2)}%
                    </div>
                    <div className="fl-risk-subbox-trees">
                      <div className="fl-risk-tree-item">
                        <span className="fl-risk-tree-l">Estimated Infected</span>
                        <span className="fl-risk-tree-v">{Math.round(infectedAnim).toLocaleString()} trees</span>
                      </div>
                      <div className="fl-risk-tree-item">
                        <span className="fl-risk-tree-l">Estimated Healthy</span>
                        <span className="fl-risk-tree-v">{Math.round(healthyAnim).toLocaleString()} trees</span>
                      </div>
                    </div>
                  </div>
                  <p className="fl-risk-subbox-note">
                    Possible degree of infestation if the farm is left unattended under current conditions for a prolonged period.
                    Score is calibrated using intervention delay multiplier and sigmoid spread factor.
                  </p>
                </div>
              </div>
            </div>

            {showSpread && (
              <div style={{ marginTop: '20px' }}>
                <button className="fl-spread-trigger" onClick={openSpreadMap} disabled={spreadLoading}>
                  {spreadLoading
                    ? <><div className="fl-spin" style={{ display: 'inline-block' }} /> Loading map…</>
                    : <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                      </svg>
                      {showSpreadCard ? 'Refresh Spread Visualization' : 'View locations with possible infestation spread'}
                    </>
                  }
                </button>

                {showSpreadCard && cone && (
                  <div className="fl-spread-card" ref={spreadCardRef}>
                    <div className="fl-spread-header">
                      <div>
                        <div className="fl-spread-title">Spread <em>Visualization</em></div>
                        <div className="fl-spread-sub">
                          Crawlers dispersing {cone.wind_to_compass}-ward · cone ±{cone.cone_half_angle}° wide
                        </div>
                      </div>
                      <div className="fl-wind-chips">
                        <div className="fl-wchip"><span className="fl-wchip-l">Wind Blows From</span><span className="fl-wchip-v">{cone.wind_from_compass} · {cone.wind_from_deg}°</span></div>
                        <div className="fl-wchip"><span className="fl-wchip-l">Crawlers Travel To</span><span className="fl-wchip-v">{cone.wind_to_compass} · {cone.wind_to_bearing}°</span></div>
                        <div className="fl-wchip"><span className="fl-wchip-l">Wind Speed</span><span className="fl-wchip-v">{wx.wind_speed_kmh} km/h</span></div>
                        <div className="fl-wchip"><span className="fl-wchip-l">Cone Length</span><span className="fl-wchip-v">{cone.cone_length_km} km</span></div>
                      </div>
                    </div>
                    <div className="fl-spread-map-wrap">
                      <MapContainer center={cone.origin} zoom={13} style={{ width: '100%', height: '480px' }}
                        zoomControl={true} attributionControl={true}>
                        <TileLayer
                          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
                          subdomains="abcd" maxZoom={19}
                        />
                        <SpreadLayers cone={cone} pred={pred} />
                      </MapContainer>
                    </div>
                    <div className="fl-spread-legend">
                      <div className="fl-leg-item">
                        <div className="fl-leg-dot" style={{ background: '#2e8b4a', boxShadow: '0 0 6px rgba(46,139,74,0.5)' }} />
                        Origin (Infected Farm)
                      </div>
                      <div className="fl-leg-item">
                        <div className="fl-leg-sw" style={{ background: 'rgba(232,164,64,0.3)', border: '1px solid rgba(232,164,64,0.7)' }} />
                        Spread Cone
                      </div>
                      <div className="fl-leg-item">
                        <div className="fl-leg-sw" style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.6)' }} />
                        High-Risk Core
                      </div>
                      <div className="fl-leg-item">
                        <svg width="24" height="12" viewBox="0 0 24 12">
                          <line x1="0" y1="6" x2="18" y2="6" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,3" />
                          <polygon points="16,2 24,6 16,10" fill="#3b82f6" />
                        </svg>
                        Wind Direction
                      </div>
                    </div>
                    <div className="fl-spread-meta">
                      <div className="fl-drow"><span className="fl-dkey">Cone Length</span><span className="fl-dval">{cone.cone_length_km} km</span></div>
                      <div className="fl-drow"><span className="fl-dkey">Cone Width</span><span className="fl-dval">±{cone.cone_half_angle}°</span></div>
                      <div className="fl-drow"><span className="fl-dkey">Wind From</span><span className="fl-dval">{cone.wind_from_compass} · {cone.wind_from_deg}°</span></div>
                      <div className="fl-drow"><span className="fl-dkey">Dispersal Bearing</span><span className="fl-dval">{cone.wind_to_compass} · {cone.wind_to_bearing}°</span></div>
                      <div className="fl-drow wide" style={{ background: 'rgba(46,139,74,0.04)', borderColor: 'rgba(46,139,74,0.18)', gap: '12px', flexWrap: 'wrap' }}>
                        <span className="fl-dkey">PCA Guidance</span>
                        <span className="fl-dval" style={{ color: '#5a8068', fontWeight: 400, fontSize: '11px', textAlign: 'right', flex: 1 }}>{guidance}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <footer className="fl-footer">
          <span>CocolisapScan · 81-Rule Mamdani Inference</span>
        </footer>
      </div>
    </div>
  );
}