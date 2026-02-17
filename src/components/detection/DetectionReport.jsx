import React, { useRef, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Printer, Leaf, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function DetectionReport({ detection, open, onClose }) {
    const reportRef = useRef(null);
    const canvasRef = useRef(null);
    const [imageWithBoxes, setImageWithBoxes] = useState(null);

    useEffect(() => {
        if (!detection || !open) return;

        const detections = detection.detections_data 
            ? JSON.parse(detection.detections_data) 
            : (detection.detections || []);

        if (detections.length === 0 || !detection.image_url) {
            setImageWithBoxes(detection.image_url);
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            ctx.drawImage(img, 0, 0);
            
            detections.forEach((det) => {
                const { bbox, confidence, label } = det;
                const [x, y, width, height] = bbox;
                
                ctx.strokeStyle = '#F59E0B';
                ctx.lineWidth = Math.max(3, img.width * 0.004);
                ctx.strokeRect(x, y, width, height);
                
                const fontSize = Math.max(12, img.width * 0.018);
                ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
                const labelText = `${(confidence * 100).toFixed(0)}%`;
                const textMetrics = ctx.measureText(labelText);
                const padding = fontSize * 0.3;
                const labelHeight = fontSize + padding * 2;
                const labelWidth = textMetrics.width + padding * 2;
                
                let labelY = y - labelHeight - 2;
                if (labelY < 0) labelY = y + height + 2;
                
                ctx.fillStyle = '#F59E0B';
                ctx.fillRect(x, labelY, labelWidth, labelHeight);
                
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(labelText, x + padding, labelY + fontSize + padding * 0.4);
            });
            
            setImageWithBoxes(canvas.toDataURL('image/png'));
        };
        img.src = detection.image_url;
    }, [detection, open]);

    if (!detection) return null;

    const handlePrint = () => {
        const printContent = reportRef.current.innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Cocolisap Detection Report</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { 
                            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
                            padding: 0; 
                            background: #fff;
                            color: #1f2937;
                            line-height: 1.5;
                        }
                        .report-container { max-width: 800px; margin: 0 auto; padding: 40px; }
                        
                        .header { 
                            text-align: center; 
                            padding-bottom: 24px; 
                            margin-bottom: 32px; 
                            border-bottom: 3px solid #059669;
                        }
                        .header-logo { 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            gap: 12px;
                            margin-bottom: 8px;
                        }
                        .header h1 { 
                            color: #059669; 
                            font-size: 28px; 
                            font-weight: 700;
                            letter-spacing: -0.5px;
                        }
                        .header-subtitle { 
                            color: #6b7280; 
                            font-size: 14px;
                            margin-top: 4px;
                        }
                        .report-meta {
                            display: flex;
                            justify-content: space-between;
                            margin-top: 16px;
                            font-size: 13px;
                            color: #6b7280;
                        }
                        
                        .section { margin-bottom: 28px; }
                        .section-title { 
                            font-size: 16px;
                            font-weight: 600;
                            color: #374151; 
                            padding-bottom: 10px;
                            margin-bottom: 16px;
                            border-bottom: 2px solid #e5e7eb;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                        
                        .stats-grid { 
                            display: grid; 
                            grid-template-columns: repeat(4, 1fr); 
                            gap: 16px; 
                        }
                        .stat-box { 
                            background: #f9fafb; 
                            padding: 16px; 
                            border-radius: 8px;
                            border: 1px solid #e5e7eb;
                            text-align: center;
                        }
                        .stat-label { 
                            font-size: 11px; 
                            color: #6b7280; 
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            margin-bottom: 4px;
                        }
                        .stat-value { 
                            font-size: 24px; 
                            font-weight: 700; 
                            color: #111827; 
                        }
                        .severity-low { color: #059669; }
                        .severity-moderate { color: #d97706; }
                        .severity-severe { color: #dc2626; }
                        
                        .image-section {
                            background: #f9fafb;
                            border-radius: 12px;
                            padding: 20px;
                            border: 1px solid #e5e7eb;
                        }
                        .image-container { 
                            text-align: center;
                        }
                        .image-container img { 
                            max-width: 100%; 
                            max-height: 350px; 
                            border-radius: 8px;
                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        }
                        .image-caption {
                            font-size: 12px;
                            color: #6b7280;
                            margin-top: 12px;
                            font-style: italic;
                        }
                        
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            font-size: 14px;
                        }
                        th { 
                            background: #f3f4f6; 
                            font-weight: 600; 
                            text-align: left;
                            padding: 12px 16px;
                            border-bottom: 2px solid #e5e7eb;
                            font-size: 12px;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            color: #4b5563;
                        }
                        td { 
                            padding: 12px 16px; 
                            border-bottom: 1px solid #e5e7eb; 
                        }
                        tr:last-child td { border-bottom: none; }
                        tr:hover { background: #f9fafb; }
                        
                        .confidence-bar {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }
                        .confidence-fill {
                            height: 8px;
                            background: #059669;
                            border-radius: 4px;
                        }
                        
                        .recommendations {
                            background: #fefce8;
                            border: 1px solid #fde047;
                            border-radius: 8px;
                            padding: 16px 20px;
                        }
                        .recommendations.severe {
                            background: #fef2f2;
                            border-color: #fecaca;
                        }
                        .recommendations.low {
                            background: #f0fdf4;
                            border-color: #bbf7d0;
                        }
                        .recommendations ul { 
                            padding-left: 20px; 
                            color: #374151;
                            margin: 0;
                        }
                        .recommendations li {
                            margin-bottom: 6px;
                        }
                        .recommendations li:last-child { margin-bottom: 0; }
                        
                        .footer { 
                            margin-top: 40px; 
                            padding-top: 20px; 
                            border-top: 2px solid #e5e7eb; 
                            text-align: center; 
                            font-size: 11px; 
                            color: #9ca3af;
                        }
                        .footer-brand {
                            font-weight: 600;
                            color: #059669;
                            margin-bottom: 4px;
                        }
                        
                        @media print {
                            body { padding: 0; }
                            .report-container { padding: 20px; }
                        }
                    </style>
                </head>
                <body>${printContent}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const severityClass = {
        low: 'severity-low',
        moderate: 'severity-moderate',
        severe: 'severity-severe'
    };

    const detections = detection.detections_data 
        ? JSON.parse(detection.detections_data) 
        : (detection.detections || []);

    const analysisDate = detection.created_date 
        ? format(new Date(detection.created_date), 'MMMM d, yyyy • h:mm a')
        : format(new Date(), 'MMMM d, yyyy • h:mm a');

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center justify-between">
                        <span className="text-lg">Detection Report</span>
                        <Button onClick={handlePrint} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                            <Printer className="w-4 h-4" />
                            Print Report
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div ref={reportRef} className="p-6">
                    <div className="report-container" style={{ padding: 0 }}>
                        <div className="header">
                            <div className="header-logo">
                                <span style={{ fontSize: '32px' }}>🥥</span>
                                <h1>Cocolisap Detection Report</h1>
                            </div>
                            <p className="header-subtitle">AI-Powered Coconut Scale Insect Analysis</p>
                            <div className="report-meta">
                                <span>Report ID: {detection.id?.slice(0, 8) || 'N/A'}</span>
                                <span>Analysis Date: {analysisDate}</span>
                            </div>
                        </div>

                        <div className="section">
                            <h3 className="section-title">Analysis Summary</h3>
                            <div className="stats-grid">
                                <div className="stat-box">
                                    <div className="stat-label">Severity</div>
                                    <div className={`stat-value ${severityClass[detection.severity]}`}>
                                        {detection.severity?.toUpperCase()}
                                    </div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-label">Detections</div>
                                    <div className="stat-value">{detection.total_detections}</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-label">Confidence</div>
                                    <div className="stat-value">{((detection.avg_confidence || 0) * 100).toFixed(0)}%</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-label">Process Time</div>
                                    <div className="stat-value">{detection.processing_time || 0}ms</div>
                                </div>
                            </div>
                        </div>

                        <div className="section">
                            <h3 className="section-title">Analyzed Image</h3>
                            <div className="image-section">
                                <div className="image-container">
                                    <img src={imageWithBoxes || detection.image_url} alt="Analyzed" />
                                    <p className="image-caption">
                                        Image with detected cocolisap instances highlighted (bounding boxes in orange)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {detections.length > 0 && (
                            <div className="section">
                                <h3 className="section-title">Detection Details ({detections.length} instances)</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '60px' }}>#</th>
                                            <th>Classification</th>
                                            <th style={{ width: '200px' }}>Confidence Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detections.slice(0, 15).map((d, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 600 }}>{i + 1}</td>
                                                <td>{d.label}</td>
                                                <td>
                                                    <div className="confidence-bar">
                                                        <div 
                                                            className="confidence-fill" 
                                                            style={{ width: `${d.confidence * 100}px` }}
                                                        />
                                                        <span style={{ fontWeight: 600 }}>
                                                            {(d.confidence * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {detections.length > 15 && (
                                            <tr>
                                                <td colSpan={3} style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                                                    ... and {detections.length - 15} more detections
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="section">
                            <h3 className="section-title">Recommendations</h3>
                            <div className={`recommendations ${detection.severity}`}>
                                <ul>
                                    {detection.severity === 'severe' && (
                                        <>
                                            <li><strong>Immediate intervention required</strong> - High infestation level detected</li>
                                            <li>Consider chemical treatment options (consult agricultural expert)</li>
                                            <li>Isolate affected trees to prevent further spread</li>
                                            <li>Document and report to local agricultural office</li>
                                        </>
                                    )}
                                    {detection.severity === 'moderate' && (
                                        <>
                                            <li><strong>Monitor affected areas closely</strong> - Moderate infestation detected</li>
                                            <li>Consider preventive biological or chemical treatment</li>
                                            <li>Re-scan affected areas in 1-2 weeks</li>
                                            <li>Inspect neighboring trees for early signs</li>
                                        </>
                                    )}
                                    {detection.severity === 'low' && (
                                        <>
                                            <li><strong>Continue regular monitoring</strong> - Low infestation level</li>
                                            <li>Maintain good agricultural practices</li>
                                            <li>Schedule periodic re-scans (monthly recommended)</li>
                                            <li>Keep records for trend analysis</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <div className="footer">
                            <p className="footer-brand">🌴 Cocolisap Detection System</p>
                            <p>Powered by YOLOv8 AI Model • Thesis Research Project</p>
                            <p style={{ marginTop: '8px' }}>This report was generated automatically. For accurate pest management advice, consult with agricultural experts.</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}