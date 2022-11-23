import React from 'react'
import { Route, Routes } from 'react-router-dom';
import DatasetEditor from './DatasetEditor/DatasetEditor';
import DatasetList from './DatasetList/DatasetList'
import DatasetNew from './DatasetNew/DatasetNew';
const TrainingDS = props => {


    return <>
        <Routes>
            {/* <Route  path="/new" name="New" element={<App ></App>} /> */}
            <Route  path="/:id" name="DataSet Editor" element={<DatasetEditor ></DatasetEditor>} />
            <Route  path="/new" name="New" element={<DatasetNew ></DatasetNew>} />
            <Route  path="/" name="List " element={<DatasetList ></DatasetList>} />
        </Routes>

    </>;
}

export default TrainingDS;