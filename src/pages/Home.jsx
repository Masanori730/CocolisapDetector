import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Info, RefreshCw, ChevronDown, Github, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ImageUploader from "@/components/detection/ImageUploader";
import DetectionResults from "@/components/detection/DetectionResults";
import SeverityIndicator from "@/components/detection/SeverityIndicator";
import DetectionStats from "@/components/detection/DetectionStats";
import ProcessingOverlay from "@/components/detection/ProcessingOverlay";

// Flask Backend API Configuration
// Change this URL to match your Flask server address
const API_BASE_URL = 'https://cocolisap-detector-398384683490.asia-southeast1.run.app';

// Real YOLOv8 detection function - calls Flask backend
const detectWithYOLOv8 = async (imageFile, imageDataUrl) => {
    // Option 1: Send as FormData (recommended for file uploads)
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch(`${API_BASE_URL}/detect`, {
        method: 'POST',
        body: formData,
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Detection failed');
    }
    
    const result = await response.json();
    
    // Transform Flask response to match frontend format
    return {
        detections: result.detections.map(d => ({
            label: d.disease,
            confidence: d.confidence,
            bbox: [d.bbox.x1, d.bbox.y1, d.bbox.x2 - d.bbox.x1, d.bbox.y2 - d.bbox.y1]
        })),
        severity: result.num_detections >= 10 ? 'severe' : result.num_detections >= 5 ? 'moderate' : 'low',
        stats: {
            totalDetections: result.num_detections,
            avgConfidence: result.detections.reduce((sum, d) => sum + d.confidence, 0) / (result.num_detections || 1),
            processingTime: 800,
        }
    };
};

// Real YOLOv8 detection function - calls Flask backend
const detectWithYOLOv8Base64 = async (imageDataUrl) => {
    const response = await fetch(`${API_BASE_URL}/detect`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageDataUrl }),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Detection failed');
    }
    
    const result = await response.json();
    
    // Transform Flask response to match your frontend format
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

// Demo mode detection (simulated) - used when backend is not available
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

    const handleImageSelect = useCallback((file, preview) => {
        setSelectedImage(file);
        setImagePreview(preview);
        setResults(null);
        setError(null);
    }, []);

    // Toggle this to switch between real backend and demo mode
    const USE_REAL_BACKEND = true; // Set to true when Flask backend is running

    const handleDetect = async () => {
        if (!imagePreview) return;
        
        setIsProcessing(true);
        setError(null);
        
        try {
            // Show processing stages
            const stages = ['uploading', 'preprocessing', 'detecting', 'analyzing'];
            
            let detectionResults;
            
            if (USE_REAL_BACKEND) {
                // Real backend detection
                setProcessingStage('uploading');
                
                try {
                    // Use base64 JSON approach (Flask expects JSON)
                    detectionResults = await detectWithYOLOv8Base64(imagePreview);
                } catch (backendError) {
                    // If backend fails, show helpful error
                    throw new Error(
                        `Backend connection failed. Make sure Flask server is running at ${API_BASE_URL}. ` +
                        `Error: ${backendError.message}`
                    );
                }
            } else {
                // Demo mode with simulated stages
                for (const stage of stages) {
                    setProcessingStage(stage);
                    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 300));
                }
                detectionResults = await simulateDetection(imagePreview);
            }
            
            setResults(detectionResults);
        } catch (err) {
            setError(err.message || 'Detection failed. Please try again.');
            console.error(err);
        } finally {
            setIsProcessing(false);
            setProcessingStage('');
        }
    };

    const handleReset = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setResults(null);
        setError(null);
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
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-6 md:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-stone-800">Upload Image</h2>
                                    <p className="text-sm text-stone-500 mt-1">
                                        Select or capture a photo for analysis
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

                            <ImageUploader
                                onImageSelect={handleImageSelect}
                                isProcessing={isProcessing}
                            />

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
                        </div>

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

                    {/* Results Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-6"
                    >
                        {results ? (
                            <>
                                <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-6 md:p-8">
                                    <DetectionResults
                                        originalImage={imagePreview}
                                        detections={results.detections}
                                    />
                                </div>

                                <SeverityIndicator
                                    severity={results.severity}
                                    detectionCount={results.stats.totalDetections}
                                />

                                <DetectionStats stats={results.stats} />
                            </>
                        ) : (
                            <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-8 md:p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
                                <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center mb-6">
                                    <Leaf className="w-12 h-12 text-stone-300" />
                                </div>
                                <h3 className="text-xl font-semibold text-stone-400 mb-2">
                                    No Results Yet
                                </h3>
                                <p className="text-stone-400 max-w-xs">
                                    Upload an image and click "Detect Cocolisap" to see the analysis results here
                                </p>
                            </div>
                        )}
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
        </div>
    );
}