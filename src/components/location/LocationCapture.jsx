import React, { useState } from 'react';
import { MapPin, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from 'framer-motion';

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

export default function LocationCapture({ onLocationChange }) {
    const [mode, setMode] = useState('manual');
    const [capturing, setCapturing] = useState(false);
    const [message, setMessage] = useState(null);
    const [accuracy, setAccuracy] = useState(null);
    const [locationData, setLocationData] = useState({
        latitude: null,
        longitude: null,
        province: '',
        municipality: '',
        barangay: '',
        farmName: '',
        farmOwner: '',
        notes: '',
        locationMethod: 'manual'
    });

    const handleCaptureGPS = () => {
        if (!navigator.geolocation) {
            setMessage({ type: 'error', text: 'GPS is not supported by your device or browser.' });
            return;
        }

        setCapturing(true);
        setMessage(null);
        setAccuracy(null);

        // Watch position for better accuracy
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const newData = {
                    ...locationData,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    locationMethod: 'gps'
                };
                setLocationData(newData);
                onLocationChange(newData);
                setAccuracy(position.coords.accuracy);
                
                const accuracyStatus = position.coords.accuracy < 10 ? 'Excellent' : 
                                      position.coords.accuracy < 30 ? 'Good' : 
                                      position.coords.accuracy < 100 ? 'Fair' : 'Poor';
                
                setMessage({ 
                    type: 'success', 
                    text: `GPS locked! Accuracy: ${accuracyStatus} (±${position.coords.accuracy.toFixed(1)}m)` 
                });
                
                // Stop watching after getting good accuracy
                if (position.coords.accuracy < 50) {
                    navigator.geolocation.clearWatch(watchId);
                    setCapturing(false);
                }
            },
            (error) => {
                let errorMessage = 'Unable to get GPS location. ';
                if (error.code === 1) {
                    errorMessage += 'Please enable location permissions in your browser settings.';
                } else if (error.code === 2) {
                    errorMessage += 'Location unavailable. Make sure GPS is enabled and you\'re outdoors.';
                } else if (error.code === 3) {
                    errorMessage += 'GPS timeout. Try moving outdoors with clear sky view.';
                } else {
                    errorMessage += 'Please try manual entry instead.';
                }
                setMessage({ type: 'error', text: errorMessage });
                navigator.geolocation.clearWatch(watchId);
                setCapturing(false);
            },
            { 
                enableHighAccuracy: true, 
                timeout: 30000,
                maximumAge: 0
            }
        );

        // Auto-stop after 30 seconds
        setTimeout(() => {
            if (capturing) {
                navigator.geolocation.clearWatch(watchId);
                setCapturing(false);
                if (!locationData.latitude || locationData.latitude === 12.8797) {
                    setMessage({ type: 'error', text: 'GPS timeout. Please ensure you\'re outdoors and try again.' });
                }
            }
        }, 30000);
    };

    const handleInputChange = (field, value) => {
        const newData = { ...locationData, [field]: value };
        if (field === 'province' || field === 'municipality' || field === 'barangay') {
            newData.locationMethod = 'manual';
            // Clear GPS coordinates when manually entering location
            newData.latitude = null;
            newData.longitude = null;
        }
        setLocationData(newData);
        onLocationChange(newData);
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-stone-800">Location Information</h3>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={mode === 'gps' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMode('gps')}
                        className={mode === 'gps' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    >
                        <Navigation className="w-4 h-4 mr-1" />
                        GPS
                    </Button>
                    <Button
                        variant={mode === 'manual' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMode('manual')}
                        className={mode === 'manual' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    >
                        Manual
                    </Button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-4">
                            {message.type === 'error' ? (
                                <AlertCircle className="h-4 w-4" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {mode === 'gps' ? (
                <div className="space-y-4">
                    <Button
                        onClick={handleCaptureGPS}
                        disabled={capturing}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                    >
                        <Navigation className={`w-4 h-4 ${capturing ? 'animate-pulse' : ''}`} />
                        {capturing ? 'Capturing GPS...' : 'Capture GPS Location'}
                    </Button>
                    
                    {capturing && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                            <p className="text-sm text-blue-800">
                                📡 Acquiring GPS signal... Please wait and ensure you have a clear view of the sky.
                            </p>
                        </div>
                    )}
                    
                    {locationData.latitude && locationData.longitude && locationData.locationMethod === 'gps' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-3"
                        >
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                <p className="text-sm font-medium text-emerald-900 mb-2">📍 GPS Coordinates</p>
                                <div className="space-y-1 text-sm text-emerald-800">
                                    <p><strong>Latitude:</strong> {locationData.latitude.toFixed(6)}°</p>
                                    <p><strong>Longitude:</strong> {locationData.longitude.toFixed(6)}°</p>
                                    {accuracy && (
                                        <p>
                                            <strong>Accuracy:</strong> ±{accuracy.toFixed(0)}m 
                                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                                accuracy < 20 ? 'bg-green-200 text-green-800' :
                                                accuracy < 50 ? 'bg-blue-200 text-blue-800' :
                                                accuracy < 100 ? 'bg-yellow-200 text-yellow-800' :
                                                'bg-red-200 text-red-800'
                                            }`}>
                                                {accuracy < 20 ? 'Excellent' : 
                                                 accuracy < 50 ? 'Good' : 
                                                 accuracy < 100 ? 'Fair' : 'Poor'}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            <a
                                href={`https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center text-sm text-emerald-700 hover:text-emerald-800 underline"
                            >
                                View on Google Maps →
                            </a>
                        </motion.div>
                    )}
                    
                    <div className="text-xs text-stone-500 p-3 bg-stone-50 rounded-lg">
                        <p className="font-medium mb-1">💡 Tips for better GPS accuracy:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            <li>Go outdoors or near a window</li>
                            <li>Wait 10-30 seconds for signal to stabilize</li>
                            <li>Avoid tall buildings or dense tree cover</li>
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="province">Province *</Label>
                        <Select value={locationData.province} onValueChange={(value) => handleInputChange('province', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select province" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {PHILIPPINE_PROVINCES.map(province => (
                                    <SelectItem key={province} value={province}>{province}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="municipality">Municipality</Label>
                            <Input
                                id="municipality"
                                value={locationData.municipality}
                                onChange={(e) => handleInputChange('municipality', e.target.value)}
                                placeholder="Enter municipality"
                            />
                        </div>
                        <div>
                            <Label htmlFor="barangay">Barangay</Label>
                            <Input
                                id="barangay"
                                value={locationData.barangay}
                                onChange={(e) => handleInputChange('barangay', e.target.value)}
                                placeholder="Enter barangay"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-stone-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label htmlFor="farmName">Farm Name</Label>
                        <Input
                            id="farmName"
                            value={locationData.farmName}
                            onChange={(e) => handleInputChange('farmName', e.target.value)}
                            placeholder="Enter farm name"
                        />
                    </div>
                    <div>
                        <Label htmlFor="farmOwner">Farm Owner</Label>
                        <Input
                            id="farmOwner"
                            value={locationData.farmOwner}
                            onChange={(e) => handleInputChange('farmOwner', e.target.value)}
                            placeholder="Enter owner name"
                        />
                    </div>
                </div>
                <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                        id="notes"
                        value={locationData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="Any additional information..."
                        rows={3}
                    />
                </div>
            </div>
        </div>
    );
}