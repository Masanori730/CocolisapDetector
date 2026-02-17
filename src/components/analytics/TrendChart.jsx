import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function TrendChart({ detections, dateRange }) {
    const chartData = useMemo(() => {
        const grouped = {};
        
        detections.forEach(d => {
            const date = new Date(d.created_date);
            const key = date.toISOString().split('T')[0]; // YYYY-MM-DD
            
            if (!grouped[key]) {
                grouped[key] = { date: key, severe: 0, moderate: 0, low: 0, total: 0 };
            }
            
            grouped[key][d.severity]++;
            grouped[key].total++;
        });
        
        return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    }, [detections]);

    return (
        <div className="bg-white rounded-xl border border-stone-200 p-6">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-stone-800">Detection Trends Over Time</h3>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        labelFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString();
                        }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="severe" stroke="#dc2626" strokeWidth={2} name="Severe" />
                    <Line type="monotone" dataKey="moderate" stroke="#f59e0b" strokeWidth={2} name="Moderate" />
                    <Line type="monotone" dataKey="low" stroke="#059669" strokeWidth={2} name="Low" />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} name="Total" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}