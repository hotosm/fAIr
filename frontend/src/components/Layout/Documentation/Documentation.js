import React, { useContext } from 'react'
import AuthContext from '../../../Context/AuthContext';

const Documentation = props => {

    const { accessToken,redirect } = useContext(AuthContext);
    return <>
       
            <div style={{ height: "600px", width: "500px", }} >
                Documentation conponenet  {accessToken}
                <br/>
                redirect   {redirect}  </div>
     
    </>
}

export default Documentation;