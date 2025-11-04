import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/layout/Layout';

// Test & Utility Pages
import APITest from '../pages/APITest';
import MapTest from '../pages/MapTest';
import TestButtons from '../pages/TestButtons';

// Main Pages
import Home from '../pages/Home';
import Properties from '../pages/Properties';
import PropertyDetails from '../pages/PropertyDetails'; // 🆕 Import PropertyDetails
import Calculators from '../pages/Calculators';
import About from '../pages/About';
import SignIn from '../pages/Auth/SignIn';

// 🆕 New Page
import InvestorProfile from '../pages/InvestorProfile';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'properties',
        element: <Properties />,
      },
      {
        path: 'property/:id', // 🆕 Dynamic route for individual property details
        element: <PropertyDetails />,
      },
      {
        path: 'calculators',
        element: <Calculators />,
      },
      {
        path: 'investor', // 🆕 New Route for Investor Profile
        element: <InvestorProfile />,
      },
      {
        path: 'about',
        element: <About />,
      },
      {
        path: 'signin',
        element: <SignIn />,
      },
      {
        path: 'signup',
        element: <SignIn />,
      },
      {
        path: 'api-test',
        element: <APITest />,
      },
      {
        path: 'map-test',
        element: <MapTest />,
      },
      {
        path: 'test-buttons',
        element: <TestButtons />,
      },
    ],
  },
]);

export default router;