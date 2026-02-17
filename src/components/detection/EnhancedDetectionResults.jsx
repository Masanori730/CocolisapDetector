import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, AlertCircle, Clock, TrendingUp, MapPin, Navigation, FileText } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function EnhancedDetectionResults({ results, locationData, detectionId }) {
    const severity = results.severity;
    const totalDetections = results.stats.totalDetections;
    const avgConfidence = results.stats.avgConfidence;

    const severityConfig = {
        severe: {
            color: 'bg-red-50 border-red-200 text-red-800',
            icon: AlertTriangle,
            iconColor: 'text-red-600',
            badgeColor: 'bg-red-600 text-white',
            title: 'SEVERE INFESTATION DETECTED',
            timeline: 'Immediate action required within 24 hours',
            meaning: {
                risk: 'Critical threat to coconut plantation',
                spread: 'High probability of rapid spread to neighboring trees',
                impact: 'Significant economic losses if not addressed immediately'
            },
            actions: [
                { num: 1, title: 'Immediate Treatment', desc: 'Apply approved insecticide treatment to all affected trees within 24 hours. Contact PCA for recommended chemicals.' },
                { num: 2, title: 'Quarantine Zone', desc: 'Establish 50-meter quarantine radius around affected area. Mark trees clearly and restrict movement.' },
                { num: 3, title: 'Intensive Monitoring', desc: 'Inspect all trees within 100-meter radius daily for the next 2 weeks. Document new cases immediately.' },
                { num: 4, title: 'Notify Stakeholders', desc: 'Inform neighboring farm owners and local PCA office. Coordinate community response plan.' }
            ],
            nextSteps: [
                'Schedule follow-up inspection in 3 days',
                'Document treatment application with photos',
                'Report results to PCA field officer',
                'Monitor weather conditions affecting treatment efficacy'
            ]
        },
        moderate: {
            color: 'bg-amber-50 border-amber-200 text-amber-800',
            icon: AlertCircle,
            iconColor: 'text-amber-600',
            badgeColor: 'bg-amber-600 text-white',
            title: 'MODERATE INFESTATION DETECTED',
            timeline: 'Action required within 3-5 days',
            meaning: {
                risk: 'Moderate threat requiring prompt attention',
                spread: 'Potential for expansion if left untreated',
                impact: 'Economic losses likely without intervention'
            },
            actions: [
                { num: 1, title: 'Targeted Treatment', desc: 'Apply localized treatment to affected trees. Use biological control methods first if available.' },
                { num: 2, title: 'Enhanced Monitoring', desc: 'Inspect affected area and 25-meter radius every 3 days. Track population trends.' },
                { num: 3, title: 'Cultural Control', desc: 'Remove heavily infested fronds. Improve tree nutrition and water management.' },
                { num: 4, title: 'Follow-up Scanning', desc: 'Re-scan area in 7-10 days to assess treatment effectiveness and population changes.' }
            ],
            nextSteps: [
                'Create monitoring schedule for next 2 weeks',
                'Source appropriate treatment materials',
                'Train workers on proper application techniques',
                'Keep detailed records for trend analysis'
            ]
        },
        low: {
            color: 'bg-green-50 border-green-200 text-green-800',
            icon: CheckCircle,
            iconColor: 'text-green-600',
            badgeColor: 'bg-green-600 text-white',
            title: 'LOW INFESTATION DETECTED',
            timeline: 'Regular monitoring recommended',
            meaning: {
                risk: 'Minimal immediate threat',
                spread: 'Low probability of rapid expansion',
                impact: 'Negligible economic impact with proper monitoring'
            },
            actions: [
                { num: 1, title: 'Continue Monitoring', desc: 'Maintain weekly visual inspections of affected area. Use this app for monthly scans.' },
                { num: 2, title: 'Maintain Tree Health', desc: 'Ensure proper fertilization and irrigation. Healthy trees resist pest pressure better.' },
                { num: 3, title: 'Early Detection System', desc: 'Train farm workers to spot early signs. Install yellow sticky traps if available.' },
                { num: 4, title: 'Document Progress', desc: 'Keep photographic records. Track population trends over time using this app.' }
            ],
            nextSteps: [
                'Set calendar reminder for weekly checks',
                'Review farm sanitation practices',
                'Schedule next AI scan in 30 days',
                'Share findings with PCA for regional database'
            ]
        }
    };

    const config = severityConfig[severity];
    const Icon = config.icon;

    const averageDetections = 15;
    const comparison = totalDetections > averageDetections ? 'higher' : totalDetections < averageDetections * 0.7 ? 'lower' : 'moderate';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Severity Alert Banner */}
            <div className={`${config.color} border-2 rounded-2xl p-6`}>
                <div className="flex items-start gap-4">
                    <Icon className={`w-12 h-12 ${config.iconColor} flex-shrink-0`} />
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2">{config.title}</h2>
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                <span><strong>{totalDetections}</strong> insects detected</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{config.timeline}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                <span>AI Confidence: <strong>{(avgConfidence * 100).toFixed(0)}%</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* What This Means */}
            <div className="bg-white rounded-xl p-6 border border-stone-200">
                <h3 className="text-lg font-semibold mb-4 text-stone-800">What This Means</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-stone-50 rounded-lg">
                        <p className="text-sm font-medium text-stone-600 mb-1">Risk Level</p>
                        <p className="text-sm text-stone-700">{config.meaning.risk}</p>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-lg">
                        <p className="text-sm font-medium text-stone-600 mb-1">Spread Potential</p>
                        <p className="text-sm text-stone-700">{config.meaning.spread}</p>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-lg">
                        <p className="text-sm font-medium text-stone-600 mb-1">Economic Impact</p>
                        <p className="text-sm text-stone-700">{config.meaning.impact}</p>
                    </div>
                </div>
            </div>

            {/* Location Details */}
            {locationData && (locationData.province || locationData.latitude) && (
                <div className="bg-white rounded-xl p-6 border border-stone-200">
                    <h3 className="text-lg font-semibold mb-4 text-stone-800 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                        Location Details
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        {locationData.province && (
                            <div className="flex items-start gap-2">
                                <span className="text-sm font-medium text-stone-600 min-w-[100px]">Province:</span>
                                <span className="text-sm text-stone-800">{locationData.province}</span>
                            </div>
                        )}
                        {locationData.municipality && (
                            <div className="flex items-start gap-2">
                                <span className="text-sm font-medium text-stone-600 min-w-[100px]">Municipality:</span>
                                <span className="text-sm text-stone-800">{locationData.municipality}</span>
                            </div>
                        )}
                        {locationData.barangay && (
                            <div className="flex items-start gap-2">
                                <span className="text-sm font-medium text-stone-600 min-w-[100px]">Barangay:</span>
                                <span className="text-sm text-stone-800">{locationData.barangay}</span>
                            </div>
                        )}
                        {locationData.farmName && (
                            <div className="flex items-start gap-2">
                                <span className="text-sm font-medium text-stone-600 min-w-[100px]">Farm Name:</span>
                                <span className="text-sm text-stone-800">{locationData.farmName}</span>
                            </div>
                        )}
                        {locationData.farmOwner && (
                            <div className="flex items-start gap-2">
                                <span className="text-sm font-medium text-stone-600 min-w-[100px]">Farm Owner:</span>
                                <span className="text-sm text-stone-800">{locationData.farmOwner}</span>
                            </div>
                        )}
                        {locationData.latitude && locationData.longitude && (
                            <div className="flex items-start gap-2 md:col-span-2">
                                <Navigation className="w-4 h-4 text-emerald-600 mt-0.5" />
                                <span className="text-sm font-medium text-stone-600 min-w-[100px]">GPS:</span>
                                <span className="text-sm text-stone-800 font-mono">
                                    {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}


        </motion.div>
    );
}