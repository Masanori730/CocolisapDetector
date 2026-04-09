// ─────────────────────────────────────────────────────────
// DATAEXPORT.JSX — HOW TO USE PATCH
// In your DataExport.jsx, find this line in the JSX return:
//
//   <div className="export-divider" />
//
//   <div className="export-card">   ← the filters card
//
// Insert the following block BETWEEN those two lines:
// ─────────────────────────────────────────────────────────

{/* How to Use */}
<div style={{ background:'#fff', border:'1px solid #d6e8d6', borderRadius:16, padding:'18px 22px', marginBottom:20, position:'relative', overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#2e8b4a,transparent)' }} />
  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'#8aaa96', marginBottom:12, display:'block' }}>How to Use — Data Export</span>
  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
    {[
      { n:1, t:'Set filters', d:'Choose a date range, province, severity (for detections), or risk level (for fuzzy assessments) to narrow your export.' },
      { n:2, t:'Check record count', d:'The matched record count updates live so you know how many rows will be exported before downloading.' },
      { n:3, t:'Choose export type', d:'Image Detection exports scan records. Fuzzy Logic exports assessments. Combined exports both together.' },
      { n:4, t:'Download', d:'Excel files open in spreadsheets with proper columns. TXT summary reports are formatted for documentation.' },
    ].map(s => (
      <div key={s.n} style={{ display:'flex', alignItems:'flex-start', gap:10, flex:1, minWidth:180 }}>
        <div style={{ width:20, height:20, borderRadius:'50%', background:'#2e8b4a', color:'#fff', fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>{s.n}</div>
        <div style={{ fontSize:12, color:'#5a8068', lineHeight:1.5 }}><strong style={{ color:'#1a3326', fontWeight:600, display:'block', marginBottom:2 }}>{s.t}</strong>{s.d}</div>
      </div>
    ))}
  </div>
</div>