import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Cpu, Search, BarChart3 } from 'lucide-react';

export default function ProcessingOverlay({ stage }) {
    const stages = [
        { key: 'uploading', label: 'Uploading image...', icon: Loader2 },
        { key: 'preprocessing', label: 'Preprocessing...', icon: Cpu },
        { key: 'detecting', label: 'Running YOLOv8 detection...', icon: Search },
        { key: 'analyzing', label: 'Analyzing results...', icon: BarChart3 },
    ];

    const currentIndex = stages.findIndex(s => s.key === stage);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <Search className="w-10 h-10 text-emerald-600" />
                            </motion.div>
                        </div>
                        <motion.div
                            className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-stone-800 mb-2">
                        Processing Image
                    </h3>
                    <p className="text-stone-500 text-sm mb-6">
                        Please wait while we analyze your image
                    </p>
                    
                    <div className="w-full space-y-3">
                        {stages.map((s, index) => {
                            const Icon = s.icon;
                            const isActive = index === currentIndex;
                            const isComplete = index < currentIndex;
                            
                            return (
                                <div
                                    key={s.key}
                                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                        isActive 
                                            ? 'bg-emerald-50 border border-emerald-200' 
                                            : isComplete 
                                                ? 'bg-stone-50 opacity-60' 
                                                : 'opacity-40'
                                    }`}
                                >
                                    <div className={`p-1.5 rounded-lg ${
                                        isActive ? 'bg-emerald-100' : 'bg-stone-100'
                                    }`}>
                                        <Icon className={`w-4 h-4 ${
                                            isActive 
                                                ? 'text-emerald-600 animate-pulse' 
                                                : isComplete 
                                                    ? 'text-emerald-500' 
                                                    : 'text-stone-400'
                                        }`} />
                                    </div>
                                    <span className={`text-sm ${
                                        isActive 
                                            ? 'text-emerald-700 font-medium' 
                                            : 'text-stone-500'
                                    }`}>
                                        {s.label}
                                    </span>
                                    {isComplete && (
                                        <span className="ml-auto text-emerald-500 text-xs">✓</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}