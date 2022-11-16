import React from 'react'
import { Link } from 'react-router-dom';
import Footer from '../Footer/Footer';
import Header from '../Header/Header';

const Layout = props => {


    return <>
        {/* <p>Slide bar</p> */}
        <Header />
        <p>Content</p>
        <Link to="/">Home</Link>
        <br></br>
        <Link to="/training-datasets">training-datasets</Link>

        {props.children}

        <Footer />
    </>;

}
export default Layout