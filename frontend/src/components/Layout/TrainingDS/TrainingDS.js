import React from 'react'
import { Route, Routes } from 'react-router-dom';
import App from './App';

const TrainingDS = props => {


    return <>
        <Routes>
            <Route  path="/new" name="New" element={<App ></App>} />
            <Route  path="/:id" name="New" element={<App ></App>} />
            <Route  path="/" name="New" element={<App ></App>} />
        </Routes>

    </>;
}

export default TrainingDS;