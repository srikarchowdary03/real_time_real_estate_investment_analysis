import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';

// Main Pages
import Home from '../pages/Home';
import Properties from '../pages/Properties';
import MyProperties from '../pages/MyProperties';
import PropertyDetails from '../pages/PropertyDetails';
import PropertyAnalysisPage from '../pages/PropertyAnalysisPage';
import SignIn from '../pages/Auth/SignIn';

// User Pages
import InvestorProfile from '../pages/InvestorProfile';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';

/**
 * Application Router Configuration
 * 
 * Route Structure:
 * / - Home page with search
 * /properties - Property search results
 * /property/:id - Property details page (brief view)
 * /property/:propertyId/analyze - Full investment analysis (DealCheck-style)
 * /my-properties - Saved properties (requires auth)
 * /investor-profile - Investor profile & scoring settings
 * /dashboard - User dashboard
 * /profile - User account profile
 * /settings - App settings
 * /signin - Authentication
 */

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // Home Page
      {
        index: true,
        element: <Home />,
      },
      
      // Property Search & Results
      {
        path: 'properties',
        element: <Properties />,
      },
      
      // Property Details (brief view)
      {
        path: 'property/:id',
        element: <PropertyDetails />,
      },
      
      // Investment Analysis Page (DealCheck-style with sidebar)
      {
        path: 'property/:propertyId/analyze',
        element: <PropertyAnalysisPage />,
      },
      
      // My Saved Properties
      {
        path: 'my-properties',
        element: <MyProperties />,
      },
      
      // Investor Profile & Scoring Settings
      {
        path: 'investor-profile',
        element: <InvestorProfile />,
      },
      
      // Dashboard
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      
      // User Profile/Account
      {
        path: 'profile',
        element: <Profile />,
      },
      
      // Settings
      {
        path: 'settings',
        element: <Settings />,
      },
      
      // Authentication
      {
        path: 'signin',
        element: <SignIn />,
      },
      {
        path: 'signup',
        element: <SignIn />, // Same component, different mode
      },
      {
        path: 'login',
        element: <Navigate to="/signin" replace />,
      },
      
      // Catch-all redirect
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;