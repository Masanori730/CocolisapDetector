import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

const styles = `
    .dd-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(2px); }
    .dd-modal { background:#fff; border-radius:20px; padding:32px; max-width:720px; width:100%; max-height:85vh; overflow-y:auto; position:relative; box-shadow:0 20px 60px rgba(0,0,0,0.18); }
    .dd-close { position:absolute; top:16px; right:16px; width:32px; height:32px; border-radius:8px; border:1px solid #d6e8d6; background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#5a8068; transition:background .2s; }
    .dd-close:hover { background:#f4f7f4; }
    .dd-province { font-family:'DM Serif Display',serif; font-size:26px; color:#1a3326; margin:0 0 4px; letter-spacing:-.02em; }
    .dd-province em { font-style:italic; color:#2e8b4a; }
    .dd-sub { font-family:'DM Mono',monospace; font-size:11px; color:#8aaa96; margin-bottom:20px; }
    .dd-stat-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
    @media(max-width:500px){ .dd-stat-row{grid-template-columns:1fr 1fr;} }
    .dd-stat { background:#f8fbf8; border:1px solid #eaf2ea; border-radius:12px; padding:14px 16px; }
    .dd-stat-label { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:#8aaa96; margin-bottom:4px; }
    .dd-stat-value { font-family:'DM Serif Display',serif; font-size:24px; line-height:1; }
    .dd-section-title { font-size:13px; font-weight:600; color:#1a3326; margin:0 0 14px; }
    .dd-divider { height:1px; background:#eaf2ea; margin:20px 0; }
    .dd-recent-item { padding:10px 0; border-bottom:1px solid #f0f6f0; display:flex; align-items:center; justify-content:space-between; }
    .dd-recent-item:last-child { border:0; }
    .dd-pill { display:inline-flex; align-items:center; border-radius:100px; padding:2px 9px; font-size:10px; font-weight:600; letter-spacing:.05em; }
    .dd-pill.severe { background:rgba(220,38,38,.10); color:#dc2626; border:1px solid rgba(220,38,38,.25); }
    .dd-pill.moderate { background:rgba(217,119,6,.10); color:#d97706; border:1px solid rgba(217,119,6,.25); }
    .dd-pill.low { background:rgba(46,139,74,.10); color:#2e8b4a; border:1px solid rgba(46,139,74,.25); }
`;

export default function ProvinceDrillDown({ province, detections, onClose }) {
    const monthlyData = useMemo(() => {
        const map = {};
        detections.forEach(d => {
            const key = format(new Date(d.created_date), 'MMM yy');
            if (!map[key]) map[key] = { month: key, Severe: 0, Moderate: 0, Low: 0, total: 0, _date: new Date(d.created_date) };
            map[key].total++;
            if (d.severity === 'severe') map[key].Severe++;
            else if (d.severity === 'moderate') map[key].Moderate++;
            else map[key].Low++;
        });
        return Object.values(map).sort((a, b) => a._date - b._date);
    }, [detections]);

    const severe = detections.filter(d => d.severity === 'severe').length;
    const moderate = detections.filter(d => d.severity === 'moderate').length;
    const low = detections.filter(d => d.severity === 'low').length;
    const total = detections.length;
    const severePct = total > 0 ? ((severe / total) * 100).toFixed(1) : '0.0';
    const recent = [...detections].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5);

    return (
        <div className="dd-overlay" onClick={e => { if (e.target.classList.contains('dd-overlay')) onClose(); }}>
            <style>{styles}</style>
            <div className="dd-modal">
                <button className="dd-close" onClick={onClose}><X style={{ width: 14, height: 14 }} /></button>
                <h2 className="dd-province"><em>{province}</em></h2>
                <p className="dd-sub">Province detail — {total} total detection{total !== 1 ? 's' : ''}</p>

                <div className="dd-stat-row">
                    <div className="dd-stat">
                        <div className="dd-stat-label">Total</div>
                        <div className="dd-stat-value" style={{ color: '#2e8b4a' }}>{total}</div>
                    </div>
                    <div className="dd-stat">
                        <div className="dd-stat-label">Severe</div>
                        <div className="dd-stat-value" style={{ color: '#dc2626' }}>{severe}</div>
                    </div>
                    <div className="dd-stat">
                        <div className="dd-stat-label">Moderate</div>
                        <div className="dd-stat-value" style={{ color: '#d97706' }}>{moderate}</div>
                    </div>
                    <div className="dd-stat">
                        <div className="dd-stat-label">Severe %</div>
                        <div className="dd-stat-value" style={{ color: parseFloat(severePct) >= 50 ? '#dc2626' : '#1a3326', fontSize: 20 }}>{severePct}%</div>
                    </div>
                </div>

                {monthlyData.length > 0 && (
                    <>
                        <p className="dd-section-title">Monthly Detection Trend</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eaf2ea" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#5a8068', fontFamily: "'DM Mono',monospace" }} />
                                <YAxis tick={{ fontSize: 10, fill: '#8aaa96' }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #d6e8d6', fontSize: 12, fontFamily: "'Outfit',sans-serif" }} />
                                <Legend wrapperStyle={{ fontSize: 10, fontFamily: "'DM Mono',monospace" }} />
                                <Bar dataKey="Severe" stackId="a" fill="#dc2626" />
                                <Bar dataKey="Moderate" stackId="a" fill="#d97706" />
                                <Bar dataKey="Low" stackId="a" fill="#4caf72" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="dd-divider" />
                    </>
                )}

                {recent.length > 0 && (
                    <>
                        <p className="dd-section-title">Recent Detections</p>
                        {recent.map(d => (
                            <div key={d.id} className="dd-recent-item">
                                <div>
                                    <span className={`dd-pill ${d.severity}`}>{d.severity}</span>
                                    {d.farmName && <span style={{ marginLeft: 8, fontSize: 12, color: '#1a3326' }}>{d.farmName}</span>}
                                    {d.municipality && <span style={{ marginLeft: 6, fontSize: 11, color: '#8aaa96', fontFamily: "'DM Mono',monospace" }}>{d.municipality}</span>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#2e8b4a' }}>{d.total_detections} insects</span>
                                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#8aaa96' }}>{format(new Date(d.created_date), 'MMM d, yyyy')}</span>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}