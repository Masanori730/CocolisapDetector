import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Home, Map, Download, Leaf } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
    const navItems = [
        { name: 'Home', icon: Home, path: createPageUrl('Home') },
        { name: 'Map Dashboard', icon: Map, path: createPageUrl('MapDashboard') },
        { name: 'Data Export', icon: Download, path: createPageUrl('DataExport') }
    ];

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Navigation */}
            <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                            <Leaf className="w-6 h-6 text-emerald-600" />
                            <span className="font-bold text-lg text-stone-800">Cocolisap Detection</span>
                            <span className="text-xs text-stone-500 hidden sm:inline">PCA System</span>
                        </Link>
                        
                        <div className="flex gap-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentPageName === item.name;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            isActive 
                                                ? 'bg-emerald-100 text-emerald-700' 
                                                : 'text-stone-600 hover:bg-stone-100'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="hidden md:inline">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Page Content */}
            <main>{children}</main>
        </div>
    );
}