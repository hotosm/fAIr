import React from 'react';
import Home from './components/Layout/Home/Home';
import Authenticate from './components/Login/Authenticate';

const TrainingDS = React.lazy(() => import('./components/Layout/TrainingDS/TrainingDS'));
const AIModels = React.lazy(() => import('./components/Layout/AIModels/AIModels'));
const Documentation = React.lazy(() => import('./components/Layout/Documentation/Documentation'));
const GetStarted = React.lazy(() => import('./components/Layout/GetStarted/GetStarted'));
const Start = React.lazy(() => import('./components/Layout/Start/Start'));
const Why = React.lazy(() => import('./components/Layout/Why/Why'));

export const publicRoutes = [
    // add here all route you wish to implement and associate each one with a component, recommended to use lazy loading
    { path: '/training-datasets/*', name: 'Training Datasets', element: <TrainingDS /> },
    { path: '/ai-models', name: 'Training Datasets', element: <AIModels /> },
    { path: '/documentation', name: 'Training Datasets', element: <Documentation /> },
    { path: '/get-started', name: 'Training Datasets', element: <GetStarted /> },
    { path: '/start-mapping', name: 'Training Datasets', element: <Start /> },
    { path: '/why-fair', name: 'Training Datasets', element: <Why /> },
    { path: '/authenticate', name: 'Authenticate', element: <Authenticate /> },
    { path: '/', name: 'Home', element: <Home /> },
    
  
  ];