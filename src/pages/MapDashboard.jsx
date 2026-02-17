import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Map, TrendingUp, AlertTriangle, BarChart3, MapPin, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import TrendChart from '@/components/analytics/TrendChart';
import ProvinceAnalysis from '@/components/analytics/ProvinceAnalysis';
import AnalyticsExport from '@/components/analytics/AnalyticsExport';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons by severity
const createCustomIcon = (severity) => {
    const colors = {
        severe: '#dc2626',
        moderate: '#f59e0b',
        low: '#059669'
    };
    
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            width: 24px;
            height: 24px;
            background-color: ${colors[severity]};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
};

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

export default function MapDashboard() {
    const [severityFilter, setSeverityFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [provinceFilter, setProvinceFilter] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showAnalytics, setShowAnalytics] = useState(false);

    const { data: allDetections = [], isLoading } = useQuery({
        queryKey: ['detections'],
        queryFn: () => base44.entities.Detection.list('-created_date', 500),
    });

    const filteredDetections = useMemo(() => {
        let filtered = allDetections;

        if (severityFilter !== 'all') {
            filtered = filtered.filter(d => d.severity === severityFilter);
        }

        if (provinceFilter !== 'all') {
            filtered = filtered.filter(d => d.province === provinceFilter);
        }

        if (dateFilter === 'custom' && customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(d => {
                const detectionDate = new Date(d.created_date);
                return detectionDate >= start && detectionDate <= end;
            });
        } else if (dateFilter !== 'all') {
            const now = new Date();
            filtered = filtered.filter(d => {
                const detectionDate = new Date(d.created_date);
                const diffDays = Math.floor((now - detectionDate) / (1000 * 60 * 60 * 24));
                
                if (dateFilter === 'today') return diffDays === 0;
                if (dateFilter === 'week') return diffDays <= 7;
                if (dateFilter === 'month') return diffDays <= 30;
                if (dateFilter === 'quarter') return diffDays <= 90;
                if (dateFilter === 'year') return diffDays <= 365;
                return true;
            });
        }

        return filtered;
    }, [allDetections, severityFilter, dateFilter, provinceFilter, customStartDate, customEndDate]);

    const stats = useMemo(() => {
        const total = filteredDetections.length;
        const severe = filteredDetections.filter(d => d.severity === 'severe').length;
        const moderate = filteredDetections.filter(d => d.severity === 'moderate').length;
        const low = filteredDetections.filter(d => d.severity === 'low').length;
        const avgInsects = total > 0 
            ? (filteredDetections.reduce((sum, d) => sum + (d.total_detections || 0), 0) / total).toFixed(1)
            : 0;

        return { total, severe, moderate, low, avgInsects };
    }, [filteredDetections]);

    const topProvinces = useMemo(() => {
        const provinceCounts = {};
        filteredDetections.forEach(d => {
            if (d.province) {
                provinceCounts[d.province] = (provinceCounts[d.province] || 0) + 1;
            }
        });
        return Object.entries(provinceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }, [filteredDetections]);

    const recentDetections = useMemo(() => {
        return filteredDetections.slice(0, 5);
    }, [filteredDetections]);

    const detectionsWithGPS = useMemo(() => {
        return filteredDetections.filter(d => d.latitude && d.longitude);
    }, [filteredDetections]);

    // Calculate map center based on detections
    const mapCenter = useMemo(() => {
        if (detectionsWithGPS.length === 0) {
            return [12.8797, 121.7740]; // Philippines center
        }
        const avgLat = detectionsWithGPS.reduce((sum, d) => sum + d.latitude, 0) / detectionsWithGPS.length;
        const avgLng = detectionsWithGPS.reduce((sum, d) => sum + d.longitude, 0) / detectionsWithGPS.length;
        return [avgLat, avgLng];
    }, [detectionsWithGPS]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-stone-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <Map className="w-8 h-8 text-emerald-600" />
                            <h1 className="text-3xl font-bold text-stone-800">Detection Map Dashboard</h1>
                        </div>
                        <Button
                            onClick={() => setShowAnalytics(!showAnalytics)}
                            variant={showAnalytics ? 'default' : 'outline'}
                            className={showAnalytics ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                        >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            {showAnalytics ? 'Hide' : 'Show'} Advanced Analytics
                        </Button>
                    </div>
                    <p className="text-stone-600">Philippine Coconut Authority - Cocolisap Monitoring System</p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-stone-600">Total Detections</p>
                                <p className="text-2xl font-bold text-stone-800">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-red-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-stone-600">Severe Cases</p>
                                <p className="text-2xl font-bold text-red-600">{stats.severe}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-stone-600">Moderate Cases</p>
                                <p className="text-2xl font-bold text-amber-600">{stats.moderate}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-100 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-stone-600">Avg. Insects</p>
                                <p className="text-2xl font-bold text-emerald-600">{stats.avgInsects}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl p-5 mb-6 border border-stone-200">
                    <h3 className="font-semibold text-stone-800 mb-4">Filters</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm text-stone-600 mb-2 block">Severity Level</label>
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
                            <label className="text-sm text-stone-600 mb-2 block">Date Range</label>
                            <Select value={dateFilter} onValueChange={setDateFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="week">Last 7 Days</SelectItem>
                                    <SelectItem value="month">Last 30 Days</SelectItem>
                                    <SelectItem value="quarter">Last 3 Months</SelectItem>
                                    <SelectItem value="year">Last Year</SelectItem>
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm text-stone-600 mb-2 block">Province</label>
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

                    {dateFilter === 'custom' && (
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="text-sm text-stone-600 mb-2 block">Start Date</label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-stone-600 mb-2 block">End Date</label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Advanced Analytics Section */}
                {showAnalytics && (
                    <div className="space-y-6 mb-6">
                        <TrendChart detections={filteredDetections} dateRange={dateFilter} />
                        
                        <div className="grid lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <ProvinceAnalysis detections={filteredDetections} />
                            </div>
                            <div>
                                <AnalyticsExport 
                                    detections={filteredDetections} 
                                    stats={stats}
                                    topProvinces={topProvinces}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Interactive Map */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                            <div className="bg-emerald-600 text-white p-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    Interactive Map View
                                    <span className="ml-auto text-sm font-normal">
                                        {detectionsWithGPS.length} locations
                                    </span>
                                </h3>
                            </div>
                            <div className="aspect-video relative">
                                {detectionsWithGPS.length > 0 ? (
                                    <MapContainer
                                        center={mapCenter}
                                        zoom={6}
                                        style={{ height: '100%', width: '100%' }}
                                        scrollWheelZoom={true}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        {detectionsWithGPS.map((detection) => (
                                            <Marker
                                                key={detection.id}
                                                position={[detection.latitude, detection.longitude]}
                                                icon={createCustomIcon(detection.severity)}
                                            >
                                                <Popup>
                                                    <div className="p-2 min-w-[200px]">
                                                        <div className="mb-2">
                                                            <Badge className={
                                                                detection.severity === 'severe' ? 'bg-red-600' :
                                                                detection.severity === 'moderate' ? 'bg-amber-500' :
                                                                'bg-green-600'
                                                            }>
                                                                {detection.severity.toUpperCase()}
                                                            </Badge>
                                                        </div>
                                                        {detection.province && (
                                                            <p className="font-semibold text-stone-800 mb-1">
                                                                {detection.province}
                                                            </p>
                                                        )}
                                                        {detection.municipality && (
                                                            <p className="text-sm text-stone-600 mb-1">
                                                                {detection.municipality}
                                                                {detection.barangay && `, ${detection.barangay}`}
                                                            </p>
                                                        )}
                                                        <div className="text-sm text-stone-700 mt-2">
                                                            <p><strong>{detection.total_detections}</strong> insects detected</p>
                                                            <p className="text-xs text-stone-500 mt-1">
                                                                {format(new Date(detection.created_date), 'MMM d, yyyy • h:mm a')}
                                                            </p>
                                                        </div>
                                                        {detection.farmName && (
                                                            <p className="text-xs text-stone-500 mt-2 border-t pt-1">
                                                                Farm: {detection.farmName}
                                                            </p>
                                                        )}
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </MapContainer>
                                ) : (
                                    <div className="h-full bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center p-8">
                                        <div className="text-center">
                                            <Map className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                                            <h4 className="text-lg font-semibold text-stone-800 mb-2">No GPS Data Available</h4>
                                            <p className="text-sm text-stone-600 max-w-md">
                                                No detections with GPS coordinates found for the current filters.
                                                Try adjusting your filters or ensure location data is captured during detection.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Severity Legend */}
                            <div className="p-4 border-t border-stone-200 bg-stone-50">
                                <h4 className="text-sm font-semibold text-stone-700 mb-3">Severity Legend</h4>
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-red-600" />
                                        <span className="text-sm text-stone-600">Severe (10+ insects)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-amber-500" />
                                        <span className="text-sm text-stone-600">Moderate (5-9 insects)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-green-600" />
                                        <span className="text-sm text-stone-600">Low (1-4 insects)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-6">
                        {/* Top Affected Provinces */}
                        <div className="bg-white rounded-xl border border-stone-200 p-5">
                            <h3 className="font-semibold text-stone-800 mb-4">Top Affected Provinces</h3>
                            {topProvinces.length > 0 ? (
                                <div className="space-y-3">
                                    {topProvinces.map(([province, count], idx) => (
                                        <div key={province} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                                                    {idx + 1}
                                                </div>
                                                <span className="text-sm text-stone-700">{province}</span>
                                            </div>
                                            <Badge variant="secondary">{count}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-stone-500 text-center py-4">No province data available</p>
                            )}
                        </div>

                        {/* Recent Detections */}
                        <div className="bg-white rounded-xl border border-stone-200 p-5">
                            <h3 className="font-semibold text-stone-800 mb-4">Recent Detections</h3>
                            {recentDetections.length > 0 ? (
                                <div className="space-y-3">
                                    {recentDetections.map(detection => {
                                        const severityColors = {
                                            severe: 'bg-red-100 text-red-700',
                                            moderate: 'bg-amber-100 text-amber-700',
                                            low: 'bg-green-100 text-green-700'
                                        };
                                        return (
                                            <div key={detection.id} className="border-b border-stone-100 pb-3 last:border-0">
                                                <div className="flex items-start justify-between mb-1">
                                                    <Badge className={severityColors[detection.severity]}>
                                                        {detection.severity}
                                                    </Badge>
                                                    <span className="text-xs text-stone-500">
                                                        {format(new Date(detection.created_date), 'MMM d')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-stone-700">
                                                    {detection.province || 'Unknown location'} • {detection.total_detections} insects
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-stone-500 text-center py-4">No recent detections</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}