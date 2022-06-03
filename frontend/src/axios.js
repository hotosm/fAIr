import axios from 'axios';

console.log('process.env.REACT_APP_API_BASE',process.env.REACT_APP_API_BASE)

const instance = axios.create(
    {
        baseURL: process.env.REACT_APP_API_BASE
    }
);


instance.interceptors.response.use((response) => {
  
    return response;
  }, (error) => {


   if (!error.response)
   {
     console.log('set network error')
      
    }
    else
    {
      
    }

   if (error.response.status === 401)
   console.log('set network error 401')
   
    return Promise.resolve({ error });
  });

instance.defaults.headers.common = {
    ...instance.defaults.headers.common,
    
    "Content-Type": 'application/json',
    
 };
 instance.defaults.preflightContinue = true;
 
 
export default instance;