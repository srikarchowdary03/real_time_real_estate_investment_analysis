import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/layout/Layout';

// Main Pages
import Home from '../pages/Home';
import Properties from '../pages/Properties';
import MyProperties from '../pages/MyProperties';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import PropertyDetails from '../pages/PropertyDetails';
import PropertyAnalysisPage from '../pages/PropertyAnalysisPage';
import SignIn from '../pages/Auth/SignIn';

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
        path: 'my-properties',
        element: <MyProperties />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'property/:id',
        element: <PropertyDetails />,
      },
      {
        path: 'property/:propertyId/analyze',
        element: <PropertyAnalysisPage />,
      },
      {
        path: 'signin',
        element: <SignIn />,
      },
      {
        path: 'signup',
        element: <SignIn />,
      },
    ],
  },
]);

export default router;