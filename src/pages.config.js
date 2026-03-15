import DataExport from './pages/DataExport';
import FuzzyLogic from './pages/FuzzyLogic';
import Home from './pages/Home';
import ImageDetection from './pages/ImageDetection';
import MapDashboard from './pages/MapDashboard';
import Layout from './Layout.jsx';

export const PAGES = {
    "Home": Home,
    "ImageDetection": ImageDetection,
    "MapDashboard": MapDashboard,
    "FuzzyLogic": FuzzyLogic,
    "DataExport": DataExport,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};