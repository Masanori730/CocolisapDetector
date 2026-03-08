/**
 * pages.config.js - Page routing configuration
 */
import Home from './pages/Home';
import MapDashboard from './pages/MapDashboard';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Home": Home,
    "MapDashboard": MapDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};