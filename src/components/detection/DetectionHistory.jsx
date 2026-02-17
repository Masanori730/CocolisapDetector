import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { History, Trash2, FileText, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DetectionHistory({ detections, onSelect, onDelete, onGenerateReport, onClearAll }) {
    const severityColors = {
        low: 'bg-green-100 text-green-700',
        moderate: 'bg-yellow-100 text-yellow-700',
        severe: 'bg-red-100 text-red-700'
    };

    if (!detections || detections.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 text-center">
                <History className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="font-semibold text-stone-500">No Detection History</h3>
                <p className="text-sm text-stone-400 mt-1">Your past detections will appear here</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-stone-100">
                <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-stone-800">Detection History</h3>
                    <Badge variant="secondary" className="ml-auto">{detections.length}</Badge>
                </div>
                {detections.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={onClearAll}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All History
                    </Button>
                )}
            </div>
            
            <ScrollArea className="h-[400px]">
                <div className="p-3 space-y-3">
                    {detections.map((detection, index) => (
                        <motion.div
                            key={detection.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex gap-3 p-3 rounded-xl border border-stone-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group"
                        >
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                                <img 
                                    src={detection.image_url} 
                                    alt="Detection" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge className={severityColors[detection.severity]}>
                                        {detection.severity}
                                    </Badge>
                                    <span className="text-xs text-stone-400">
                                        {detection.total_detections} detections
                                    </span>
                                </div>
                                <p className="text-xs text-stone-500">
                                    {format(new Date(detection.created_date), 'MMM d, yyyy • h:mm a')}
                                </p>
                                <p className="text-xs text-stone-400 mt-1">
                                    Avg. confidence: {((detection.avg_confidence || 0) * 100).toFixed(1)}%
                                </p>
                            </div>
                            
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={() => onSelect(detection)}
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={() => onGenerateReport(detection)}
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-red-500 hover:text-red-600"
                                    onClick={() => onDelete(detection.id)}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}