import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download, FileText, FileSpreadsheet, CheckCircle, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from 'date-fns';

const PHILIPPINE_PROVINCES = [
    "Abra", "Agusan del Norte", "Agusan del Sur", "Aklan", "Albay", "Antique", "Apayao", "Aurora",
    "Basilan", "Bataan", "Batanes", "Batangas", "Benguet", "Biliran", "Bohol", "Bukidnon",
    "Bulacan", "Cagayan", "Camarines Norte", "Camarines Sur", "Camiguin", "Capiz", "Catanduanes",
    "Cavite", "Cebu", "Cotabato", "Davao de Oro", "Davao del Norte", "Davao del Sur", "Davao Occidental",
    "Davao Oriental", "Dinagat Islands", "Eastern Samar", "Guimaras", "Ifugao", "Ilocos Norte",
    "Ilocos Sur", "Iloilo", "Isabela", "Kalinga", "La Union", "Laguna", "Lanao del Norte",
    "Lanao del Sur", "Leyte", "Maguindanao", "Marinduque", "Masbate", "Metro Manila", "Misamis Occidental",
    "Misamis Oriental", "Mountain Province", "Negros Occidental", "Negros Oriental", "Northern Samar",
    "Nueva Ecija", "Nueva Vizcaya", "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Pampanga",
    "Pangasinan", "Quezon", "Quirino", "Rizal", "Romblon", "Samar", "Sarangani", "Siquijor",
    "Sorsogon", "South Cotabato", "Southern Leyte", "Sultan Kudarat", "Sulu", "Surigao del Norte",
    "Surigao del Sur", "Tarlac", "Tawi-Tawi", "Zambales", "Zamboanga del Norte", "Zamboanga del Sur",
    "Zamboanga Sibugay"
];

