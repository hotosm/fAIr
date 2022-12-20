import React, { useContext, useEffect, useState } from 'react'
import {
    Routes, Route, Navigate,
} from "react-router-dom";
import Home from '../components/Layout/Home/Home';
import Layout from '../components/Layout/Layout';
import AuthContext from '../Context/AuthContext';
import { AuthContextProvidor } from '../Context/AuthContext';
import { publicRoutes } from '../routes';

const Fair = () => {

    const {accessToken,authenticate} = useContext(AuthContext)

    useEffect(() => {
      if(!accessToken && localStorage.getItem("token"))
      {
            authenticate(localStorage.getItem("token"))
      }
    
      return () => {
        
      }
    }, [accessToken,authenticate])
    
    return <>
    
        <Layout>
            <React.Suspense fallback={<div>Loading...</div>}>
                <Routes>
                    {publicRoutes.map((route, idx) =>
                        <Route
                            key={idx}
                            path={route.path}

                            name={route.name}
                            element={route.element}
                        />)}
                    {/* fallback routes bellow */}
                    <Route
                        path="*"

                        element={<Navigate to="/" />} // TODO: add a page not found componenet and ask user to feedback
                    />
                </Routes>

            </React.Suspense>
        </Layout>
   
    </>;
}

export default Fair;