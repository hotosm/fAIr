import React from 'react'
import { Link } from 'react-router-dom';

const Layout = props => {


    return <>
        {/* <p>Slide bar</p> */}
        <p>Header</p>
        <p>Content</p>
        <Link to="/">Home</Link>
        <br></br>
        <Link to="/training-datasets">training-datasets</Link>

        {props.children}

        <p>Footer</p>
    </>;

}
export default Layout