import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/layout/Layout';

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
      // Redirect signup to signin
      {
        path: 'signup',
        element: <SignIn />,
      },
    ],
  },
]);

export default router;