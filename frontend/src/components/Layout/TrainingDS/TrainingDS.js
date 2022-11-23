import React from 'react'
import { Route, Routes } from 'react-router-dom';
import DatasetEditor from './DatasetEditor/DatasetEditor';
import DatasetList from './DatasetList/DatasetList'
const TrainingDS = props => {


    return <>
        <Routes>
            {/* <Route  path="/new" name="New" element={<App ></App>} /> */}
            <Route  path="/:id" name="New" element={<DatasetEditor ></DatasetEditor>} />
            <Route  path="/" name="New" element={<DatasetList ></DatasetList>} />
        </Routes>

    </>;
}

export default TrainingDS;