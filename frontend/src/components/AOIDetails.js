import React from 'react'
import { useQuery } from 'react-query';

import axios from '../axios'

import {timeSince,aoiStatusText} from '../utils'
const AOIDetails = props =>
{

    // console.log("rendering AOIDetails",props)
    const fetchAOI = async () => {

        try {       
         
    
         const res = await axios.get(`/aoi/${props.aoiId}/`);
    
          if (res.error){
          // setMapError(res.error.response.statusText);
          console.log(res.error.response.statusText);
        }
          else 
          {
    
            // success full fetch
            // console.log("API details, ",props.aoiId,res.data);
             return res.data;
          }
           
        } catch (e) {
          console.log("isError",e);
          
        } finally {
          
        }
      };
      const { data } = useQuery("fetchAOI" + props.aoiId,fetchAOI,{refetchInterval:5000});

    return <>
     {data && <span key={props.aoiId}>
        {aoiStatusText(data.properties.download_status)} {data.properties.last_fetched_date && timeSince(new Date(data.properties.last_fetched_date),new Date()) }
        </span>}
    </>
}

export default AOIDetails