import React from 'react'
import {
    Routes, Route, Navigate,
} from "react-router-dom";
import Home from '../components/Home/Home';
import Layout from '../components/Layout/Layout';
import { publicRoutes } from '../routes';

const Fair = () => {


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