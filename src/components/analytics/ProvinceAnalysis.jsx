import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { MapPin } from 'lucide-react';

export default function ProvinceAnalysis({ detections }) {
    const chartData = useMemo(() => {
        const grouped = {};
        
        detections.forEach(d => {
            if (!d.province) return;
            
            if (!grouped[d.province]) {
                grouped[d.province] = { province: d.province, severe: 0, moderate: 0, low: 0, total: 0 };
            }
            
            grouped[d.province][d.severity]++;
            grouped[d.province].total++;
        });
        
        return Object.values(grouped)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    }, [detections]);

    return (
        <div className="bg-white rounded-xl border border-stone-200 p-6">
            <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-stone-800">Top 10 Provinces by Severity</h3>
            </div>
            
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                        dataKey="province" 
                        type="category" 
                        tick={{ fontSize: 11 }}
                        width={120}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="severe" fill="#dc2626" stackId="a" name="Severe" />
                    <Bar dataKey="moderate" fill="#f59e0b" stackId="a" name="Moderate" />
                    <Bar dataKey="low" fill="#059669" stackId="a" name="Low" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}