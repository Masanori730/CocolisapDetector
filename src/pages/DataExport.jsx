{/* HOW TO USE — replace the old inline how-to div with this */}
                <div style={{ background:'#fff', border:'1px solid rgba(46,139,74,0.18)', borderRadius:16, marginBottom:24, position:'relative', overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#2e8b4a,transparent)' }} />
                    <div style={{ padding:'18px 24px 0' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(46,139,74,0.10)', border:'1px solid rgba(46,139,74,0.25)', borderRadius:100, padding:'3px 10px', fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:'.12em', color:'#2e8b4a', textTransform:'uppercase' }}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4.5" stroke="#2e8b4a"/><path d="M5 4.5v3M5 3h.01" stroke="#2e8b4a" strokeWidth="1.2" strokeLinecap="round"/></svg>
                            How to Use
                        </span>
                        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:17, fontWeight:400, color:'#1a3326', margin:'8px 0 2px' }}>Exporting Records to Excel</div>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'#8aaa96', marginBottom:18 }}>Filter, preview, and download detection or assessment data as formatted Excel files.</div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderTop:'1px solid #eaf2ea' }}>
                        {[
                            { n:1, t:'Set your filters', d:'Choose a date range, province, severity level, or fuzzy risk level to narrow down which records to include.' },
                            { n:2, t:'Preview the data', d:'The live tables show exactly which records match your filters. Check these before downloading.' },
                            { n:3, t:'Pick an export type', d:'Choose Image Detection, Fuzzy Logic, or Combined Report — each downloads a formatted Excel file.' },
                            { n:4, t:'Download & submit', d:'Files include colored headers, frozen rows, auto-sized columns, and alternating row colors for easy reading.' },
                        ].map((s, i, arr) => (
                            <div key={s.n} style={{ padding:'18px 20px', borderRight: i < arr.length - 1 ? '1px solid #eaf2ea' : 'none', borderBottom:'1px solid #eaf2ea' }}>
                                <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#2e8b4a,#4caf72)', color:'#fff', fontFamily:"'DM Mono',monospace", fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10, boxShadow:'0 2px 8px rgba(46,139,74,0.28)' }}>{s.n}</div>
                                <div style={{ fontSize:12.5, fontWeight:600, color:'#1a3326', marginBottom:5, lineHeight:1.3 }}>{s.t}</div>
                                <div style={{ fontSize:11.5, color:'#5a8068', lineHeight:1.6, fontFamily:"'Outfit',sans-serif" }}>{s.d}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ height:16 }} />
                    <div style={{ margin:'0 24px 18px', background:'rgba(46,139,74,0.04)', border:'1px solid rgba(46,139,74,0.15)', borderRadius:10, padding:'9px 13px', display:'flex', alignItems:'flex-start', gap:8 }}>
                        <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>💡</span>
                        <span style={{ fontSize:11.5, color:'#5a8068', fontFamily:"'DM Mono',monospace", lineHeight:1.6 }}>
                            <strong style={{ color:'#2e8b4a' }}>Pro tip:</strong> Use the Combined Report for PCA submissions — it packages both detection and fuzzy data into one Excel file with two sheets.
                        </span>
                    </div>
                </div>