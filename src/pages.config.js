import { lazy, Suspense } from 'react';
import { createElement } from 'react';
import DataExport from './pages/DataExport';
import FuzzyLogic from './pages/FuzzyLogic';
import Home from './pages/Home';
import ImageDetection from './pages/ImageDetection';
import Layout from './Layout.jsx';

const MapDashboardLazy = lazy(() => import('./pages/MapDashboard'));

const MapDashboard = (props) =>
    createElement(Suspense, { fallback: null },
        createElement(MapDashboardLazy, props)
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