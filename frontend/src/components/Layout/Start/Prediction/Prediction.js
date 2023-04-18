import LoadingButton from "@mui/lab/LoadingButton";
import {
  Alert,
  Button,
  Grid,
  Box,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import {
  FormControl,
  InputLabel,
  Tooltip,
  MenuItem,
  Select,
} from "@mui/material";

import React, { useContext, useEffect, useRef, useState } from "react";
import {
  FeatureGroup,
  LayersControl,
  MapContainer,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { useMutation, useQuery } from "react-query";
import { useParams } from "react-router-dom";
import axios from "../../../../axios";
import AuthContext from "../../../../Context/AuthContext";
import { GeoJSON } from "react-leaflet";

const Prediction = () => {
  const { id } = useParams();
  const [error, setError] = useState(false);
  const [josmLoading, setJosmLoading] = useState(false);

  const [apiCallInProgress, setApiCallInProgress] = useState(false);
  const [confidence, setConfidence] = useState(50);

  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(15);
  const [responseTime, setResponseTime] = useState(0);
  const [bounds, setBounds] = useState({});
  const [modifiedFeatures, setModifiedFeatures] = useState(null);

  const [windowSize, setWindowSize] = useState([
    window.innerWidth,
    window.innerHeight,
  ]);
  const [josmEnabled, setJosmEnabled] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch model information
      const modelRes = await axios.get(`/model/${id}`);
      const {
        name,
        published_training: trainingId,
        dataset: datasetId,
      } = modelRes.data;

      // Fetch training information
      const trainingRes = await axios.get(`/training/${trainingId}`);
      const { accuracy, description, zoom_level: zoomLevel } = trainingRes.data;
      const zoomLevels = zoomLevel.join(", ");

      // Fetch workspace data
      const workspaceRes = await axios.get(
        `/workspace/dataset_${datasetId}/output/training_${trainingId}/`
      );
      const { dir } = workspaceRes.data;

      // Calculate model size
      let modelSize = 0;
      if (dir["checkpoint.h5"]) {
        modelSize = dir["checkpoint.h5"].size;
      } else if (dir["checkpoint.tf"]) {
        modelSize = dir["checkpoint.tf"].size;
      }

      // Convert bytes to human-readable format
      const modelSizeInMB = ((modelSize / 1024) * 0.001).toFixed(2);

      // Set the state with the fetched data
      setModelInfo({
        id,
        name,
        lastModified: modelRes.data.last_modified,
        trainingId,
        trainingDescription: description,
        trainingZoomLevel: zoomLevels,
        trainingAccuracy: accuracy,
        modelSize: modelSizeInMB,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!apiCallInProgress) {
      return;
    }

    const timer = setInterval(() => {
      setResponseTime((prevResponseTime) => prevResponseTime + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [apiCallInProgress]);

  useEffect(() => {
    getModel();
  }, []);

  useEffect(() => {
    const handleWindowResize = () => {
      setWindowSize([window.innerWidth, window.innerHeight]);
    };

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  });

  const { mutate: getModel, isLoading } = useMutation(async () => {
    const res = await axios.get(`/model/${id}`);
    if (res.error) setError(res.error.response.statusText);
    else {
      mutate(res.data.dataset);
      return res.data;
    }
  });

  const { mutate, data: dataset } = useMutation(async (datasetId) => {
    const res = await axios.get(`/dataset/${datasetId}`);
    if (res.error) setError(res.error.response.statusText);
    else {
      getImagery(res.data.source_imagery);
      return res.data;
    }
  });

  const { mutate: getImagery, data: oamImagery } = useMutation(async (url) => {
    const res = await axios.get(url.replace("/{z}/{x}/{y}", ""));
    if (res.error) {
      setError(res.error.response.statusText);
      return;
    }
    if (map)
      map.setView([res.data.center[1], res.data.center[0]], res.data.center[2]);
    return res.data;
  });

  const { accessToken } = useContext(AuthContext);

  const {
    mutate: callPredict,
    data: predictions,
    isLoading: predictionLoading,
  } = useMutation(async () => {
    setApiCallInProgress(true);
    setResponseTime(0);
    const headers = {
      "access-token": accessToken,
    };
    const body = {
      bbox: [
        bounds._southWest.lng,
        bounds._southWest.lat,
        bounds._northEast.lng,
        bounds._northEast.lat,
      ],
      model_id: id,
      zoom_level: zoom,
      source: dataset.source_imagery,
      confidence: confidence,
    };
    const startTime = new Date().getTime(); // measure start time
    const res = await axios.post(`/prediction/`, body, { headers });
    const endTime = new Date().getTime(); // measure end time
    setResponseTime(((endTime - startTime) / 1000).toFixed(0)); // calculate and store response time in seconds
    setApiCallInProgress(false);
    if (res.error) {
      setError(
        `${res.error.response.statusText}, ${JSON.stringify(
          res.error.response.data
        )}`
      );
      return;
    }
    const updatedPredictions = addIdsToPredictions(res.data);
    return updatedPredictions;
  });

  async function openWithJosm() {
    setJosmLoading(true);
    if (!predictions) {
      setError("No predictions available");
      return;
    }

    try {
      const response = await axios.post("/geojson2osm/", {
        geojson: predictions,
      });
      if (response.status === 200) {
        const osmUrl = new URL("http://127.0.0.1:8111/load_data");
        osmUrl.searchParams.set("new_layer", "true");
        osmUrl.searchParams.set("data", response.data);

        const josmResponse = await fetch(osmUrl);
        const Imgurl = new URL("http://127.0.0.1:8111/imagery");
        Imgurl.searchParams.set("type", "tms");
        Imgurl.searchParams.set("title", oamImagery.name);
        Imgurl.searchParams.set("url", dataset.source_imagery);

        const imgResponse = await fetch(Imgurl);

        if (!josmResponse.ok) {
          throw new Error(
            "JOSM remote control failed, Make sure you have JOSM Open and Remote Control Enabled"
          );
        }
      } else {
        setError("OSM XML conversion failed");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setJosmLoading(false);
    }
  }

  function MyComponent() {
    const map = useMapEvents({
      zoomend: (e) => {
        const { _animateToZoom } = e.target;
        setZoom(_animateToZoom);
      },
      moveend: (e) => {
        setBounds(e.target.getBounds());
      },
    });
    return null;
  }
  function changeFeatureColor(featureId, color, predictionStatus) {
    const updatedFeatures = { ...modifiedFeatures };
    updatedFeatures[featureId] = { color, predictionStatus };
    setModifiedFeatures(updatedFeatures);
    const feature = predictions.features.find(
      (feature) => feature.properties.id === featureId
    );
    if (feature) {
      feature.properties.predictionStatus = predictionStatus;
    }
  }

  function addIdsToPredictions(predictions) {
    predictions.features.forEach((feature, index) => {
      feature.properties.id = index;
      feature.properties.predictionStatus = "initial";
    });
    return predictions;
  }
  function onEachFeature(feature, layer) {
    layer.on("click", (e) => {
      // Create the popup content
      const popupContent = `
        <div>
          <strong>Provide Feedback:</strong><br />
          <button id="rightButton" style="background-color: red; margin-right: 5px;">Right</button>
          <button id="wrongButton" style="background-color: green;">Wrong</button>
        </div>
      `;

      const popup = L.popup()
        .setLatLng(e.latlng)
        .setContent(popupContent)
        .openOn(e.target._map);

      const popupElement = popup.getElement();
      popupElement
        .querySelector("#rightButton")
        .addEventListener("click", () => {
          changeFeatureColor(feature.properties.id, "green", "right");
          e.target.closePopup();
        });
      popupElement
        .querySelector("#wrongButton")
        .addEventListener("click", () => {
          changeFeatureColor(feature.properties.id, "blue", "wrong");
          e.target.closePopup();
        });
    });
  }

  function getFeatureStyle(feature) {
    const color =
      feature.properties.color ||
      (feature.properties.predictionStatus === "wrong" ? "green" : "red");

    return {
      color: color,
      weight: 8,
      opacity: 1,
    };
  }

  return (
    <>
      <Grid container padding={2} spacing={2}>
        <Grid item xs={9} md={10}>
          <MapContainer
            className="pointer"
            center={[-0.29815, 36.07572]}
            style={{
              height: windowSize[1] - 100,
              width: "100%",
              display: "flex",
            }}
            zoom={15}
            whenCreated={setMap}
          >
            <MyComponent />
            <LayersControl position="topright">
              {/* code for TileLayer components */}
              {oamImagery && dataset && (
                <LayersControl.BaseLayer name={oamImagery.name} checked>
                  <TileLayer
                    maxZoom={oamImagery.maxzoom}
                    minZoom={oamImagery.minzoom}
                    attribution={oamImagery.name}
                    url={dataset.source_imagery}
                  />
                </LayersControl.BaseLayer>
              )}
            </LayersControl>

            <FeatureGroup>
              {predictions && (
                <GeoJSON
                  attribution="&copy; credits to OSM"
                  data={predictions}
                  style={getFeatureStyle}
                  onEachFeature={onEachFeature} // Attach the onEachFeature function
                />
              )}
            </FeatureGroup>
          </MapContainer>
        </Grid>
        <Grid item xs={3} md={2}>
          <LoadingButton
            variant="contained"
            color="primary"
            disabled={zoom < 20 || !zoom || zoom > 22}
            loading={predictionLoading}
            onClick={() => {
              setError(false);
              callPredict();
            }}
          >
            Run Prediction
          </LoadingButton>
          <Box display="flex" alignItems="center" mt={1}>
            <Tooltip title="Select confidence threshold probability for filtering out low-confidence predictions">
              <Typography variant="h7" style={{ marginRight: "8px" }}>
                <strong>Confidence: </strong>
              </Typography>
            </Tooltip>
            <FormControl size="small">
              <Select
                value={confidence}
                onChange={(e) => setConfidence(e.target.value)}
                style={{ width: "90px" }}
                sx={{ "& .MuiSelect-select": { borderBottom: "none" } }}
                MenuProps={{ disablePortal: true }}
              >
                <MenuItem value={25}>25 %</MenuItem>
                <MenuItem value={50}>50 %</MenuItem>
                <MenuItem value={75}>75 %</MenuItem>
                <MenuItem value={90}>90 %</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {map && (
            <Box>
              <Typography variant="h7">
                <strong> Current Zoom:</strong> {JSON.stringify(zoom)}
              </Typography>
              <Typography variant="h7">
                <strong> Response: </strong> {responseTime} sec
              </Typography>

              {loading ? (
                <Box display="flex" justifyContent="center" mt={2}>
                  <CircularProgress />
                </Box>
              ) : (
                modelInfo && (
                  <Paper elevation={3} sx={{ padding: 2, marginTop: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      <strong>Loaded Model</strong>
                    </Typography>
                    <Typography variant="body1">
                      <strong>Model ID:</strong> {modelInfo.id}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Model Name:</strong> {modelInfo.name}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Model Last Modified:</strong>{" "}
                      {new Date(modelInfo.lastModified).toLocaleString()}
                    </Typography>
                    <Typography variant="h6" gutterBottom mt={2}>
                      <strong>Published Training</strong>
                    </Typography>
                    <Typography variant="body1">
                      <strong>Training ID:</strong> {modelInfo.trainingId}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Training Description:</strong>{" "}
                      {modelInfo.trainingDescription}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Training Zoom Level:</strong>{" "}
                      {modelInfo.trainingZoomLevel}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Training Accuracy:</strong>{" "}
                      {modelInfo.trainingAccuracy} %
                    </Typography>
                    <Typography variant="body1">
                      <strong>Model Size:</strong> {modelInfo.modelSize} MB
                    </Typography>
                  </Paper>
                )
              )}
            </Box>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {predictions && (
            <LoadingButton
              variant="contained"
              color="secondary"
              onClick={openWithJosm}
              loading={josmLoading}
            >
              Open Results with JOSM
            </LoadingButton>
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default Prediction;
