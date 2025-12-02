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

// Optional pages - only include if they exist
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';

/**
 * Application Router Configuration
 * 
 * Route Structure:
 * / - Home page with search
 * /properties - Property search results (requires query params)
 * /properties?zip=XXXXX - Search by ZIP code
 * /properties?city=XXX&state=XX - Search by city/state
 * /properties?search=XXXX - Search by text
 * /property/:id - Property details page
 * /property/:propertyId/analyze - Full investment analysis
 * /my-properties - Saved properties (requires auth)
 * /signin - Authentication
 * /signup - Registration (redirects to signin)
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
      
      // Property Details
      {
        path: 'property/:id',
        element: <PropertyDetails />,
      },
      
      // Investment Analysis Page
      {
        path: 'property/:propertyId/analyze',
        element: <PropertyAnalysisPage />,
      },
      
      // My Saved Properties
      {
        path: 'my-properties',
        element: <MyProperties />,
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