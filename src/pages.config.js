import DataExport from './pages/DataExport';
import FuzzyLogic from './pages/FuzzyLogic';
import Home from './pages/Home';
import MapDashboard from './pages/MapDashboard';
import Layout from './Layout.jsx';

export const PAGES = {
    "DataExport": DataExport,
    "FuzzyLogic": FuzzyLogic,
    "Home": Home,
    "MapDashboard": MapDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};