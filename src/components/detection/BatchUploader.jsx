import React, { useCallback, useState } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

export default function BatchUploader({ onBatchProcess, isProcessing }) {
    const [files, setFiles] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [currentProcessing, setCurrentProcessing] = useState(0);

    const handleFiles = useCallback((newFiles) => {
        const imageFiles = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
        
        const filesWithPreview = imageFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            id: Math.random().toString(36).substr(2, 9),
            status: 'pending'
        }));
        
        setFiles(prev => [...prev, ...filesWithPreview]);
    }, []);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
        }
    }, [handleFiles]);

    const handleChange = useCallback((e) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    }, [handleFiles]);

    const removeFile = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const clearAll = () => {
        files.forEach(f => URL.revokeObjectURL(f.preview));
        setFiles([]);
    };

    const handleProcessAll = async () => {
        if (files.length === 0) return;
        
        const filesToProcess = files.map(f => ({
            file: f.file,
            preview: f.preview,
            id: f.id
        }));
        
        await onBatchProcess(filesToProcess, (index) => {
            setCurrentProcessing(index + 1);
        });
        
        setCurrentProcessing(0);
    };

    const progress = isProcessing ? (currentProcessing / files.length) * 100 : 0;

    return (
        <div className="space-y-4">
            <label
                className={cn(
                    "relative flex flex-col items-center justify-center w-full min-h-[150px]",
                    "border-2 border-dashed rounded-xl cursor-pointer transition-all",
                    dragActive 
                        ? "border-emerald-500 bg-emerald-50" 
                        : "border-stone-300 hover:border-emerald-400 bg-stone-50"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleChange}
                    disabled={isProcessing}
                />
                <Upload className={cn("w-8 h-8 mb-2", dragActive ? "text-emerald-500" : "text-stone-400")} />
                <p className="text-sm text-stone-600 font-medium">Drop multiple images here</p>
                <p className="text-xs text-stone-400">or click to browse</p>
            </label>

            {files.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-stone-700">
                            {files.length} image{files.length > 1 ? 's' : ''} selected
                        </span>
                        <Button variant="ghost" size="sm" onClick={clearAll} disabled={isProcessing}>
                            Clear All
                        </Button>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto p-1">
                        <AnimatePresence>
                            {files.map((f, index) => (
                                <motion.div
                                    key={f.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="relative aspect-square rounded-lg overflow-hidden bg-stone-100 group"
                                >
                                    <img src={f.preview} alt="" className="w-full h-full object-cover" />
                                    {isProcessing && index < currentProcessing && (
                                        <div className="absolute inset-0 bg-emerald-500/80 flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">✓</span>
                                        </div>
                                    )}
                                    {isProcessing && index === currentProcessing && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                                        </div>
                                    )}
                                    {!isProcessing && (
                                        <button
                                            onClick={() => removeFile(f.id)}
                                            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {isProcessing && (
                        <div className="space-y-2">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-center text-stone-500">
                                Processing {currentProcessing} of {files.length}...
                            </p>
                        </div>
                    )}

                    <Button 
                        onClick={handleProcessAll}
                        disabled={isProcessing || files.length === 0}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            `Process ${files.length} Image${files.length > 1 ? 's' : ''}`
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}