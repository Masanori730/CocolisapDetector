import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function DetectionResults({ originalImage, detections }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        if (!originalImage || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw original image
            ctx.drawImage(img, 0, 0);
            
            // Draw detections
            detections.forEach((detection, index) => {
                const { bbox, confidence, label } = detection;
                const [x, y, width, height] = bbox;
                
                // Box styling
                ctx.strokeStyle = '#F59E0B';
                ctx.lineWidth = Math.max(3, img.width * 0.004);
                ctx.setLineDash([]);
                
                // Draw bounding box
                ctx.strokeRect(x, y, width, height);
                
                // Draw corner accents
                const cornerLength = Math.min(width, height) * 0.2;
                ctx.strokeStyle = '#F59E0B';
                ctx.lineWidth = Math.max(4, img.width * 0.005);
                
                // Top-left corner
                ctx.beginPath();
                ctx.moveTo(x, y + cornerLength);
                ctx.lineTo(x, y);
                ctx.lineTo(x + cornerLength, y);
                ctx.stroke();
                
                // Top-right corner
                ctx.beginPath();
                ctx.moveTo(x + width - cornerLength, y);
                ctx.lineTo(x + width, y);
                ctx.lineTo(x + width, y + cornerLength);
                ctx.stroke();
                
                // Bottom-left corner
                ctx.beginPath();
                ctx.moveTo(x, y + height - cornerLength);
                ctx.lineTo(x, y + height);
                ctx.lineTo(x + cornerLength, y + height);
                ctx.stroke();
                
                // Bottom-right corner
                ctx.beginPath();
                ctx.moveTo(x + width - cornerLength, y + height);
                ctx.lineTo(x + width, y + height);
                ctx.lineTo(x + width, y + height - cornerLength);
                ctx.stroke();
                
                // Label background
                const fontSize = Math.max(14, img.width * 0.02);
                ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
                const labelText = `${label} ${(confidence * 100).toFixed(0)}%`;
                const textMetrics = ctx.measureText(labelText);
                const padding = fontSize * 0.4;
                const labelHeight = fontSize + padding * 2;
                const labelWidth = textMetrics.width + padding * 2;
                
                // Position label above box, or below if not enough space
                let labelY = y - labelHeight - 4;
                if (labelY < 0) labelY = y + height + 4;
                
                // Draw label background
                ctx.fillStyle = '#F59E0B';
                ctx.beginPath();
                ctx.roundRect(x, labelY, labelWidth, labelHeight, 4);
                ctx.fill();
                
                // Draw label text
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(labelText, x + padding, labelY + fontSize + padding * 0.5);
                
                // Draw detection number
                const numSize = Math.max(12, img.width * 0.015);
                ctx.font = `bold ${numSize}px Inter, system-ui, sans-serif`;
                const numText = `#${index + 1}`;
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillText(numText, x + 4, y + height - 4);
            });
            
            setImageLoaded(true);
        };
        
        img.src = originalImage;
    }, [originalImage, detections]);

    const handleDownload = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = 'cocolisap-detection-result.png';
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleResetZoom = () => setZoom(1);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
        >
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-stone-800">
                    Detection Result
                </h3>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-stone-100 rounded-lg p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomOut}
                            className="h-8 w-8 p-0"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span className="px-2 text-sm font-medium text-stone-600 min-w-[50px] text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomIn}
                            className="h-8 w-8 p-0"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetZoom}
                            className="h-8 w-8 p-0"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button
                        onClick={handleDownload}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download</span>
                    </Button>
                </div>
            </div>
            
            <div 
                ref={containerRef}
                className="relative rounded-2xl overflow-auto bg-stone-900 shadow-xl p-4"
                style={{ maxHeight: '600px' }}
            >
                <div 
                    style={{ 
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top left',
                        transition: 'transform 0.2s ease-out'
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        className="rounded-lg"
                        style={{ 
                            display: imageLoaded ? 'block' : 'none',
                        }}
                    />
                </div>
            </div>
            
            {detections.length > 0 && (
                <div className="bg-stone-50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-stone-700 mb-3">Detection Details</h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {detections.map((detection, index) => (
                            <div 
                                key={index}
                                className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-stone-200"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                                        {index + 1}
                                    </span>
                                    <span className="font-medium text-stone-700">{detection.label}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-stone-500">
                                        Confidence: <span className="font-semibold text-emerald-600">{(detection.confidence * 100).toFixed(1)}%</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}