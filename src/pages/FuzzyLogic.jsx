// ─────────────────────────────────────────────────────────
// FUZZYLOGIC.JSX — HOW TO USE PATCH
// In your FuzzyLogic.jsx, find this line in the JSX return:
//
//   <div className="fl-divider" />
//
//   <div className="fl-mode-toggle">
//
// Insert the following block BETWEEN those two lines:
// ─────────────────────────────────────────────────────────

{/* How to Use */}
<div style={{ background:'#fff', border:'1px solid rgba(46,139,74,0.18)', borderRadius:16, padding:'18px 22px', marginBottom:24, position:'relative', overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#2e8b4a,transparent)' }} />
  <span style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--text-dim)', marginBottom:12, display:'block' }}>How to Use — Fuzzy Logic Analyzer</span>
  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
    {[
      { n:1, t:'Choose a mode', d:"Manual lets you type in values directly. Smart Location fetches live weather from your farm's address." },
      { n:2, t:'Enter farm data', d:'Fill in planting density, total trees, and days without intervention.' },
      { n:3, t:'Get weather (Smart only)', d:'Select your location then click "Get Weather Data" to auto-fill temperature, humidity, and wind.' },
      { n:4, t:'Analyze & view results', d:'Click Analyze Infestation to get the fuzzy risk score. In Smart mode, view the spread cone map after.' },
    ].map(s => (
      <div key={s.n} style={{ display:'flex', alignItems:'flex-start', gap:10, flex:1, minWidth:180 }}>
        <div style={{ width:20, height:20, borderRadius:'50%', background:'#2e8b4a', color:'#fff', fontFamily:"var(--mono)", fontSize:10, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>{s.n}</div>
        <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.5 }}><strong style={{ color:'var(--text)', fontWeight:600, display:'block', marginBottom:2 }}>{s.t}</strong>{s.d}</div>
      </div>
    ))}
  </div>
</div>

// ─────────────────────────────────────────────────────────
// ALSO: Change the badge text from:
//   YOLOv11 Instance Segmentation
// to:
//   YOLOv26 Instance Segmentation
// ─────────────────────────────────────────────────────────