import "./DatasetEditor.css";
import DatasetMap from "./DatasetMap";
import { Box, Container, Grid, Typography } from "@mui/material";
import AOI from "./AOI";
import { useEffect, useState } from "react";
import TileServerList from "./TileServerList";
import TMProject from "./TMProject";
import MapActions from "./MapActions";
import axios from '../../../../axios'
import { useMutation } from "react-query";
import {  useParams } from "react-router-dom";

function DatasetEditor() {
  const [mapLayers, setMapLayers] = useState([]);
  const [currentPosision, setCurrentPosision] = useState([]);
  const [oamImagery, setOAMImagery] = useState(null);
  const [geoJSON, setgeoJSON] = useState(null);
  const [error, setError] = useState(null);
  let { id } = useParams();
  const mapLayersChangedHandler = (layers) => {
    setMapLayers(layers);
  };

  const selectAOIHandler = (e, zoom) => {
    setCurrentPosision([e[0], e[1], zoom]);
  };
  const navigateToCenter = (e) => {
    setCurrentPosision([e[1], e[0], 15]);
  };
  const addImageryHandler = (imageryDetails, url) => {
    setOAMImagery({ ...imageryDetails, url });
  };
   const AddtoMapHandler = (geoJSON) => {
      setgeoJSON(geoJSON);
  };
  const getDataset = async (id) => {
    try {
     
    
      const res = await axios.get("/dataset/" + id);

      if (res.error) 
        setError(res.error.response.statusText);
              
     console.log("dataset",res.data);
      return res.data;
    } catch (e) {
      console.log("isError");
      setError(e);
    } finally {
      
    }
  };
  const { mutate, data:dataset, isLoading} = useMutation(getDataset);

  useEffect(() => {
    mutate(id)
  
    return () => {
      
    }
  }, [])
  
  return (
  <>
    {isLoading && "Loading ............"}

    { dataset &&
     <Grid container padding={2} spacing={2}>
      <Grid item xs={6} md={9}>
        <DatasetMap
          onMapLayersChange={mapLayersChangedHandler}
          currentPosision={
            currentPosision && [currentPosision[0], currentPosision[1]]
          }
          zoom={currentPosision && currentPosision[2]}
          clearCurrentPosision={() => {
            setCurrentPosision([]);
          }}
          oamImagery={oamImagery}
          geoJSON={geoJSON}
          emptyPassedgeoJSON={()=>{setgeoJSON(null)}}
          dataset={dataset}
        ></DatasetMap>
       
      </Grid>
      <Grid item xs={6} md={3} className="column2"  >
        <TileServerList
          navigateToCenter={navigateToCenter}
          addImagery={addImageryHandler}
          removeImagery={(e) => {
            setOAMImagery(null);
          }}
          dataset={dataset}
        ></TileServerList>
        <AOI mapLayers={mapLayers.filter(i=> i.type ==="aoi")} selectAOIHandler={selectAOIHandler}></AOI>
        <TMProject addtoMap={AddtoMapHandler}></TMProject>
        
      </Grid>
    </Grid>}
    </>
  );
}

export default DatasetEditor;
