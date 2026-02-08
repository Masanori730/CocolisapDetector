import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import { cn } from "@/lib/utils";

const severityConfig = {
    low: {
        label: 'Low Severity',
        description: 'Few cocolisap detected. Minor infestation that can be managed with basic treatment.',
        icon: CheckCircle,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        barColor: 'bg-emerald-500',
        percentage: 33,
    },
    moderate: {
        label: 'Moderate Severity',
        description: 'Multiple cocolisap detected. Noticeable infestation requiring prompt treatment.',
        icon: AlertTriangle,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        barColor: 'bg-amber-500',
        percentage: 66,
    },
    severe: {
        label: 'Severe Severity',
        description: 'Dense cocolisap infestation detected. Immediate intervention recommended.',
        icon: ShieldAlert,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        barColor: 'bg-red-500',
        percentage: 100,
    },
};

export default function SeverityIndicator({ severity, detectionCount }) {
    const config = severityConfig[severity] || severityConfig.low;
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
                "rounded-2xl border-2 p-6",
                config.bgColor,
                config.borderColor
            )}
        >
            <div className="flex items-start gap-4">
                <div className={cn(
                    "p-3 rounded-xl bg-white shadow-sm",
                    config.color
                )}>
                    <Icon className="w-6 h-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className={cn("text-xl font-semibold", config.color)}>
                            {config.label}
                        </h3>
                        <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-sm font-medium bg-white",
                            config.color
                        )}>
                            {detectionCount} detected
                        </span>
                    </div>
                    
                    <p className="text-stone-600 text-sm mb-4">
                        {config.description}
                    </p>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-stone-500">
                            <span>Severity Level</span>
                            <span>{config.percentage}%</span>
                        </div>
                        <div className="h-2 bg-white rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${config.percentage}%` }}
                                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                                className={cn("h-full rounded-full", config.barColor)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}