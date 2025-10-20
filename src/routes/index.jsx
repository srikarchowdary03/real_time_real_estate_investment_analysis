import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import APITest from '../pages/APITest';
import MapTest from '../pages/MapTest';
import TestButtons from '../pages/TestButtons';


// Import pages
import Home from '../pages/Home';
import Properties from '../pages/Properties';
import Calculators from '../pages/Calculators';
import About from '../pages/About';
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
        path: 'calculators',
        element: <Calculators />,
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
        path: 'map-test', // Add this route for testing
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