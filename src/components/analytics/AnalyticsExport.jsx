import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';

export default function AnalyticsExport({ detections, stats, topProvinces }) {
    const generateCSV = () => {
        const headers = ['Date', 'Province', 'Municipality', 'Barangay', 'Severity', 'Total Detections', 'Avg Confidence', 'Farm Name', 'Latitude', 'Longitude'];
        const rows = detections.map(d => [
            format(new Date(d.created_date), 'yyyy-MM-dd HH:mm:ss'),
            d.province || '',
            d.municipality || '',
            d.barangay || '',
            d.severity,
            d.total_detections,
            (d.avg_confidence * 100).toFixed(1) + '%',
            d.farmName || '',
            d.latitude || '',
            d.longitude || ''
        ]);
        
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cocolisap-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const generateSummaryReport = () => {
        const report = `
COCOLISAP DETECTION ANALYTICS REPORT
Generated: ${format(new Date(), 'MMMM dd, yyyy - HH:mm:ss')}
================================================

SUMMARY STATISTICS
------------------
Total Detections: ${stats.total}
Severe Cases: ${stats.severe}
Moderate Cases: ${stats.moderate}
Low Cases: ${stats.low}
Average Insects per Detection: ${stats.avgInsects}

TOP AFFECTED PROVINCES
-----------------------
${topProvinces.map(([province, count], idx) => `${idx + 1}. ${province}: ${count} detections`).join('\n')}

DETAILED DATA
-------------
${detections.map((d, i) => `
Detection #${i + 1}
Date: ${format(new Date(d.created_date), 'yyyy-MM-dd HH:mm:ss')}
Location: ${d.province || 'N/A'}${d.municipality ? ', ' + d.municipality : ''}${d.barangay ? ', ' + d.barangay : ''}
Severity: ${d.severity.toUpperCase()}
Total Detections: ${d.total_detections}
Confidence: ${(d.avg_confidence * 100).toFixed(1)}%
${d.farmName ? 'Farm: ' + d.farmName : ''}
Coordinates: ${d.latitude && d.longitude ? `${d.latitude.toFixed(6)}, ${d.longitude.toFixed(6)}` : 'N/A'}
`).join('\n---\n')}

================================================
Philippine Coconut Authority - Cocolisap Monitoring System
        `.trim();
        
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cocolisap-report-${format(new Date(), 'yyyy-MM-dd')}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white rounded-xl border border-stone-200 p-6">
            <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-stone-800">Export Analytics</h3>
            </div>
            
            <div className="space-y-3">
                <p className="text-sm text-stone-600 mb-4">
                    Export your detection data and analytics for further analysis or reporting.
                </p>
                
                <Button
                    onClick={generateCSV}
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                    <Download className="w-4 h-4" />
                    Download CSV Data
                </Button>
                
                <Button
                    onClick={generateSummaryReport}
                    variant="outline"
                    className="w-full gap-2"
                >
                    <Download className="w-4 h-4" />
                    Download Summary Report
                </Button>
                
                <div className="text-xs text-stone-500 mt-3 p-3 bg-stone-50 rounded-lg">
                    <p><strong>CSV:</strong> Includes all detection records with detailed fields</p>
                    <p className="mt-1"><strong>Summary Report:</strong> Human-readable overview with statistics</p>
                </div>
            </div>
        </div>
    );
}