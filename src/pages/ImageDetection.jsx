import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, RefreshCw, ChevronDown, Layers } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUploader from "@/components/detection/ImageUploader";
import DetectionResults from "@/components/detection/DetectionResults";
import ProcessingOverlay from "@/components/detection/ProcessingOverlay";
import BatchUploader from "@/components/detection/BatchUploader";
import LocationCapture from "@/components/location/LocationCapture";
import EnhancedDetectionResults from "@/components/detection/EnhancedDetectionResults";
import DetectionHistory from "@/components/detection/DetectionHistory";
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, limit } from 'firebase/firestore';

const API_BASE_URL = 'https://cocolisap-detector-398384683490.asia-southeast1.run.app';

const homeStyles = `
    .home-root { background: #f4f7f4; min-height: 100vh; color: #1a3326; font-family: 'Outfit', sans-serif; overflow-x: hidden; width: 100%; }
    .home-hero { padding: 56px 24px 48px; max-width: 900px; margin: 0 auto; position: relative; }
    .home-hero::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0; background: radial-gradient(ellipse 80% 60% at 15% 10%,rgba(46,139,74,0.05) 0%,transparent 60%), radial-gradient(ellipse 50% 40% at 85% 80%,rgba(46,139,74,0.04) 0%,transparent 55%); }
    .home-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(46,139,74,0.10); border:1px solid rgba(46,139,74,0.25); border-radius:100px; padding:5px 14px; font-family:'DM Mono',monospace; font-size:11px; letter-spacing:.08em; color:#2e8b4a; text-transform:uppercase; margin-bottom:16px; }
    .home-badge-dot { width:7px; height:7px; border-radius:50%; background:#2e8b4a; box-shadow:0 0 6px #2e8b4a88; animation:home-pulse 2s ease-in-out infinite; }
    @keyframes home-pulse { 0%,100%{opacity:1}50%{opacity:.4} }
    .home-h1 { font-family:'DM Serif Display',serif; font-size:clamp(32px,5vw,52px); font-weight:400; line-height:1.1; color:#1a3326; letter-spacing:-.02em; margin:0 0 12px; }
    .home-h1 em { font-style:italic; color:#2e8b4a; }
    .home-subtitle { font-size:15px; color:#5a8068; line-height:1.6; max-width:520px; margin-bottom:28px; }
    .home-divider { height:1px; background:linear-gradient(90deg,rgba(46,139,74,0.25),transparent 80%); margin:0 0 32px; }
    .home-cta { display:inline-flex; align-items:center; gap:8px; padding:13px 32px; background:#2e8b4a; color:#fff; border:none; border-radius:12px; font-family:'Outfit',sans-serif; font-size:14px; font-weight:600; letter-spacing:.04em; cursor:pointer; transition:background .2s,transform .15s,box-shadow .2s; touch-action:manipulation; -webkit-tap-highlight-color:transparent; }
    .home-cta:hover { background:#25763e; transform:translateY(-1px); box-shadow:0 6px 20px rgba(46,139,74,.30); }
    .home-main { max-width: 1200px; margin: 0 auto; padding: 0 24px 80px; position: relative; z-index: 1; overflow-x: hidden; }
    .home-card { background:#ffffff; border:1px solid #d6e8d6; border-radius:20px; padding:32px; position:relative; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05); }
    .home-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,#2e8b4a,transparent); }
    .home-card-title { font-size:17px; font-weight:600; color:#1a3326; margin:0 0 4px; }
    .home-card-sub { font-size:13px; color:#5a8068; }
    .home-reset-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; background:transparent; border:1px solid #c8dfc8; border-radius:10px; color:#5a8068; font-family:'Outfit',sans-serif; font-size:12px; font-weight:500; cursor:pointer; transition:background .2s,color .2s; }
    .home-reset-btn:hover { background:rgba(46,139,74,0.07); color:#1a3326; }
    .home-detect-btn { width:100%; padding:15px; background:#2e8b4a; color:#fff; border:none; border-radius:12px; font-family:'Outfit',sans-serif; font-size:15px; font-weight:600; letter-spacing:.04em; cursor:pointer; transition:background .2s,transform .15s,box-shadow .2s; margin-top:20px; }
    .home-detect-btn:hover { background:#25763e; transform:translateY(-1px); box-shadow:0 6px 20px rgba(46,139,74,.25); }
    .home-detect-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
    .home-info-card { background:#fffbf0; border:1px solid #f0dfa0; border-radius:16px; padding:20px; display:flex; gap:16px; }
    .home-info-icon { padding:10px; background:#fef3c7; border-radius:10px; height:fit-content; flex-shrink:0; }
    .home-info-title { font-size:14px; font-weight:600; color:#92610a; margin:0 0 6px; }
    .home-info-text { font-size:13px; color:#a07028; line-height:1.6; margin:0; }
    .home-footer { border-top:1px solid #d6e8d6; padding-top:24px; margin-top:40px; font-size:11px; color:#8aaa96; font-family:'DM Mono',monospace; display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; }
    .home-batch-title { font-size:16px; font-weight:600; color:#1a3326; margin:0 0 20px; }
    .home-batch-item { border:1px solid #d6e8d6; border-radius:16px; padding:20px; margin-bottom:20px; background:#fafcfa; }
    .home-batch-filename { font-size:12px; font-weight:500; color:#5a8068; margin:0 0 12px; font-family:'DM Mono',monospace; }
    [data-radix-tabs-list] { background:#f0f5f0 !important; border:1px solid #d6e8d6 !important; border-radius:10px !important; padding:4px !important; }
    [data-radix-tabs-trigger] { color:#5a8068 !important; font-family:'Outfit',sans-serif !important; font-size:13px !important; border-radius:8px !important; }
    [data-radix-tabs-trigger][data-state=active] { background:#ffffff !important; color:#2e8b4a !important; box-shadow:0 1px 4px rgba(0,0,0,.10) !important; }
    .home-grid-layout { display: grid; grid-template-columns: 1fr 340px; gap: 24px; width: 100%; }
    @media(max-width:900px) { .home-grid-layout { grid-template-columns: 1fr !important; } .home-main { padding: 0 16px 80px; } .home-hero { padding: 40px 16px 32px; } .home-card { padding: 20px; } }

    .htu-wrap { background:#fff; border:1px solid #d6e8d6; border-radius:16px; margin-bottom:24px; position:relative; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
    .htu-wrap::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,#2e8b4a,transparent); }
    .htu-header { padding:18px 24px 0; display:flex; align-items:center; gap:10px; }
    .htu-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(46,139,74,0.10); border:1px solid rgba(46,139,74,0.25); border-radius:100px; padding:3px 10px; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.12em; color:#2e8b4a; text-transform:uppercase; }
    .htu-title { font-family:'DM Serif Display',serif; font-size:17px; font-weight:400; color:#1a3326; margin:6px 24px 0; }
    .htu-subtitle { font-family:'DM Mono',monospace; font-size:11px; color:#8aaa96; margin:4px 24px 20px; }
    .htu-steps { display:grid; grid-template-columns:repeat(4,1fr); gap:0; border-top:1px solid #eaf2ea; }
    @media(max-width:800px){ .htu-steps { grid-template-columns:repeat(2,1fr); } }
    @media(max-width:420px){ .htu-steps { grid-template-columns:1fr; } }
    .htu-step { padding:20px; border-right:1px solid #eaf2ea; }
    .htu-step:last-child { border-right:none; }
    @media(max-width:800px){ .htu-step:nth-child(2n) { border-right:none; } }
    .htu-num { width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,#2e8b4a,#4caf72); color:#fff; font-family:'DM Mono',monospace; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; margin-bottom:12px; box-shadow:0 2px 8px rgba(46,139,74,0.28); }
    .htu-step-title { font-size:13px; font-weight:600; color:#1a3326; margin-bottom:6px; line-height:1.3; }
    .htu-step-desc { font-size:11.5px; color:#5a8068; line-height:1.6; font-family:'Outfit',sans-serif; }
    .htu-tip { margin:0 24px 20px; background:rgba(46,139,74,0.04); border:1px solid rgba(46,139,74,0.15); border-radius:10px; padding:10px 14px; display:flex; align-items:flex-start; gap:8px; }
    .htu-tip-icon { font-size:14px; flex-shrink:0; margin-top:1px; }
    .htu-tip-text { font-size:12px; color:#5a8068; font-family:'DM Mono',monospace; line-height:1.6; }
    .htu-tip-text strong { color:#2e8b4a; }
`;

