import React from 'react';
import { X, MapPin, Bug, Leaf, Calendar, User, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const severityConfig = {
    severe: { color: '#dc2626', bg: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.25)', icon: <AlertTriangle style={{ width: 13, height: 13 }} /> },
    moderate: { color: '#d97706', bg: 'rgba(217,119,6,0.10)', border: 'rgba(217,119,6,0.25)', icon: <Clock style={{ width: 13, height: 13 }} /> },
    low: { color: '#2e8b4a', bg: 'rgba(46,139,74,0.10)', border: 'rgba(46,139,74,0.25)', icon: <CheckCircle style={{ width: 13, height: 13 }} /> },
};

function Row({ icon, label, value }) {
    if (!value) return null;
    return (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #eaf2ea' }}>
            <div style={{ color: '#8aaa96', marginTop: 1, flexShrink: 0 }}>{icon}</div>
            <div>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: '#8aaa96', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, color: '#1a3326', fontWeight: 500 }}>{value}</div>
            </div>
        </div>
    );
}

export default function DetectionDetailPanel({ detection, onClose }) {
    if (!detection) return null;
    const cfg = severityConfig[detection.severity] || severityConfig.low;

    return (
        <div style={{
            position: 'absolute', right: 12, top: 12, bottom: 12, zIndex: 1000,
            width: 300, background: '#fff', borderRadius: 16,
            border: '1px solid #d6e8d6', boxShadow: '0 4px 24px rgba(0,0,0,0.14)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            fontFamily: "'Outfit',sans-serif",
        }}>
            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #eaf2ea', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fbf8' }}>
                <div>
                    <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: '#8aaa96', marginBottom: 4 }}>Detection Details</div>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 100,
                        padding: '3px 10px', fontSize: 11, fontWeight: 600, color: cfg.color, letterSpacing: '.06em', textTransform: 'uppercase',
                    }}>
                        {cfg.icon} {detection.severity}
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#8aaa96' }}>
                    <X style={{ width: 16, height: 16 }} />
                </button>
            </div>

            {/* Image */}
            {detection.image_url && (
                <div style={{ height: 160, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={detection.image_url} alt="Detection" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            )}

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }}>
                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '12px 0' }}>
                    {[
                        { label: 'Insects', value: detection.total_detections ?? '—' },
                        { label: 'Confidence', value: detection.avg_confidence ? `${(detection.avg_confidence * 100).toFixed(1)}%` : '—' },
                    ].map(s => (
                        <div key={s.label} style={{ background: 'rgba(46,139,74,0.06)', border: '1px solid rgba(46,139,74,0.15)', borderRadius: 10, padding: '10px 12px' }}>
                            <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase', color: '#8aaa96', marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontSize: 20, fontFamily: "'DM Serif Display',serif", color: '#2e8b4a' }}>{s.value}</div>
                        </div>
                    ))}
                </div>

                <Row icon={<MapPin style={{ width: 14, height: 14 }} />} label="Location"
                    value={[detection.barangay, detection.municipality, detection.province].filter(Boolean).join(', ')} />
                <Row icon={<User style={{ width: 14, height: 14 }} />} label="Farm Owner" value={detection.farmOwner} />
                <Row icon={<Leaf style={{ width: 14, height: 14 }} />} label="Farm Name" value={detection.farmName} />
                <Row icon={<Calendar style={{ width: 14, height: 14 }} />} label="Date & Time"
                    value={detection.created_date ? format(new Date(detection.created_date), 'MMM d, yyyy · h:mm a') : '—'} />
                <Row icon={<Bug style={{ width: 14, height: 14 }} />} label="Location Method"
                    value={detection.locationMethod === 'gps' ? 'GPS Captured' : detection.locationMethod === 'manual' ? 'Manually Entered' : null} />
                {detection.latitude && detection.longitude && (
                    <Row icon={<MapPin style={{ width: 14, height: 14 }} />} label="Coordinates"
                        value={`${detection.latitude.toFixed(5)}, ${detection.longitude.toFixed(5)}`} />
                )}
                <Row icon={<FileText style={{ width: 14, height: 14 }} />} label="Notes" value={detection.notes} />
                {detection.feedback && (
                    <Row icon={<CheckCircle style={{ width: 14, height: 14 }} />} label="Feedback"
                        value={detection.feedback.replace('_', ' ')} />
                )}
            </div>
        </div>
    );
}