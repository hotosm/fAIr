import { Box, Button } from '@mui/material';
import React, { useContext } from 'react'
import { Route, Routes } from 'react-router-dom';
import AuthContext from '../../../Context/AuthContext';
import AIModelEditor from './AIModelEditor/AIModelEditor';
import AIModelNew from './AIModelNew/AIModelNew';
import AIModelsList from './AIModelsList/AIModelsList';

const AIModels = props => {

    const {accessToken} = useContext(AuthContext)

    return <>

{accessToken && <Routes>
            {/* <Route  path="/new" name="New" element={<App ></App>} /> */}
            <Route  path="/:id" name="DataSet Editor" element={<AIModelEditor ></AIModelEditor>} />
            <Route  path="/new" name="New" element={<AIModelNew ></AIModelNew>} />
            <Route  path="/" name="List " element={<AIModelsList ></AIModelsList>} />
        </Routes>}

        {!accessToken &&  
        <div style={{height: "600px", width:"100%"}} >
                <img alt=" arrow" src='/red-arrow-up-corner-right-clip-art-30.png'
                style={{height: "100px", width:"100px", float: "right", marginRight:"35px"}} ></img>
            </div>}

       
    </>
}

export default AIModels;