export default function DataExport() {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [provinceFilter, setProvinceFilter] = useState('all');
    const [includePhotos, setIncludePhotos] = useState(false);
    const [exportMessage, setExportMessage] = useState(null);

    const { data: allDetections = [] } = useQuery({
        queryKey: ['detections'],
        queryFn: () => base44.entities.Detection.list('-created_date', 1000),
    });

    const filteredDetections = useMemo(() => {
        let filtered = allDetections;

        if (dateFrom) {
            filtered = filtered.filter(d => new Date(d.created_date) >= new Date(dateFrom));
        }
        if (dateTo) {
            filtered = filtered.filter(d => new Date(d.created_date) <= new Date(dateTo));
        }
        if (severityFilter !== 'all') {
            filtered = filtered.filter(d => d.severity === severityFilter);
        }
        if (provinceFilter !== 'all') {
            filtered = filtered.filter(d => d.province === provinceFilter);
        }

        return filtered;
    }, [allDetections, dateFrom, dateTo, severityFilter, provinceFilter]);

    const handleExportCSV = () => {
        if (filteredDetections.length === 0) {
            setExportMessage({ type: 'error', text: 'No detections to export with current filters.' });
            return;
        }

        const headers = [
            'Detection ID',
            'Date',
            'Time',
            'Province',
            'Municipality',
            'Barangay',
            'Farm Name',
            'Farm Owner',
            'Latitude',
            'Longitude',
            'Severity',
            'Total Insects',
            'Avg Confidence',
            'Processing Time (ms)',
            'Location Method',
            'Notes'
        ];

        if (includePhotos) {
            headers.push('Photo URL');
        }

        const rows = filteredDetections.map(d => {
            const date = new Date(d.created_date);
            const row = [
                d.id,
                format(date, 'yyyy-MM-dd'),
                format(date, 'HH:mm:ss'),
                d.province || '',
                d.municipality || '',
                d.barangay || '',
                d.farmName || '',
                d.farmOwner || '',
                d.latitude || '',
                d.longitude || '',
                d.severity,
                d.total_detections,
                ((d.avg_confidence || 0) * 100).toFixed(1) + '%',
                d.processing_time || '',
                d.locationMethod || '',
                d.notes || ''
            ];

            if (includePhotos) {
                row.push(d.image_url || '');
            }

            return row;
        });

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cocolisap-detections-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        setExportMessage({ type: 'success', text: `Successfully exported ${filteredDetections.length} detections to CSV.` });
    };

    const handleExportSummary = () => {
        if (filteredDetections.length === 0) {
            setExportMessage({ type: 'error', text: 'No detections to export with current filters.' });
            return;
        }

        const stats = {
            total: filteredDetections.length,
            severe: filteredDetections.filter(d => d.severity === 'severe').length,
            moderate: filteredDetections.filter(d => d.severity === 'moderate').length,
            low: filteredDetections.filter(d => d.severity === 'low').length,
        };

        const provinceCounts = {};
        filteredDetections.forEach(d => {
            if (d.province) {
                provinceCounts[d.province] = (provinceCounts[d.province] || 0) + 1;
            }
        });

        const topProvinces = Object.entries(provinceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const avgInsects = stats.total > 0
            ? (filteredDetections.reduce((sum, d) => sum + (d.total_detections || 0), 0) / stats.total).toFixed(1)
            : 0;

        const summary = `
COCOLISAP DETECTION SUMMARY REPORT
Philippine Coconut Authority
Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}

================================================
STATISTICS OVERVIEW
================================================
Total Detections: ${stats.total}
Severe Cases: ${stats.severe} (${((stats.severe / stats.total) * 100).toFixed(1)}%)
Moderate Cases: ${stats.moderate} (${((stats.moderate / stats.total) * 100).toFixed(1)}%)
Low Cases: ${stats.low} (${((stats.low / stats.total) * 100).toFixed(1)}%)
Average Insects per Detection: ${avgInsects}

================================================
SEVERITY BREAKDOWN
================================================
${stats.severe > 0 ? `⚠️  SEVERE (${stats.severe} cases): Immediate intervention required` : ''}
${stats.moderate > 0 ? `⚡ MODERATE (${stats.moderate} cases): Action required within 3-5 days` : ''}
${stats.low > 0 ? `✓  LOW (${stats.low} cases): Regular monitoring recommended` : ''}

================================================
TOP AFFECTED PROVINCES
================================================
${topProvinces.map(([province, count], idx) => `${idx + 1}. ${province}: ${count} detections`).join('\n')}

================================================
RECOMMENDATIONS
================================================
${stats.severe > 0 ? `
HIGH PRIORITY ACTIONS:
- Immediate field inspection of ${stats.severe} severe cases
- Deploy treatment teams to affected areas within 24 hours
- Establish quarantine zones around severe infestation sites
- Notify farm owners and neighboring properties
` : ''}
${stats.moderate > 0 ? `
MEDIUM PRIORITY ACTIONS:
- Schedule treatment for ${stats.moderate} moderate cases within 3-5 days
- Enhance monitoring frequency in affected areas
- Coordinate with local agricultural officers
` : ''}
${stats.low > 0 ? `
ONGOING MONITORING:
- Continue regular inspections of ${stats.low} low-risk areas
- Maintain early warning system
- Document population trends
` : ''}

================================================
DATA QUALITY NOTES
================================================
Detections with GPS: ${filteredDetections.filter(d => d.latitude && d.longitude).length}
Detections with Province: ${filteredDetections.filter(d => d.province).length}
Date Range: ${dateFrom || 'All time'} to ${dateTo || 'Present'}

This report was generated automatically by the Cocolisap Detection System.
For questions, contact Philippine Coconut Authority Field Operations.
        `.trim();

        const blob = new Blob([summary], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cocolisap-summary-${format(new Date(), 'yyyy-MM-dd')}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        setExportMessage({ type: 'success', text: 'Summary report generated successfully.' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-stone-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Download className="w-8 h-8 text-emerald-600" />
                        <h1 className="text-3xl font-bold text-stone-800">Data Export</h1>
                    </div>
                    <p className="text-stone-600">Export detection data for reporting and analysis</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl p-6 mb-6 border border-stone-200">
                    <h3 className="font-semibold text-stone-800 mb-4">Filter Criteria</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="dateFrom">Date From</Label>
                            <Input
                                id="dateFrom"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="dateTo">Date To</Label>
                            <Input
                                id="dateTo"
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="severity">Severity Level</Label>
                            <Select value={severityFilter} onValueChange={setSeverityFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Levels</SelectItem>
                                    <SelectItem value="severe">Severe Only</SelectItem>
                                    <SelectItem value="moderate">Moderate Only</SelectItem>
                                    <SelectItem value="low">Low Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="province">Province</Label>
                            <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    <SelectItem value="all">All Provinces</SelectItem>
                                    {PHILIPPINE_PROVINCES.map(province => (
                                        <SelectItem key={province} value={province}>{province}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-2">
                        <Checkbox
                            id="includePhotos"
                            checked={includePhotos}
                            onCheckedChange={setIncludePhotos}
                        />
                        <label htmlFor="includePhotos" className="text-sm text-stone-700 cursor-pointer">
                            Include photo URLs in CSV export
                        </label>
                    </div>
                </div>

                {/* Results Count */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                    <p className="text-emerald-800">
                        <strong>{filteredDetections.length}</strong> detection{filteredDetections.length !== 1 ? 's' : ''} match your criteria
                    </p>
                </div>

                {exportMessage && (
                    <Alert variant={exportMessage.type === 'error' ? 'destructive' : 'default'} className="mb-6">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>{exportMessage.text}</AlertDescription>
                    </Alert>
                )}

                {/* Export Options */}
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-6 border border-stone-200">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <FileSpreadsheet className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-stone-800 mb-1">Export to CSV</h3>
                                <p className="text-sm text-stone-600">
                                    Download spreadsheet with all detection data for analysis in Excel or Google Sheets.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleExportCSV}
                            className="w-full bg-green-600 hover:bg-green-700 gap-2"
                            disabled={filteredDetections.length === 0}
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Download CSV
                        </Button>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-stone-200">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-stone-800 mb-1">Summary Report</h3>
                                <p className="text-sm text-stone-600">
                                    Generate text report with statistics, analysis, and recommendations.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleExportSummary}
                            className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                            disabled={filteredDetections.length === 0}
                        >
                            <FileText className="w-4 h-4" />
                            Download Summary
                        </Button>
                    </div>
                </div>

                {/* Usage Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <div className="flex gap-3">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-2">Usage Tips</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• CSV format is ideal for data analysis and creating custom reports</li>
                                <li>• Summary reports are ready for government documentation and briefings</li>
                                <li>• Use date filters to generate weekly or monthly reports</li>
                                <li>• Province filters help create regional analysis reports</li>
                                <li>• Photo URLs in CSV can be used to retrieve detection images</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}