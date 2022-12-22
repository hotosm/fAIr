import React, { useContext } from 'react'
import { Route, Routes } from 'react-router-dom';
import AuthContext from '../../../Context/AuthContext';
import DatasetEditor from './DatasetEditor/DatasetEditor';
import DatasetList from './DatasetList/DatasetList'
import DatasetNew from './DatasetNew/DatasetNew';
const TrainingDS = props => {

    const {accessToken} = useContext(AuthContext)


    return <>
       {accessToken && <Routes>
            {/* <Route  path="/new" name="New" element={<App ></App>} /> */}
            <Route  path="/:id" name="DataSet Editor" element={<DatasetEditor ></DatasetEditor>} />
            <Route  path="/new" name="New" element={<DatasetNew ></DatasetNew>} />
            <Route  path="/" name="List " element={<DatasetList ></DatasetList>} />
        </Routes>}

        {!accessToken &&  
        <div style={{height: "600px", width:"100%"}} >
                <img alt=" arrow" src='/red-arrow-up-corner-right-clip-art-30.png'
                style={{height: "100px", width:"100px", float: "right", marginRight:"35px"}} ></img>
            </div>}

    </>;
}

export default TrainingDS;