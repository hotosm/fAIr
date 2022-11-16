import React from 'react';
import Home from './components/Home/Home';

const TrainingDS = React.lazy(() => import('./components/TrainingDS/TrainingDS'));
const App = React.lazy(() => import('./App'));

export const publicRoutes = [
    // add here all route you wish to implement and associate each one with a component, recommended to use lazy loading
    { path: '/training-datasets', name: 'Training Datasets', element: <App /> },
    { path: '/', name: 'Home', element: <Home /> },
    
  
  ];