const cleanFileName = (name) => name.replace(/^Messenger_creation_[A-Fa-f0-9-]+_?/i, '').replace(/\.[^.]+$/, '').trim() || name;

const detectWithYOLO = async (imageDataUrl) => {
    const response = await fetch(`${API_BASE_URL}/detect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: imageDataUrl }) });
    if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Detection failed'); }
    const result = await response.json();
    return { detections: result.detections || [], severity: result.severity, stats: { totalDetections: result.num_detections || result.stats?.totalDetections || 0, avgConfidence: result.stats?.avgConfidence || 0, processingTime: result.stats?.processingTime || 0 } };
};

const getHistory = async () => {
    try { const q = query(collection(db, 'detections'), orderBy('created_date', 'desc'), limit(50)); const snapshot = await getDocs(q); return snapshot.docs.map(d => ({ id: d.id, ...d.data() })); }
    catch (e) { console.error('Failed to load history from Firebase:', e); return []; }
};

const saveToHistory = async (detection) => {
    try { await addDoc(collection(db, 'detections'), { ...detection, created_date: new Date().toISOString() }); }
    catch (e) { console.error('Failed to save to Firebase:', e); }
};

function HowToUse() {
    const steps = [
        {
            num: 1,
            title: 'Upload a photo',
            desc: 'Select a clear coconut leaf photo. Use Single Image for one file, or Batch Upload to process multiple images at once.',
        },
        {
            num: 2,
            title: 'Add location',
            desc: "Capture GPS automatically or manually enter the farm's barangay, city, and province to pin the detection on the map.",
        },
        {
            num: 3,
            title: 'Click Detect Cocolisap',
            desc: 'The YOLOv26 model scans the image, counts visible scale insects, and classifies severity as Low, Moderate, or Severe.',
        },
        {
            num: 4,
            title: 'Read the results',
            desc: 'View insect count, confidence score, and severity badge. Results are saved automatically to Detection History on the right.',
        },
    ];

    return (
        <div className="htu-wrap">
            <div className="htu-header">
                <span className="htu-badge">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4.5" stroke="#2e8b4a"/><path d="M5 4.5v3M5 3h.01" stroke="#2e8b4a" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    How to Use
                </span>
            </div>
            <div className="htu-title">Getting Started with Image Detection</div>
            <div className="htu-subtitle">Follow these steps to upload a photo and analyze cocolisap infestation.</div>
            <div className="htu-steps">
                {steps.map(s => (
                    <div key={s.num} className="htu-step">
                        <div className="htu-num">{s.num}</div>
                        <div className="htu-step-title">{s.title}</div>
                        <div className="htu-step-desc">{s.desc}</div>
                    </div>
                ))}
            </div>
            <div className="htu-tip">
                <span className="htu-tip-icon">💡</span>
                <span className="htu-tip-text">
                    <strong>Pro tip:</strong> Use a clear, well-lit photo taken close to the leaf surface. Blurry or dark images may reduce detection accuracy.
                </span>
            </div>
        </div>
    );
}

export default function Home() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStage, setProcessingStage] = useState('');
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('single');
    const [locationData, setLocationData] = useState(null);
    const [currentDetectionId, setCurrentDetectionId] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => { getHistory().then(setHistory); }, []);

    const handleImageSelect = useCallback((file, preview) => { setSelectedImage(file); setImagePreview(preview); setResults(null); setError(null); }, []);

    const handleDetect = async () => {
        if (!imagePreview) return;
        setIsProcessing(true); setError(null);
        try {
            setProcessingStage('uploading'); await new Promise(r => setTimeout(r, 300));
            setProcessingStage('preprocessing'); await new Promise(r => setTimeout(r, 400));
            setProcessingStage('detecting');
            const detectionResults = await detectWithYOLO(imagePreview);
            setProcessingStage('analyzing'); await new Promise(r => setTimeout(r, 300));
            const newDetection = { image_url: imagePreview, detections_data: JSON.stringify(detectionResults.detections), severity: detectionResults.severity, total_detections: detectionResults.stats.totalDetections, avg_confidence: detectionResults.stats.avgConfidence, processing_time: detectionResults.stats.processingTime, ...locationData };
            await saveToHistory(newDetection);
            const updatedHistory = await getHistory();
            setHistory(updatedHistory); setCurrentDetectionId(updatedHistory[0]?.id || null); setResults(detectionResults);
        } catch (err) { setError(err.message || 'Detection failed. Please try again.'); }
        finally { setIsProcessing(false); setProcessingStage(''); }
    };

    const handleBatchProcess = async (files, onProgress) => {
        setIsProcessing(true); setError(null); setResults(null);
        const batchResults = [];
        try {
            for (let i = 0; i < files.length; i++) {
                onProgress(i);
                const reader = new FileReader();
                const imageDataUrl = await new Promise(resolve => { reader.onload = e => resolve(e.target.result); reader.readAsDataURL(files[i].file); });
                const detectionResults = await detectWithYOLO(imageDataUrl);
                await saveToHistory({ image_url: imageDataUrl, detections_data: JSON.stringify(detectionResults.detections), severity: detectionResults.severity, total_detections: detectionResults.stats.totalDetections, avg_confidence: detectionResults.stats.avgConfidence, processing_time: detectionResults.stats.processingTime, ...locationData });
                batchResults.push({ fileName: files[i].file.name, imagePreview: imageDataUrl, ...detectionResults });
            }
            const updatedHistory = await getHistory(); setHistory(updatedHistory); setResults({ isBatch: true, batchResults });
        } catch (err) { setError(err.message || 'Batch processing failed.'); }
        finally { setIsProcessing(false); }
    };

    const handleReset = () => { setSelectedImage(null); setImagePreview(null); setResults(null); setError(null); setLocationData(null); setCurrentDetectionId(null); };

    const handleSelectFromHistory = (detection) => {
        setImagePreview(detection.image_url);
        let detections = [];
        try { detections = detection.detections_data ? JSON.parse(detection.detections_data) : []; if (!Array.isArray(detections)) detections = []; } catch (e) { detections = []; }
        setResults({ detections, severity: detection.severity, stats: { totalDetections: detection.total_detections, avgConfidence: detection.avg_confidence, processingTime: detection.processing_time } });
    };

    const handleDeleteHistory = async (id) => { try { await deleteDoc(doc(db, 'detections', id)); setHistory(await getHistory()); } catch (e) { console.error('Failed to delete:', e); } };

    const handleClearAllHistory = async () => {
        if (!confirm('Are you sure you want to delete all detection history?')) return;
        try { const snapshot = await getDocs(collection(db, 'detections')); await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, 'detections', d.id)))); setHistory([]); }
        catch (e) { console.error('Failed to clear history:', e); }
    };

    const scrollToUpload = () => { document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' }); };
    const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

    return (
        <div className="home-root">
            <style>{homeStyles}</style>
            <AnimatePresence>{isProcessing && <ProcessingOverlay stage={processingStage} />}</AnimatePresence>

            <div className="home-hero" style={{ position: 'relative', zIndex: 1 }}>
                <div className="home-badge"><span className="home-badge-dot" />YOLOv26 Instance Segmentation</div>
                <h1 className="home-h1">Cocolisap <em>Detection</em><br />System</h1>
                <p className="home-subtitle">Coconut scale insect detection powered by deep learning. Upload an image to analyze infestation severity.</p>
                <div className="home-divider" />
                <button className="home-cta" onClick={scrollToUpload}>Start Detection <ChevronDown style={{ width: 16, height: 16 }} /></button>
            </div>

            <main className="home-main" id="upload-section">
                <HowToUse />
                <div className="home-grid-layout">
                    <motion.div {...fadeUp} transition={{ delay: 0.1 }} style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div className="home-card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                                <div><h2 className="home-card-title">Upload Image</h2><p className="home-card-sub">Select or capture photos for analysis</p></div>
                                {(selectedImage || results) && (<button className="home-reset-btn" onClick={handleReset}><RefreshCw style={{ width: 14, height: 14 }} />Reset</button>)}
                            </div>
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList style={{ width: '100%', marginBottom: 20 }}>
                                    <TabsTrigger value="single" style={{ flex: 1 }}>Single Image</TabsTrigger>
                                    <TabsTrigger value="batch" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}><Layers style={{ width: 14, height: 14 }} />Batch Upload</TabsTrigger>
                                </TabsList>
                                <TabsContent value="single">
                                    {activeTab === 'single' && (<><ImageUploader onImageSelect={handleImageSelect} isProcessing={isProcessing} />{selectedImage && !results && (<motion.div {...fadeUp} style={{ marginTop: 20 }}><LocationCapture onLocationChange={setLocationData} /></motion.div>)}</>)}
                                    {error && <Alert variant="destructive" style={{ marginTop: 16 }}><AlertDescription>{error}</AlertDescription></Alert>}
                                    {selectedImage && !results && (<motion.div {...fadeUp}><button className="home-detect-btn" onClick={handleDetect} disabled={isProcessing}>{isProcessing ? 'Processing...' : 'Detect Cocolisap'}</button></motion.div>)}
                                </TabsContent>
                                <TabsContent value="batch">
                                    {activeTab === 'batch' && <BatchUploader onBatchProcess={handleBatchProcess} isProcessing={isProcessing} />}
                                    {error && <Alert variant="destructive" style={{ marginTop: 16 }}><AlertDescription>{error}</AlertDescription></Alert>}
                                </TabsContent>
                            </Tabs>
                        </div>

                        {results && !results.isBatch && (
                            <motion.div {...fadeUp} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div className="home-card"><DetectionResults originalImage={imagePreview} detections={results.detections} /></div>
                                <EnhancedDetectionResults results={results} locationData={locationData} detectionId={currentDetectionId} />
                            </motion.div>
                        )}

                        {results && results.isBatch && (
                            <motion.div {...fadeUp} style={{ marginTop: 20 }}>
                                <div className="home-card">
                                    <p className="home-batch-title">Batch Results — {results.batchResults.length} image{results.batchResults.length > 1 ? 's' : ''} processed</p>
                                    {results.batchResults.map((item, index) => (
                                        <div key={index} className="home-batch-item">
                                            <p className="home-batch-filename">{cleanFileName(item.fileName) || `Image ${index + 1}`}</p>
                                            <DetectionResults originalImage={item.imagePreview} detections={item.detections} />
                                            <EnhancedDetectionResults results={item} locationData={locationData} />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <motion.div {...fadeUp} transition={{ delay: 0.3 }} style={{ marginTop: 20 }}>
                            <div className="home-info-card">
                                <div className="home-info-icon"><Info style={{ width: 18, height: 18, color: '#e8a440' }} /></div>
                                <div>
                                    <h3 className="home-info-title">About Cocolisap</h3>
                                    <p className="home-info-text">Cocolisap (<em>Aspidiotus rigidus</em>) is a coconut scale insect that causes yellowing and drying of leaves. Early detection is crucial for effective pest management and protecting coconut plantations.</p>
                                </div>
                            </div>
                        </motion.div>
                        <div className="home-footer"><span>CocolisapScan · YOLOv26 Instance Segmentation</span></div>
                    </motion.div>

                    <motion.div {...fadeUp} transition={{ delay: 0.2 }} style={{ minWidth: 0, overflow: 'hidden' }}>
                        <DetectionHistory detections={history} onSelect={handleSelectFromHistory} onDelete={handleDeleteHistory} onClearAll={handleClearAllHistory} />
                    </motion.div>
                </div>
            </main>
        </div>
    );
}