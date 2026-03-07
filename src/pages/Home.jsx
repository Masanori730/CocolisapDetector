import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Info, RefreshCw, ChevronDown, ExternalLink, MessageSquare, Layers } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ImageUploader from "@/components/detection/ImageUploader";
import DetectionResults from "@/components/detection/DetectionResults";
import ProcessingOverlay from "@/components/detection/ProcessingOverlay";
import DetectionReport from "@/components/detection/DetectionReport";
import FeedbackDialog from "@/components/detection/FeedbackDialog";
import BatchUploader from "@/components/detection/BatchUploader";
import LocationCapture from "@/components/location/LocationCapture";
import EnhancedDetectionResults from "@/components/detection/EnhancedDetectionResults";

const API_BASE_URL = 'https://cocolisap-detector-398384683490.asia-southeast1.run.app';

const detectWithYOLO = async (imageDataUrl) => {
    const response = await fetch(`${API_BASE_URL}/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUrl }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Detection failed');
    }

    const result = await response.json();

    return {
        detections: result.detections || [],
        severity: result.severity,
        stats: {
            totalDetections: result.num_detections || result.stats?.totalDetections || 0,
            avgConfidence: result.stats?.avgConfidence || 0,
            processingTime: result.stats?.processingTime || 0,
        }
    };
};

// Simple local history using localStorage
const getHistory = () => {
    try {
        return JSON.parse(localStorage.getItem('cocolisap_history') || '[]');
    } catch { return []; }
};

const saveToHistory = (detection) => {
    try {
        const history = getHistory();
        history.unshift({ ...detection, id: Date.now().toString(), created_date: new Date().toISOString() });
        localStorage.setItem('cocolisap_history', JSON.stringify(history.slice(0, 50)));
    } catch {}
};

export default function Home() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStage, setProcessingStage] = useState('');
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [reportDetection, setReportDetection] = useState(null);
    const [feedbackDetectionId, setFeedbackDetectionId] = useState(null);
    const [activeTab, setActiveTab] = useState('single');
    const [locationData, setLocationData] = useState(null);
    const [currentDetectionId, setCurrentDetectionId] = useState(null);
    const [history, setHistory] = useState(getHistory());

    const handleImageSelect = useCallback((file, preview) => {
        setSelectedImage(file);
        setImagePreview(preview);
        setResults(null);
        setError(null);
    }, []);

    const handleDetect = async () => {
        if (!imagePreview) return;

        setIsProcessing(true);
        setError(null);

        try {
            setProcessingStage('uploading');
            await new Promise(r => setTimeout(r, 300));

            setProcessingStage('preprocessing');
            await new Promise(r => setTimeout(r, 400));

            setProcessingStage('detecting');
            const detectionResults = await detectWithYOLO(imagePreview);

            setProcessingStage('analyzing');
            await new Promise(r => setTimeout(r, 300));

            const newDetection = {
                id: Date.now().toString(),
                image_url: imagePreview,
                detections_data: JSON.stringify(detectionResults.detections),
                severity: detectionResults.severity,
                total_detections: detectionResults.stats.totalDetections,
                avg_confidence: detectionResults.stats.avgConfidence,
                processing_time: detectionResults.stats.processingTime,
                ...locationData
            };

            saveToHistory(newDetection);
            setHistory(getHistory());
            setCurrentDetectionId(newDetection.id);
            setResults(detectionResults);

        } catch (err) {
            setError(err.message || 'Detection failed. Please try again.');
            console.error(err);
        } finally {
            setIsProcessing(false);
            setProcessingStage('');
        }
    };

    const handleBatchProcess = async (files, onProgress) => {
        setIsProcessing(true);
        setError(null);
        setResults(null);

        const batchResults = [];

        try {
            for (let i = 0; i < files.length; i++) {
                onProgress(i);

                const reader = new FileReader();
                const imageDataUrl = await new Promise((resolve) => {
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(files[i].file);
                });

                const detectionResults = await detectWithYOLO(imageDataUrl);

                const newDetection = {
                    id: Date.now().toString() + i,
                    image_url: imageDataUrl,
                    detections_data: JSON.stringify(detectionResults.detections),
                    severity: detectionResults.severity,
                    total_detections: detectionResults.stats.totalDetections,
                    avg_confidence: detectionResults.stats.avgConfidence,
                    processing_time: detectionResults.stats.processingTime,
                    ...locationData
                };

                saveToHistory(newDetection);

                batchResults.push({
                    fileName: files[i].file.name,
                    imagePreview: imageDataUrl,
                    ...detectionResults,
                });
            }

            setHistory(getHistory());
            setResults({ isBatch: true, batchResults });

        } catch (err) {
            setError(err.message || 'Batch processing failed.');
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setResults(null);
        setError(null);
        setLocationData(null);
        setCurrentDetectionId(null);
    };

    const handleSelectFromHistory = (detection) => {
        setImagePreview(detection.image_url);
        const detections = detection.detections_data ? JSON.parse(detection.detections_data) : [];
        setResults({
            detections,
            severity: detection.severity,
            stats: {
                totalDetections: detection.total_detections,
                avgConfidence: detection.avg_confidence,
                processingTime: detection.processing_time,
            }
        });
        setFeedbackDetectionId(null);
    };

    const handleDeleteHistory = (id) => {
        const updated = getHistory().filter(d => d.id !== id);
        localStorage.setItem('cocolisap_history', JSON.stringify(updated));
        setHistory(updated);
    };

    const handleClearAllHistory = () => {
        if (!confirm('Are you sure you want to delete all detection history?')) return;
        localStorage.removeItem('cocolisap_history');
        setHistory([]);
    };

    const scrollToUpload = () => {
        document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
            <AnimatePresence>
                {isProcessing && <ProcessingOverlay stage={processingStage} />}
            </AnimatePresence>

            {/* Hero Section */}
            <header className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-emerald-900 to-stone-900" />
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-400 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-20 w-96 h-96 bg-amber-400 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                            <Leaf className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm text-white/90">YOLOv11 Instance Segmentation</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
                            Cocolisap
                            <span className="text-emerald-400"> Detection</span>
                        </h1>

                        <p className="text-lg md:text-xl text-stone-300 max-w-2xl mx-auto mb-8">
                            AI-powered coconut scale insect detection using deep learning.
                            Upload an image to analyze infestation severity.
                        </p>

                        <Button
                            onClick={scrollToUpload}
                            size="lg"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 rounded-full px-8"
                        >
                            Start Detection
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                    </motion.div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-stone-50 to-transparent" />
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12" id="upload-section">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Upload Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2"
                    >
                        <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-6 md:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-stone-800">Upload Image</h2>
                                    <p className="text-sm text-stone-500 mt-1">
                                        Select or capture photos for analysis
                                    </p>
                                </div>
                                {(selectedImage || results) && (
                                    <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
                                        <RefreshCw className="w-4 h-4" />
                                        Reset
                                    </Button>
                                )}
                            </div>

                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6">
                                    <TabsTrigger value="single">Single Image</TabsTrigger>
                                    <TabsTrigger value="batch" className="gap-2">
                                        <Layers className="w-4 h-4" />
                                        Batch Upload
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="single" className="mt-0">
                                    {activeTab === 'single' && (
                                        <>
                                            <ImageUploader onImageSelect={handleImageSelect} isProcessing={isProcessing} />
                                            {selectedImage && !results && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                                                    <LocationCapture onLocationChange={setLocationData} />
                                                </motion.div>
                                            )}
                                        </>
                                    )}

                                    {error && (
                                        <Alert variant="destructive" className="mt-4">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    {selectedImage && !results && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                                            <Button
                                                onClick={handleDetect}
                                                disabled={isProcessing}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg rounded-xl"
                                            >
                                                {isProcessing ? 'Processing...' : 'Detect Cocolisap'}
                                            </Button>
                                        </motion.div>
                                    )}
                                </TabsContent>

                                <TabsContent value="batch" className="mt-0">
                                    {activeTab === 'batch' && (
                                        <BatchUploader onBatchProcess={handleBatchProcess} isProcessing={isProcessing} />
                                    )}
                                    {error && (
                                        <Alert variant="destructive" className="mt-4">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Results Section */}
                        {results && !results.isBatch && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
                                <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-6 md:p-8">
                                    <DetectionResults originalImage={imagePreview} detections={results.detections} />
                                </div>

                                <EnhancedDetectionResults results={results} locationData={locationData} detectionId={currentDetectionId} />

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1 gap-2"
                                        onClick={() => setReportDetection({
                                            ...results,
                                            image_url: imagePreview,
                                            total_detections: results.stats.totalDetections,
                                            avg_confidence: results.stats.avgConfidence,
                                            processing_time: results.stats.processingTime,
                                            id: currentDetectionId || 'temp',
                                            ...locationData
                                        })}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Generate Report
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 gap-2"
                                        onClick={() => setFeedbackDetectionId(currentDetectionId || 'temp')}
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Give Feedback
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Batch Results */}
                        {results && results.isBatch && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                                <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-6 md:p-8">
                                    <h3 className="text-lg font-semibold text-stone-800 mb-4">
                                        Batch Results — {results.batchResults.length} image{results.batchResults.length > 1 ? 's' : ''} processed
                                    </h3>
                                    <div className="space-y-6">
                                        {results.batchResults.map((item, index) => (
                                            <div key={index} className="border border-stone-200 rounded-2xl p-4">
                                                <p className="text-sm font-medium text-stone-600 mb-3 truncate">{item.fileName}</p>
                                                <DetectionResults originalImage={item.imagePreview} detections={item.detections} />
                                                <EnhancedDetectionResults results={item} locationData={locationData} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Info Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200"
                        >
                            <div className="flex gap-4">
                                <div className="p-2 rounded-xl bg-amber-100 h-fit">
                                    <Info className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-amber-800 mb-1">About Cocolisap</h3>
                                    <p className="text-sm text-amber-700 leading-relaxed">
                                        Cocolisap (Aspidiotus rigidus) is a coconut scale insect that causes
                                        yellowing and drying of leaves. Early detection is crucial for
                                        effective pest management and protecting coconut plantations.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* History Sidebar - using local state */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                        <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-stone-800">Detection History</h3>
                                {history.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={handleClearAllHistory} className="text-red-500 text-xs">
                                        Clear All
                                    </Button>
                                )}
                            </div>
                            {history.length === 0 ? (
                                <p className="text-sm text-stone-400 text-center py-8">No detections yet</p>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {history.map((d) => (
                                        <div
                                            key={d.id}
                                            className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 hover:border-emerald-200 cursor-pointer transition-colors"
                                            onClick={() => handleSelectFromHistory(d)}
                                        >
                                            <img src={d.image_url} alt="" className="w-12 h-12 object-cover rounded-lg" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-stone-700 capitalize">{d.severity}</p>
                                                <p className="text-xs text-stone-400">{d.total_detections} insects</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); handleDeleteHistory(d.id); }}
                                                className="text-stone-300 hover:text-red-400 p-1"
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-stone-200 mt-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-stone-600">
                            <Leaf className="w-5 h-5 text-emerald-600" />
                            <span className="font-semibold">Cocolisap Detection</span>
                        </div>
                        <div className="text-sm text-stone-500 text-center md:text-right">
                            <p>Philippine Coconut Authority • YOLOv11 Instance Segmentation</p>
                            <p className="mt-1">Built for coconut pest management research</p>
                        </div>
                    </div>
                </div>
            </footer>

            <DetectionReport
                detection={reportDetection}
                open={!!reportDetection}
                onClose={() => setReportDetection(null)}
            />

            <FeedbackDialog
                open={!!feedbackDetectionId}
                onClose={() => setFeedbackDetectionId(null)}
                onSubmit={(feedback, notes) => console.log('Feedback:', feedback, notes)}
            />
        </div>
    );
}