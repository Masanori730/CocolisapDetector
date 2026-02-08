import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X, Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageUploader({ onImageSelect, isProcessing }) {
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState(null);
    const [fileName, setFileName] = useState('');

    const handleFile = useCallback((file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target.result);
                setFileName(file.name);
                onImageSelect(file, e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }, [onImageSelect]);

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
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    const handleChange = useCallback((e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    }, [handleFile]);

    const handlePaste = useCallback((e) => {
        const items = e.clipboardData?.items;
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    handleFile(file);
                    break;
                }
            }
        }
    }, [handleFile]);

    const clearImage = () => {
        setPreview(null);
        setFileName('');
        onImageSelect(null, null);
    };

    React.useEffect(() => {
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {!preview ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        key="upload"
                    >
                        <label
                            className={cn(
                                "relative flex flex-col items-center justify-center w-full min-h-[280px] md:min-h-[320px]",
                                "border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300",
                                "bg-gradient-to-b from-stone-50 to-stone-100/50",
                                dragActive 
                                    ? "border-emerald-500 bg-emerald-50/50 scale-[1.02]" 
                                    : "border-stone-300 hover:border-emerald-400 hover:bg-stone-50"
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
                                onChange={handleChange}
                                disabled={isProcessing}
                            />
                            
                            <div className="flex flex-col items-center gap-4 p-8 text-center">
                                <div className={cn(
                                    "p-4 rounded-2xl transition-all duration-300",
                                    dragActive ? "bg-emerald-100" : "bg-white shadow-sm"
                                )}>
                                    <Upload className={cn(
                                        "w-10 h-10 transition-colors",
                                        dragActive ? "text-emerald-600" : "text-stone-400"
                                    )} />
                                </div>
                                
                                <div className="space-y-2">
                                    <p className="text-lg font-medium text-stone-700">
                                        Drop your image here
                                    </p>
                                    <p className="text-sm text-stone-500">
                                        or click to browse • Ctrl+V to paste
                                    </p>
                                </div>
                                
                                <div className="flex items-center gap-2 text-xs text-stone-400">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>PNG, JPG, JPEG up to 10MB</span>
                                </div>
                            </div>
                        </label>
                        
                        <div className="mt-4 flex justify-center">
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleChange}
                                    disabled={isProcessing}
                                />
                                <Button variant="outline" className="gap-2" asChild>
                                    <span>
                                        <Camera className="w-4 h-4" />
                                        Take Photo
                                    </span>
                                </Button>
                            </label>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key="preview"
                        className="relative"
                    >
                        <div className="relative rounded-2xl overflow-hidden bg-stone-100 shadow-lg">
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-auto max-h-[400px] object-contain"
                            />
                            
                            {!isProcessing && (
                                <button
                                    onClick={clearImage}
                                    className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            )}
                        </div>
                        
                        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-stone-500">
                            <ImageIcon className="w-4 h-4" />
                            <span className="truncate max-w-[200px]">{fileName}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}