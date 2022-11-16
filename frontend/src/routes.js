import React from 'react';
import { componentLoader } from './utils'


const TrainingDS = React.lazy(() => import('./components/TrainingDS/TrainingDS'));
const App = React.lazy(() => import('./App'));

export const publicRoutes = [
    { path: '/training-datasets', name: 'Training Datasets', element: <App /> },   
  
  ];