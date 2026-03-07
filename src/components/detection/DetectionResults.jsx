import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";



function mapFromLetterbox640(x, y, w, h, origW, origH) {
    const MODEL = 640;
    const r = Math.min(MODEL / origW, MODEL / origH);
    const newW = origW * r;
    const newH = origH * r;
    const padX = (MODEL - newW) / 2;
    const padY = (MODEL - newH) / 2;

    x -= padX; y -= padY;
    x /= r; y /= r;
    w /= r; h /= r;

    return { x, y, w, h };
}

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
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.style.aspectRatio = `${img.width} / ${img.height}`;
            
            // Draw original image
            ctx.drawImage(img, 0, 0);
            
            // Debug
            console.log('img:', img.width, img.height, 'bbox:', detections?.[0]?.bbox);

            // Sort by confidence descending; label only the top N to reduce clutter
            const MAX_LABELS = 30;
            const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
            const labelSet = new Set(sorted.slice(0, MAX_LABELS).map((_, i) => i));
            // Map original detection to its rank so we know which to label
            const detectionRankMap = new Map();
            sorted.forEach((det, rank) => detectionRankMap.set(det, rank));

            // Pass 1: draw all masks/boxes first (no labels)
            detections.forEach((detection) => {
                const [x, y, width, height] = detection.bbox;

                if (detection.points && detection.points.length > 0) {
                    ctx.beginPath();
                    ctx.moveTo(detection.points[0].x, detection.points[0].y);
                    detection.points.forEach((point) => ctx.lineTo(point.x, point.y));
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
                    ctx.fill();
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                } else {
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, width, height);
                }
            });

            // Pass 2: draw labels only for top MAX_LABELS detections
            const fontSize = Math.max(9, Math.min(img.width * 0.013, 14));
            ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;

            sorted.slice(0, MAX_LABELS).forEach((detection) => {
                const [x, y, width, height] = detection.bbox;
                const labelText = `${detection.label} ${(detection.confidence * 100).toFixed(0)}%`;
                const padding = fontSize * 0.35;
                const labelW = ctx.measureText(labelText).width + padding * 2;
                const labelH = fontSize + padding * 2;

                let labelX, labelY;

                if (detection.points && detection.points.length > 0) {
                    // Center label on polygon centroid
                    const cx = detection.points.reduce((sum, p) => sum + p.x, 0) / detection.points.length;
                    const cy = detection.points.reduce((sum, p) => sum + p.y, 0) / detection.points.length;
                    labelX = cx - labelW / 2;
                    labelY = cy - labelH / 2;
                } else {
                    // Above bounding box
                    labelX = x;
                    labelY = y - labelH - 2;
                    if (labelY < 0) labelY = y + 2;
                }

                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.roundRect(labelX, labelY, labelW, labelH, 3);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.fillText(labelText, labelX + padding, labelY + fontSize + padding * 0.5);
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
                className="relative rounded-2xl overflow-hidden shadow-2xl bg-stone-900"
                style={{ width: '100%' }}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        display: imageLoaded ? 'block' : 'none',
                        width: '100%',
                        height: 'auto',
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top center',
                        transition: 'transform 0.2s ease-out',
                    }}
                />
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