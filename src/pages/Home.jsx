import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Info, RefreshCw, ChevronDown, ExternalLink, MessageSquare, Layers } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import ImageUploader from "@/components/detection/ImageUploader";
import DetectionResults from "@/components/detection/DetectionResults";
import SeverityIndicator from "@/components/detection/SeverityIndicator";
import DetectionStats from "@/components/detection/DetectionStats";
import ProcessingOverlay from "@/components/detection/ProcessingOverlay";
import DetectionHistory from "@/components/detection/DetectionHistory";
import DetectionReport from "@/components/detection/DetectionReport";
import FeedbackDialog from "@/components/detection/FeedbackDialog";
import BatchUploader from "@/components/detection/BatchUploader";
import LocationCapture from "@/components/location/LocationCapture";
import EnhancedDetectionResults from "@/components/detection/EnhancedDetectionResults";

const API_BASE_URL = 'https://cocolisap-detector-398384683490.asia-southeast1.run.app';

const detectWithYOLOv8Base64 = async (imageDataUrl) => {
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
        detections: result.detections.map(d => ({
            label: d.disease,
            confidence: d.confidence,
            bbox: [d.bbox.x1, d.bbox.y1, d.bbox.x2 - d.bbox.x1, d.bbox.y2 - d.bbox.y1]
        })),
        severity: result.num_detections >= 10 ? 'severe' : result.num_detections >= 5 ? 'moderate' : 'low',
        stats: {
            totalDetections: result.num_detections,
            avgConfidence: result.detections.reduce((sum, d) => sum + d.confidence, 0) / result.num_detections || 0,
            processingTime: 800,
        }
    };
};

