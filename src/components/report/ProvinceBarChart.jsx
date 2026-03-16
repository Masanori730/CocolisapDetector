import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
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

export default function ProvinceBarChart({ tableRows }) {
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
                <YAxis tick={{ fontSize: 10, fill: '#8aaa96', fontFamily: "'DM Mono',monospace" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Mono',monospace", paddingTop: 8 }} />
                <Bar dataKey="Severe" stackId="a" fill="#dc2626" />
                <Bar dataKey="Moderate" stackId="a" fill="#d97706" />
                <Bar dataKey="Low" stackId="a" fill="#4caf72" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}