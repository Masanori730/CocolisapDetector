import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, FlaskConical, Download, ScanSearch, FileBarChart } from 'lucide-react';
import { Leaf } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
    const location = useLocation();
    const navItems = [
        { name: 'Home', icon: Home, path: '/Home' },
        { name: 'Detection', icon: ScanSearch, path: '/ImageDetection' },
        { name: 'Map Dashboard', icon: Map, path: '/MapDashboard' },
        { name: 'Fuzzy Logic', icon: FlaskConical, path: '/FuzzyLogic' },
        { name: 'Regional Report', icon: FileBarChart, path: '/RegionalReport' },
        { name: 'Data Export', icon: Download, path: '/DataExport' },
    ];
    return (
        <div style={{ minHeight: '100vh', background: '#f4f7f4', color: '#1a3326', fontFamily: "'Outfit', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap');
                body { background: #f4f7f4 !important; }
                .app-nav { background: #ffffff; border-bottom: 1px solid #d6e8d6; position: sticky; top: 0; z-index: 50; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
                .app-nav-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 60px; }
                .app-nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
                .app-nav-brand-dot { width: 8px; height: 8px; border-radius: 50%; background: #2e8b4a; box-shadow: 0 0 6px #2e8b4a88; animation: nav-pulse 2s ease-in-out infinite; }
                @keyframes nav-pulse { 0%,100%{opacity:1}50%{opacity:.5} }
                .app-nav-brand-text { font-family: 'DM Serif Display', serif; font-size: 18px; color: #1a3326; font-weight: 400; letter-spacing: -0.02em; }
                .app-nav-links { display: flex; gap: 4px; }
                .app-nav-link { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 500; color: #5a8068; transition: background 0.2s, color 0.2s; border: 1px solid transparent; }
                .app-nav-link:hover { background: rgba(46,139,74,0.08); color: #1a3326; }
                .app-nav-link.active { background: rgba(46,139,74,0.10); color: #2e8b4a; border-color: rgba(46,139,74,0.25); }
                .app-nav-link svg { width: 15px; height: 15px; }
                @media(max-width:768px){ .app-nav-link span { display:none; } .app-nav-link { padding:8px 10px; } }
            `}</style>
            <nav className="app-nav">
                <div className="app-nav-inner">
                    <Link to="/Home" className="app-nav-brand">
                        <Leaf style={{ width: 20, height: 20, color: '#4caf72' }} />
                        <span className="app-nav-brand-text">CocolisapScan</span>
                    </Link>
                    <div className="app-nav-links">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path || currentPageName === item.name;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`app-nav-link${isActive ? ' active' : ''}`}
                                >
                                    <Icon />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>
            <main>{children}</main>
        </div>
    );
}