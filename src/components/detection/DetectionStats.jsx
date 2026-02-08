import React from 'react';
import { motion } from 'framer-motion';
import { Target, Percent, Clock, Layers } from 'lucide-react';

export default function DetectionStats({ stats }) {
    const statItems = [
        {
            label: 'Total Detections',
            value: stats.totalDetections,
            icon: Target,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
        {
            label: 'Avg. Confidence',
            value: `${(stats.avgConfidence * 100).toFixed(1)}%`,
            icon: Percent,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            label: 'Processing Time',
            value: `${stats.processingTime}ms`,
            icon: Clock,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            label: 'Model',
            value: 'YOLOv8',
            icon: Layers,
            color: 'text-stone-600',
            bgColor: 'bg-stone-100',
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statItems.map((item, index) => {
                const Icon = item.icon;
                return (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${item.bgColor}`}>
                                <Icon className={`w-4 h-4 ${item.color}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-stone-500 truncate">{item.label}</p>
                                <p className={`text-lg font-semibold ${item.color}`}>{item.value}</p>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}