const simulateDetection = async (imageData) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const img = new Image();
    await new Promise(resolve => {
        img.onload = resolve;
        img.src = imageData;
    });
    
    const numDetections = Math.floor(Math.random() * 15) + 1;
    const detections = [];
    
    for (let i = 0; i < numDetections; i++) {
        const boxWidth = Math.random() * (img.width * 0.15) + (img.width * 0.05);
        const boxHeight = Math.random() * (img.height * 0.15) + (img.height * 0.05);
        detections.push({
            label: 'cocolisap',
            confidence: 0.65 + Math.random() * 0.34,
            bbox: [
                Math.random() * (img.width - boxWidth),
                Math.random() * (img.height - boxHeight),
                boxWidth,
                boxHeight
            ],
        });
    }
    
    const avgConfidence = detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length;
    
    return {
        detections,
        severity: numDetections >= 10 ? 'severe' : numDetections >= 5 ? 'moderate' : 'low',
        stats: {
            totalDetections: numDetections,
            avgConfidence,
            processingTime: Math.floor(Math.random() * 500) + 800,
        }
    };
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

    const queryClient = useQueryClient();

    const { data: historyDetections = [] } = useQuery({
        queryKey: ['detections'],
        queryFn: () => base44.entities.Detection.list('-created_date', 50),
    });

    const createDetectionMutation = useMutation({
        mutationFn: (data) => base44.entities.Detection.create(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['detections'] }),
    });

    const deleteDetectionMutation = useMutation({
        mutationFn: (id) => base44.entities.Detection.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['detections'] }),
    });

    const updateDetectionMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Detection.update(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['detections'] }),
    });

    const handleImageSelect = useCallback((file, preview) => {
        setSelectedImage(file);
        setImagePreview(preview);
        setResults(null);
        setError(null);
    }, []);

    const USE_REAL_BACKEND = true;

    const runDetection = async (imageDataUrl) => {
        if (USE_REAL_BACKEND) {
            return await detectWithYOLOv8Base64(imageDataUrl);
        } else {
            return await simulateDetection(imageDataUrl);
        }
    };

    const handleDetect = async () => {
        if (!imagePreview) return;
        
        setIsProcessing(true);
        setError(null);
        
        try {
            setProcessingStage('uploading');
            const detectionResults = await runDetection(imagePreview);
            setResults(detectionResults);

            // Upload image and save to history
            const blob = await fetch(imagePreview).then(r => r.blob());
            const file = new File([blob], 'detection.jpg', { type: 'image/jpeg' });
            const { file_url } = await base44.integrations.Core.UploadFile({ file });

            const newDetection = await createDetectionMutation.mutateAsync({
                image_url: file_url,
                detections_data: JSON.stringify(detectionResults.detections),
                severity: detectionResults.severity,
                total_detections: detectionResults.stats.totalDetections,
                avg_confidence: detectionResults.stats.avgConfidence,
                processing_time: detectionResults.stats.processingTime,
                ...locationData
            });
            setCurrentDetectionId(newDetection.id);

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

        try {
            for (let i = 0; i < files.length; i++) {
                onProgress(i);
                
                const reader = new FileReader();
                const imageDataUrl = await new Promise((resolve) => {
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(files[i].file);
                });

                const detectionResults = await runDetection(imageDataUrl);

                const { file_url } = await base44.integrations.Core.UploadFile({ file: files[i].file });

                await createDetectionMutation.mutateAsync({
                    image_url: file_url,
                    detections_data: JSON.stringify(detectionResults.detections),
                    severity: detectionResults.severity,
                    total_detections: detectionResults.stats.totalDetections,
                    avg_confidence: detectionResults.stats.avgConfidence,
                    processing_time: detectionResults.stats.processingTime,
                    ...locationData
                });
            }
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
            detections: detections,
            severity: detection.severity,
            stats: {
                totalDetections: detection.total_detections,
                avgConfidence: detection.avg_confidence,
                processingTime: detection.processing_time,
            }
        });
        // Store the detection id for potential feedback, but don't open dialog
        setFeedbackDetectionId(null);
    };

    const handleSubmitFeedback = async (feedback, notes) => {
        if (!feedbackDetectionId) return;
        await updateDetectionMutation.mutateAsync({
            id: feedbackDetectionId,
            data: { feedback, feedback_notes: notes }
        });
    };

    const handleClearAllHistory = async () => {
        if (!confirm('Are you sure you want to delete all detection history? This action cannot be undone.')) {
            return;
        }
        
        try {
            await Promise.all(historyDetections.map(d => deleteDetectionMutation.mutateAsync(d.id)));
        } catch (err) {
            console.error('Failed to clear history:', err);
        }
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
                            <span className="text-sm text-white/90">Thesis Project • YOLOv8 Object Detection</span>
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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleReset}
                                        className="gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Reset
                                    </Button>
                                )}
                            </div>

                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6">
                                    <TabsTrigger value="single" className="gap-2">
                                        Single Image
                                    </TabsTrigger>
                                    <TabsTrigger value="batch" className="gap-2">
                                        <Layers className="w-4 h-4" />
                                        Batch Upload
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="single" className="mt-0">
                                    {activeTab === 'single' && (
                                        <>
                                            <ImageUploader
                                                onImageSelect={handleImageSelect}
                                                isProcessing={isProcessing}
                                            />

                                            {selectedImage && !results && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mt-6"
                                                >
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
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-6"
                                        >
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
                                        <BatchUploader 
                                            onBatchProcess={handleBatchProcess}
                                            isProcessing={isProcessing}
                                        />
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
                        {results && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 space-y-6"
                            >
                                <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-6 md:p-8">
                                    <DetectionResults
                                        originalImage={imagePreview}
                                        detections={results.detections}
                                    />
                                </div>

                                <EnhancedDetectionResults
                                    results={results}
                                    locationData={locationData}
                                    detectionId={currentDetectionId}
                                />

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

                    {/* History Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <DetectionHistory
                            detections={historyDetections}
                            onSelect={handleSelectFromHistory}
                            onDelete={(id) => deleteDetectionMutation.mutate(id)}
                            onGenerateReport={setReportDetection}
                            onClearAll={handleClearAllHistory}
                        />
                    </motion.div>
                </div>

                {/* Technical Note */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12 bg-stone-800 rounded-2xl p-6 md:p-8 text-white"
                >
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ExternalLink className="w-5 h-5 text-emerald-400" />
                        Technical Implementation Note
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6 text-stone-300 text-sm">
                        <div>
                            <h4 className="font-medium text-white mb-2">Current Demo</h4>
                            <p>
                                This interface demonstrates the UI/UX flow with simulated detections. 
                                The bounding boxes and confidence scores are generated randomly for demonstration purposes.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-white mb-2">For Production</h4>
                            <ul className="space-y-1">
                                <li>• Deploy Flask/FastAPI backend with YOLOv8</li>
                                <li>• Load your Roboflow-trained model weights</li>
                                <li>• Connect this frontend to your API endpoint</li>
                                <li>• Process real images through the model</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>
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
                            <p>Thesis Project • YOLOv8 + Roboflow Dataset</p>
                            <p className="mt-1">Built for coconut pest management research</p>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Dialogs */}
            <DetectionReport
                detection={reportDetection}
                open={!!reportDetection}
                onClose={() => setReportDetection(null)}
            />

            <FeedbackDialog
                open={!!feedbackDetectionId}
                onClose={() => setFeedbackDetectionId(null)}
                onSubmit={handleSubmitFeedback}
            />
        </div>
    );
}