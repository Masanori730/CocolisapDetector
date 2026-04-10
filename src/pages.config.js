import { lazy, Suspense } from 'react';
import DataExport from './pages/DataExport';
import FuzzyLogic from './pages/FuzzyLogic';
import Home from './pages/Home';
import ImageDetection from './pages/ImageDetection';
import Layout from './Layout.jsx';

const MapDashboardLazy = lazy(() => import('./pages/MapDashboard'));
const MapDashboard = (props) => (
    <Suspense fallback={
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
            <div style={{ width:32, height:32, border:'3px solid #d6e8d6', borderTopColor:'#2e8b4a', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        </div>
    }>
        <MapDashboardLazy {...props} />
    </Suspense>
);

export const pagesConfig = {
    mainPage: "Home",
    Pages: {
        Home,
        ImageDetection,
        MapDashboard,
        FuzzyLogic,
        DataExport,
    },
    Layout,
};