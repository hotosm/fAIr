import { MenuItem, Typography } from '@mui/material';
import React, { useContext, useState } from 'react'
import { useMutation } from 'react-query';
import { useLocation } from 'react-router-dom';
import axios from '../../axios'
import AuthContext from '../../Context/AuthContext';

const Login = props => {

    const [error, setError] = useState(false);
   const location = useLocation()
    const authenticate = async () => {
        try {
         
        
          const res = await axios.get("/auth/login/");
    
          if (res.error) 
            setError(res.error.response.statusText);
            const params = new URLSearchParams({
                return_uri: location.pathname
              }).toString();

            // const newRUL= res.data.login_url.replace("authenticate%2F","authenticate%2F%3F"+params);
            const newRUL= res.data.login_url;
          localStorage.setItem("redirect",location.pathname)
          console.log("authenticate",newRUL);
         window.open(newRUL,'_parent','width=800,height=600,status=no')
          return res.data;
        } catch (e) {
          console.log("isError");
          setError(e);
        } finally {
          
        }
      };
      const { mutate,  isLoading} = useMutation(authenticate);
    const handleCloseUserMenu = () => {

        mutate()
    }
    return <MenuItem onClick={handleCloseUserMenu} >
        <Typography textAlign="center">Log in with </Typography>
        <img
            src={`https://wiki.openstreetmap.org/w/images/thumb/7/79/Public-images-osm_logo.svg/256px-Public-images-osm_logo.svg.png`}
            height="25px"
            alt={"OSM_Logo"}
            loading="lazy"
        />
    </MenuItem>

}

export default Login;