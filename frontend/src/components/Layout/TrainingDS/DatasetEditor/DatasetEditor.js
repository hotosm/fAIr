import "./DatasetEditor.css";
import DatasetMap from "./DatasetMap";
import { Box, Container, Grid, Typography } from "@mui/material";
import AOI from "./AOI";
import { useEffect, useState } from "react";
import TileServerList from "./TileServerList";
import TMProject from "./TMProject";
import MapActions from "./MapActions";
import axios from "../../../../axios";
import { useMutation } from "react-query";
import { useParams } from "react-router-dom";
import DatasetEditorHeader from "./DatasetEditorHeader";

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

      if (res.error) setError(res.error.response.statusText);

      console.log("dataset", res.data);
      setOAMImagery({
        center: [0, 0],
        name: "Private",
        minzoom: 0,
        maxzoom: 23,
        attribution: res.data.source_imagery,
        url: res.data.source_imagery,
      });
      return res.data;
    } catch (e) {
      console.log("isError");
      setError(e);
    } finally {
    }
  };
  const { mutate, data: dataset, isLoading } = useMutation(getDataset);

  useEffect(() => {
    mutate(id);

    return () => {};
  }, []);
  const [zoom, setZoom] = useState(15);
  const deleteAOIButton = (id, leafletId) => {
    setMapLayers((layers) => layers.filter((l) => l.id !== leafletId));
    window.location.reload(false);
  };
  return (
    <>
      {isLoading && "Loading ............"}

      {dataset && (
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
              emptyPassedgeoJSON={() => {
                setgeoJSON(null);
              }}
              dataset={dataset}
              setZoom={setZoom}
            ></DatasetMap>
          </Grid>
          <Grid item xs={6} md={3}>
            <DatasetEditorHeader
              dsId={dataset.id}
              dsName={dataset.name}
              zoom={zoom}
              // editMode={editMode}
              oamImagery={oamImagery}
              // setEditMode={setEditMode}
              mapLayersLength={mapLayers.length}
            ></DatasetEditorHeader>

            <TileServerList
              navigateToCenter={navigateToCenter}
              addImagery={addImageryHandler}
              removeImagery={(e) => {
                setOAMImagery(null);
              }}
              dataset={dataset}
            ></TileServerList>
            <AOI
              oamImagery={oamImagery}
              mapLayers={mapLayers.filter((i) => i.type === "aoi")}
              selectAOIHandler={selectAOIHandler}
              deleteAOIButton={deleteAOIButton}
              datasetId={dataset.id}
            ></AOI>
            <TMProject addtoMap={AddtoMapHandler}></TMProject>
          </Grid>
        </Grid>
      )}
    </>
  );
}

export default DatasetEditor;
