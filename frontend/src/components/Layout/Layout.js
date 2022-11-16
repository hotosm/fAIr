import React from 'react'
import { Link } from 'react-router-dom';
import Footer from '../Footer/Footer';
import Header from '../Header/Header';

const Layout = props => {


    return <>
        {/* <p>Slide bar</p> */}
        <Header />
        {props.children}

        <Footer />
    </>;

}
export default Layout