import React, { useState, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import { Search, X } from 'lucide-react';

function FlyTo({ target }) {
    const map = useMap();
    if (target) map.flyTo([target.latitude, target.longitude], 14, { duration: 1.2 });
    return null;
}

export default function MapSearch({ detections, onSelect, selectedId }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return detections.filter(d =>
            d.province?.toLowerCase().includes(q) ||
            d.municipality?.toLowerCase().includes(q) ||
            d.barangay?.toLowerCase().includes(q) ||
            d.farmName?.toLowerCase().includes(q) ||
            d.id?.toLowerCase().includes(q)
        ).slice(0, 8);
    }, [query, detections]);

    const selected = useMemo(() => detections.find(d => d.id === selectedId), [detections, selectedId]);

    const handleSelect = (d) => {
        onSelect(d);
        setQuery('');
        setOpen(false);
    };

    return (
        <>
            {selected && selected.latitude && <FlyTo target={selected} />}
            <div style={{
                position: 'absolute', top: 12, left: 60, zIndex: 1000,
                width: 280, fontFamily: "'Outfit',sans-serif",
            }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#5a8068', pointerEvents: 'none' }} />
                    <input
                        value={query}
                        onChange={e => { setQuery(e.target.value); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                        placeholder="Search province, farm, barangay..."
                        style={{
                            width: '100%', paddingLeft: 34, paddingRight: query ? 32 : 12,
                            paddingTop: 9, paddingBottom: 9,
                            background: '#fff', border: '1px solid #c8dfc8', borderRadius: 10,
                            fontSize: 13, color: '#1a3326', outline: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.10)', boxSizing: 'border-box',
                        }}
                    />
                    {query && (
                        <button onClick={() => { setQuery(''); setOpen(false); }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                            <X style={{ width: 13, height: 13, color: '#8aaa96' }} />
                        </button>
                    )}
                </div>
                {open && results.length > 0 && (
                    <div style={{ marginTop: 4, background: '#fff', border: '1px solid #c8dfc8', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                        {results.map(d => (
                            <button key={d.id} onClick={() => handleSelect(d)} style={{
                                width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none',
                                borderBottom: '1px solid #eaf2ea', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2,
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f4f7f4'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a3326' }}>{d.farmName || d.province || 'Unknown'}</span>
                                <span style={{ fontSize: 11, color: '#5a8068', fontFamily: "'DM Mono',monospace" }}>
                                    {[d.barangay, d.municipality, d.province].filter(Boolean).join(', ')} · {d.severity}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
                {open && query && results.length === 0 && (
                    <div style={{ marginTop: 4, background: '#fff', border: '1px solid #c8dfc8', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#8aaa96', fontFamily: "'DM Mono',monospace", boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                        No results found
                    </div>
                )}
            </div>
        </>
    );
}