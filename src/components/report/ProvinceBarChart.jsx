import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

// ─── Bar Chart ────────────────────────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const total = payload.reduce((s, p) => s + (p.value || 0), 0);
    return (
        <div style={{ background: '#fff', border: '1px solid #d6e8d6', borderRadius: 10, padding: '10px 14px', fontFamily: "'Outfit',sans-serif", fontSize: 12 }}>
            <p style={{ fontWeight: 600, color: '#1a3326', marginBottom: 6 }}>{label}</p>
            {payload.map(p => (
                <p key={p.name} style={{ color: p.fill, margin: '2px 0' }}>{p.name}: <strong>{p.value}</strong></p>
            ))}
            <p style={{ color: '#8aaa96', marginTop: 4, fontFamily: "'DM Mono',monospace", fontSize: 10 }}>Total: {total}</p>
        </div>
    );
};

export function ProvinceBarChart({ tableRows }) {
    const data = tableRows.slice(0, 10).map(r => ({
        name: r.province.length > 14 ? r.province.slice(0, 14) + '…' : r.province,
        Severe: r.severe,
        Moderate: r.moderate,
        Low: r.low,
    }));

    if (!data.length) return (
        <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8aaa96', fontSize: 13, fontFamily: "'DM Mono',monospace" }}>
            No data to display
        </div>
    );

    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 55 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eaf2ea" vertical={false} />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#5a8068', fontFamily: "'DM Mono',monospace" }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: '#8aaa96', fontFamily: "'DM Mono',monospace" }} allowDecimals={false} />
                <Tooltip content={<BarTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Mono',monospace", paddingTop: 8 }} />
                <Bar dataKey="Severe" stackId="a" fill="#dc2626" maxBarSize={48} />
                <Bar dataKey="Moderate" stackId="a" fill="#d97706" maxBarSize={48} />
                <Bar dataKey="Low" stackId="a" fill="#4caf72" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
        </ResponsiveContainer>
    );
}

// ─── Severity Pie Chart ───────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 12, fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export function SeverityPieChart({ detections }) {
    const severe = detections.filter(d => d.severity === 'severe').length;
    const moderate = detections.filter(d => d.severity === 'moderate').length;
    const low = detections.filter(d => d.severity === 'low').length;
    const total = detections.length;

    if (!total) return (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8aaa96', fontSize: 13, fontFamily: "'DM Mono',monospace" }}>
            No data to display
        </div>
    );

    const data = [
        { name: 'Severe', value: severe, color: '#dc2626' },
        { name: 'Moderate', value: moderate, color: '#d97706' },
        { name: 'Low', value: low, color: '#4caf72' },
    ].filter(d => d.value > 0);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'center', padding: '8px 0' }}>
            <PieChart width={200} height={200}>
                <Pie
                    data={data}
                    cx={100} cy={100}
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomLabel}
                >
                    {data.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value, name) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, name]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #d6e8d6', fontSize: 12, fontFamily: "'Outfit',sans-serif" }}
                />
            </PieChart>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a3326' }}>{d.name}</div>
                            <div style={{ fontSize: 11, color: '#8aaa96', fontFamily: "'DM Mono',monospace" }}>
                                {d.value} detections · {((d.value / total) * 100).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                ))}
                <div style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid #eaf2ea' }}>
                    <div style={{ fontSize: 11, color: '#8aaa96', fontFamily: "'DM Mono',monospace" }}>Total: {total} detections</div>
                </div>
            </div>
        </div>
    );
}

// ─── Monthly Trend Line Chart ─────────────────────────────────────────────────
export function MonthlyTrendChart({ detections }) {
    if (!detections.length) return (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8aaa96', fontSize: 13, fontFamily: "'DM Mono',monospace" }}>
            No data to display
        </div>
    );

    const monthMap = {};
    detections.forEach(d => {
        const dt = new Date(d.created_date);
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        const label = dt.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!monthMap[key]) monthMap[key] = { key, label, Severe: 0, Moderate: 0, Low: 0, Total: 0 };
        monthMap[key].Total++;
        if (d.severity === 'severe') monthMap[key].Severe++;
        else if (d.severity === 'moderate') monthMap[key].Moderate++;
        else monthMap[key].Low++;
    });

    const data = Object.values(monthMap).sort((a, b) => a.key.localeCompare(b.key));

    return (
        <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eaf2ea" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#5a8068', fontFamily: "'DM Mono',monospace" }} />
                <YAxis tick={{ fontSize: 10, fill: '#8aaa96', fontFamily: "'DM Mono',monospace" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #d6e8d6', fontSize: 12, fontFamily: "'Outfit',sans-serif" }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Mono',monospace" }} />
                <Line type="monotone" dataKey="Total" stroke="#2e8b4a" strokeWidth={2.5} dot={{ r: 4, fill: '#2e8b4a' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Severe" stroke="#dc2626" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 3, fill: '#dc2626' }} />
                <Line type="monotone" dataKey="Moderate" stroke="#d97706" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 3, fill: '#d97706' }} />
                <Line type="monotone" dataKey="Low" stroke="#4caf72" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 3, fill: '#4caf72' }} />
            </LineChart>
        </ResponsiveContainer>
    );
}

// Default export for backward compatibility
export default ProvinceBarChart;