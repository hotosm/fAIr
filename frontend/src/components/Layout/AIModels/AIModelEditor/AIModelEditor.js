import React from 'react'
import { useParams } from 'react-router-dom';

const AIModelEditor = props => {

    let { id } = useParams();
    return <>
    <div style={{height: "600px", width:"500px"}} >
    <p>AIModelEditor content with models id {id}</p>
   
    </div>
    </>;
}
export default AIModelEditor