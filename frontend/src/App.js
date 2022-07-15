import "./App.css";
import DatasetMap from "./components/DatasetMap";
import { Box, Container, Grid, Typography } from "@mui/material";
import AOI from "./components/AOI";
import { useState } from "react";
import TileServerList from "./components/TileServerList";
import TMProject from "./components/TMProject";

function App() {
  const [mapLayers, setMapLayers] = useState([]);
  const [currentPosision, setCurrentPosision] = useState([]);
  const [oamImagery, setOAMImagery] = useState(null);
  const [geoJSON, setgeoJSON] = useState(null);

  const mapLayersChangedHandler = (layers) => {
    setMapLayers(layers);
  };

  const selectAOIHandler = (e, zoom) => {
    setCurrentPosision([e[0], e[1], zoom]);
  };
  const navigateToCenter = (e) => {
    setCurrentPosision([e[1], e[0], e[2]]);
  };
  const addImageryHandler = (imageryDetails, url) => {
    setOAMImagery({ ...imageryDetails, url });
  };
   const AddtoMapHandler = (geoJSON) => {
      setgeoJSON(geoJSON);
  };
  return (
    <Grid container padding={2} spacing={2}>
      <Grid item xs={6} md={8}>
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
        ></DatasetMap>
      </Grid>
      <Grid item xs={6} md={4}>
        <TileServerList
          navigateToCenter={navigateToCenter}
          addImagery={addImageryHandler}
          removeImagery={(e) => {
            setOAMImagery(null);
          }}
        ></TileServerList>
        <TMProject addtoMap={AddtoMapHandler}></TMProject>
        <AOI mapLayers={mapLayers.filter(i=> i.type ==="aoi")} selectAOIHandler={selectAOIHandler}></AOI>

      </Grid>
    </Grid>
  );
}

export default App;
