
import React, { useContext, useEffect, useState } from 'react'
import { useMutation } from 'react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from '../../axios'
import AuthContext from '../../Context/AuthContext';
const Authenticate = props => {

    const {redirect, authenticate} = useContext(AuthContext);
    const [error, setError] = useState(false)
    let location = useLocation();
    const navigate = useNavigate()
    
    const callback = async () => {
        try {
         
            // const params = `?${location.search.split("&")[1]}&${location.search.split("&")[2]}`
            const params =location.search;
        // console.log('location.search.split("&")',location.search.split("&"))
          const res = await axios.get(`/auth/callback/${params}`);
            
          if (res.error) 
            setError(res.error.response.statusText);
                
         console.log("callback access_token",res.data.access_token);
         authenticate(res.data.access_token)
         console.log("location.search",location.search);
       
         navigate(`${localStorage.getItem("redirect") ? localStorage.getItem("redirect")  : "/"}`)
          return res.data;
        } catch (e) {
          console.log("isError");
          setError(e);
        } finally {
          
        }
      };
      const { mutate,  isLoading} = useMutation(callback);

    useEffect(() => {
      
        console.log(location)
        mutate()
      return () => {
       
      }
    }, [])
    
    return <>


     </>
}

export default Authenticate;