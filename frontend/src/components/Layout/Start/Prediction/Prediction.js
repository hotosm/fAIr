import LoadingButton from "@mui/lab/LoadingButton";
import {
  Alert,
  Button,
  Grid,
  Box,
  Switch,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import {
  FormControl,
  InputLabel,
  Tooltip,
  MenuItem,
  Link,
  TextField,
  Select,
} from "@mui/material";
import L from "leaflet";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  FeatureGroup,
  LayersControl,
  MapContainer,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { useMutation, useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../../../axios";
import axiosPrediction from "../../../../axios-predictor";
import AuthContext from "../../../../Context/AuthContext";
import Snackbar from "@mui/material/Snackbar";

import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import EditableGeoJSON from "./EditableGeoJSON";

const Prediction = () => {
  const { id } = useParams();
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [feedbackSubmittedCount, setFeedbackSubmittedCount] = useState(0);
  const [addedTiles, setAddedTiles] = useState(new Set());
  const [PredictionAPI, setPredictionAPI] = useState(
    process.env.REACT_APP_PREDICTOR_API_BASE
  );
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  let tileBoundaryLayer = null;
  const [error, setError] = useState(false);
  const [josmLoading, setJosmLoading] = useState(false);
  const [conflateLoading, setConflateLoading] = useState(false);

  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [predictionZoomlevel, setpredictionZoomlevel] = useState(null);

  const [apiCallInProgress, setApiCallInProgress] = useState(false);
  const [confidence, setConfidence] = useState(90);
  const [use_josm_q, setUse_josm_q] = useState(false);
  const handleUseJosmToggle = () => {
    setUse_josm_q(!use_josm_q);
  };
  const [totalPredictionsCount, settotalPredictionsCount] = useState(0);
  // const [DeletedCount, setDeletedCount] = useState(0);
  // const [CreatedCount, setCreatedCount] = useState(0);
  // const [ModifiedCount, setModifiedCount] = useState(0);
  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(15);
  const [responseTime, setResponseTime] = useState(0);
  const [bounds, setBounds] = useState({});

  const [windowSize, setWindowSize] = useState([
    window.innerWidth,
    window.innerHeight,
  ]);
  const [josmEnabled, setJosmEnabled] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [maxAngleChange, setMaxAngleChange] = useState(15);
  const [skewTolerance, setSkewTolerance] = useState(15);
  const [tolerance, setTolerance] = useState(0.3);
  const [areaThreshold, setAreaThreshold] = useState(4);
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

  const [imagery, setImagery] = useState(null);
  const { mutate, data: dataset } = useMutation(async (datasetId) => {
    const res = await axios.get(`/dataset/${datasetId}`);
    if (res.error) setError(res.error.response.statusText);
    else {
      if (res.data.source_imagery.includes("openaerialmap")) {
        getImagery(res.data.source_imagery);
      } else {
        setImagery({
          maxzoom: 23,
          minzoom: 5,
          name: res.data.source_imagery,
          url: res.data.source_imagery,
        });
      }
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

    // setImagery(res.data);
    setImagery({
      maxzoom: res.data.maxzoom,
      minzoom: res.data.minzoom,
      name: res.data.name,
      url: url,
    });
    return res.data;
  });

  const { accessToken } = useContext(AuthContext);

  const downloadPredictions = () => {
    if (!predictions) {
      return;
    }

    const content = JSON.stringify(predictions);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "predictions.geojson";
    link.click();

    URL.revokeObjectURL(url);
  };

  const {
    mutate: callPredict,
    data: returnedpredictions,
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
      model_id: id, // this will be used when PredictionAPI is empty and calling same base API
      checkpoint: `/mnt/efsmount/data/trainings/dataset_${dataset.id}/output/training_${modelInfo.trainingId}/checkpoint.tflite`, // this will be used when there is PredictionAPI different from the base API
      zoom_level: zoom,
      source: dataset.source_imagery,
      confidence: confidence,
      use_josm_q: use_josm_q,
      max_angle_change: maxAngleChange,
      skew_tolerance: skewTolerance,
      tolerance: tolerance,
      area_threshold: areaThreshold,
    };
    const startTime = new Date().getTime(); // measure start time
    const res = await (PredictionAPI ? axiosPrediction : axios).post(
      `/${PredictionAPI ? "predict" : "prediction"}/`,
      body,
      { headers }
    );
    const endTime = new Date().getTime(); // measure end time
    setResponseTime(((endTime - startTime) / 1000).toFixed(0)); // calculate and store response time in seconds
    setApiCallInProgress(false);
    if (res.status === 204) {
      // Add this if statement
      setError("No features found on requested bbox");
      return;
    }
    if (res.error) {
      setError(
        `${res.error.response.statusText}, ${JSON.stringify(
          res.error.response.data
        )}`
      );
      return;
    }
    setpredictionZoomlevel(zoom);
    const updatedPredictions = addIdsToPredictions(res.data);
    setPredictions(updatedPredictions);
    settotalPredictionsCount(updatedPredictions.features.length);

    if (addedTiles.size > 0) {
      console.log("Map has tileboundarylayer");
    }
    return updatedPredictions;
  });

  const handleSubmitFeedback = async () => {
    setFeedbackLoading(true);
    console.log(predictions.features.length);
    let count = 0;
    try {
      for (let i = 0; i < predictions.features.length; i++) {
        console.log(predictions.features[i]);
        const { geometry } = predictions.features[i];
        const { action } = predictions.features[i].properties;
        if (action !== "INITIAL") {
          // Add this if statement
          const body = {
            geom: geometry,
            action,
            training: modelInfo.trainingId,
            zoom_level: predictionZoomlevel,
          };
          console.log(body);
          const headers = {
            "access-token": accessToken,
            Authorization: `Bearer ${accessToken}`,
          };
          await axios.post("/feedback/", body, { headers });
          count = count + 1;
        }
      }
      setFeedbackLoading(false);
      setFeedbackSubmittedCount(count);
      setSnackbarOpen(true);
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error(error);
      setFeedbackLoading(false);
      window.alert("An error occurred while submitting feedback.");
    }
  };

  async function openWithJosm() {
    setJosmLoading(true);
    setError("");
    if (!predictions) {
      setError("No predictions available");
      return;
    }

    console.log("predictions for JOSM", predictions);
    // Remove the "id", action , duplicate and intersect propertiesproperties from each feature in the "features" array
    const postprocessed_predictions = {
      ...predictions,
      features: predictions.features
        .filter((f) => f.properties.action === "JOSM")
        .map((feature) => {
          const { id, action, duplicate, intersect, ...newProps } =
            feature.properties;
          // if (action === "JOSM")
          return {
            ...feature,
            properties: newProps,
          };
        }),
    };

    try {
      const response = await axios.post("/geojson2osm/", {
        geojson: postprocessed_predictions,
      });
      if (response.status === 200) {
        const osmUrl = new URL("http://127.0.0.1:8111/load_data");
        osmUrl.searchParams.set("new_layer", "true");
        osmUrl.searchParams.set("data", response.data);
        const josmResponse = await fetch(osmUrl);

        const Imgurl = new URL("http://127.0.0.1:8111/imagery");
        Imgurl.searchParams.set("type", "tms");
        Imgurl.searchParams.set("title", imagery.name);
        Imgurl.searchParams.set("url", dataset.source_imagery);
        const imgResponse = await fetch(Imgurl);
        // bounds._southWest.lng,
        // bounds._southWest.lat,
        // bounds._northEast.lng,
        // bounds._northEast.lat,
        const loadurl = new URL("http://127.0.0.1:8111/load_and_zoom");
        loadurl.searchParams.set("bottom", bounds._southWest.lat);
        loadurl.searchParams.set("top", bounds._northEast.lat);
        loadurl.searchParams.set("left", bounds._southWest.lng);
        loadurl.searchParams.set("right", bounds._northEast.lng);
        loadurl.searchParams.set(
          "changeset_hashtags",
          process.env.REACT_APP_HASHTAG_PREFIX
        );
        const loadResponse = await fetch(loadurl);

        if (!josmResponse.ok) {
          throw new Error(
            "JOSM remote control failed, Make sure you have JOSM Open and Remote Control Enabled"
          );
        }
      } else {
        setError("OSM XML conversion failed");
      }
    } catch (error) {
      setError("Couldn't Open JOSM , Check if JOSM is Open");
    } finally {
      setJosmLoading(false);
    }
  }

  async function conflateFeatures() {
    setConflateLoading(true);
    if (!predictions) {
      setError("No predictions available");
      return;
    }
    // Remove the "id" , "action"  from each feature in the "features" array
    const modifiedPredictions = {
      ...predictions,
      features: predictions.features.map((feature) => {
        const { id, action, ...newProps } = feature.properties;
        return {
          ...feature,
          properties: newProps,
        };
      }),
    };
    try {
      const response = await axios.post("/conflate/", {
        geojson: modifiedPredictions,
      });
      if (response.status == 200) {
        setPredictions(null);
        const updatedPredictions = addIdsToPredictions(response.data);
        setPredictions(updatedPredictions);
        settotalPredictionsCount(updatedPredictions.features.length);
      }
    } catch (error) {
      setError(error);
    } finally {
      setConflateLoading(false);
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

  function addIdsToPredictions(predictions) {
    const features = predictions.features.map((feature, index) => {
      return {
        ...feature,
        properties: {
          ...feature.properties,
          id: index,
          action: "INITIAL",
        },
      };
    });

    settotalPredictionsCount(features.length);

    return { ...predictions, features };
  }
  const navigate = useNavigate();
  const getFeedback = async (trainingId) => {
    if (!modelInfo || !modelInfo.trainingId) return;
    try {
      const headers = {
        "access-token": accessToken,
      };
      const res = await axios.get(
        `/feedback/?training=${modelInfo.trainingId}`,
        null,
        {
          headers,
        }
      );

      if (res.error) {
      } else {
        console.log("getFeedback ", res.data);
        return res.data;
      }
    } catch (e) {
      console.log("isError", e);
    } finally {
    }
  };
  const { data: feedbackData, refetch: refetchFeedback } = useQuery(
    "getfeedback" + (modelInfo && modelInfo.trainingId),
    getFeedback,
    {
      refetchInterval: 120000,
    }
  );
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
              <LayersControl.BaseLayer name="OSM" checked={true}>
                <TileLayer
                  maxZoom={24}
                  maxNativeZoom={19}
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Google - view only">
                <TileLayer
                  maxNativeZoom={22}
                  maxZoom={26}
                  attribution='&copy; <a href="https://www.google.com">Google</a>'
                  url="http://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                />
              </LayersControl.BaseLayer>
              {imagery && dataset && (
                <LayersControl.BaseLayer name={imagery.name} checked={true}>
                  (
                  <TileLayer
                    maxZoom={imagery.maxzoom}
                    minZoom={imagery.minzoom}
                    attribution={imagery.name}
                    url={imagery.url}
                  />
                  )
                </LayersControl.BaseLayer>
              )}
            </LayersControl>

            <FeatureGroup>
              {predictions && dataset && (
                <EditableGeoJSON
                  data={predictions}
                  setPredictions={setPredictions}
                  modelId={id}
                  trainingId={modelInfo.trainingId}
                  mapref={map}
                  sourceImagery={dataset.source_imagery}
                  predictionZoomlevel={predictionZoomlevel}
                  addedTiles={addedTiles}
                  // setAddedTiles={setAddedTiles}
                  // setCreatedCount={setCreatedCount}
                  // setModifiedCount={setModifiedCount}
                  // setDeletedCount={setDeletedCount}
                  tileBoundaryLayer={tileBoundaryLayer}
                  refestchFeeedback={() => {
                    refetchFeedback();
                  }}
                />
              )}
            </FeatureGroup>
          </MapContainer>
        </Grid>
        <Grid item xs={3} md={2}>
          <LoadingButton
            variant="contained"
            color="primary"
            disabled={zoom < 19 || !zoom || zoom > 22}
            loading={predictionLoading}
            onClick={() => {
              setError(false);
              callPredict();
            }}
          >
            Run Prediction
          </LoadingButton>

          {map && (
            <Box>
              <Paper elevation={1} sx={{ padding: 2, marginTop: 0 }}>
                <Typography variant="body2">
                  <strong> Current Zoom:</strong> {JSON.stringify(zoom)}
                </Typography>
                {predictions && (
                  <Typography variant="body2">
                    <strong> Predicted on:</strong> {predictionZoomlevel} Zoom
                  </Typography>
                )}
                <Typography variant="body2">
                  <strong> Response: </strong> {responseTime} sec
                </Typography>
              </Paper>
              <Paper elevation={1} sx={{ padding: 2, marginTop: 0.5 }}>
                <Typography variant="h8" gutterBottom>
                  <strong>Config</strong>
                </Typography>
                <Box display="flex" alignItems="center">
                  <Typography variant="body2" style={{ marginRight: "10px" }}>
                    Use JOSM Q:
                  </Typography>
                  <Switch
                    size="small"
                    checked={use_josm_q}
                    onChange={handleUseJosmToggle}
                    color="primary"
                  />
                </Box>
                <Box display="flex" alignItems="center">
                  <Tooltip title="Select confidence threshold probability for filtering out low-confidence predictions">
                    <Typography variant="body2" style={{ marginRight: "10px" }}>
                      Confidence:
                    </Typography>
                  </Tooltip>
                  <FormControl size="small">
                    <Select
                      size="small"
                      value={confidence}
                      onChange={(e) => setConfidence(e.target.value)}
                      style={{ width: "80px", fontSize: "12px" }} // Adjust width and font size
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
                <Typography variant="body2">Vectorization Config :</Typography>
                <Box mt={2} display="flex" alignItems="center">
                  <Tooltip title="Tolerance distance for simplying feature in meter">
                    <TextField
                      label="Tolerance"
                      type="number"
                      value={tolerance}
                      onChange={(e) => setTolerance(e.target.value)}
                      InputProps={{
                        inputProps: { min: 0, step: 0.1 },
                        style: { width: "80px", fontSize: "12px" },
                      }}
                      variant="outlined"
                      size="small"
                    />
                  </Tooltip>
                  <Tooltip title="Area threshold to remove small feature in Sqm">
                    <TextField
                      label="Area"
                      type="number"
                      value={areaThreshold}
                      onChange={(e) => setAreaThreshold(e.target.value)}
                      InputProps={{
                        inputProps: { min: 0, step: 1 },
                        style: {
                          width: "80px",
                          fontSize: "12px",
                          marginLeft: "10px",
                        },
                      }}
                      variant="outlined"
                      size="small"
                    />
                  </Tooltip>
                </Box>
                {use_josm_q && (
                  <Box mt={2} display="flex" alignItems="center">
                    <Tooltip title="Accepted maximum angle deviation in degree">
                      <TextField
                        label="Max Angle Change"
                        type="number"
                        value={maxAngleChange}
                        onChange={(e) => setMaxAngleChange(e.target.value)}
                        InputProps={{
                          inputProps: { min: 0, step: 1 },
                          style: { width: "80px", fontSize: "12px" },
                        }}
                        variant="outlined"
                        size="small"
                      />
                    </Tooltip>
                    <Tooltip title="Tolerance angle in degree">
                      <TextField
                        label="Skew Tolerance"
                        type="number"
                        value={skewTolerance}
                        onChange={(e) => setSkewTolerance(e.target.value)}
                        InputProps={{
                          inputProps: { min: 0, step: 1 },
                          style: {
                            width: "80px",
                            fontSize: "12px",
                            marginLeft: "10px",
                          },
                        }}
                        variant="outlined"
                        size="small"
                      />
                    </Tooltip>
                  </Box>
                )}
              </Paper>
              <Paper elevation={1} sx={{ padding: 2, marginTop: 0.5 }}>
                <Typography variant="h8" gutterBottom>
                  <strong>Feedback</strong>
                </Typography>
                <Typography variant="body2">
                  Initial Predictions:
                  {totalPredictionsCount}
                </Typography>
                {feedbackData && feedbackData.features && (
                  <Typography variant="body2">
                    Total feedbacks count:{feedbackData.features.length}
                  </Typography>
                )}
              </Paper>

              {loading ? (
                <Box display="flex" justifyContent="center" mt={2}>
                  <CircularProgress />
                </Box>
              ) : (
                modelInfo && (
                  <Paper elevation={2} sx={{ padding: 2, marginTop: 1 }}>
                    <Typography variant="h8" gutterBottom>
                      <strong>Loaded Model</strong>
                    </Typography>

                    <Typography variant="body2">
                      <Link
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/ai-models/" + modelInfo.id);
                        }}
                        color="inherit"
                      >
                        ID: {modelInfo.id}
                      </Link>
                    </Typography>
                    <Typography variant="body2">
                      Name: {modelInfo.name}
                    </Typography>
                    <Typography variant="body2">
                      Last Modified:{" "}
                      {new Date(modelInfo.lastModified).toLocaleString()}
                    </Typography>
                    <Typography variant="h8" gutterBottom mt={2}>
                      <strong>Published Training</strong>
                    </Typography>
                    <Typography variant="body2">
                      ID: {modelInfo.trainingId}
                    </Typography>
                    <Typography variant="body2">
                      Description: {modelInfo.trainingDescription}
                    </Typography>
                    <Typography variant="body2">
                      Zoom Level: {modelInfo.trainingZoomLevel}
                    </Typography>
                    <Typography variant="body2">
                      Accuracy: {modelInfo.trainingAccuracy.toFixed(2)} %
                    </Typography>
                    <Typography variant="body2">
                      Model Size: {modelInfo.modelSize} MB
                    </Typography>
                  </Paper>
                )
              )}
            </Box>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {predictions && (
            <Paper elevation={2} sx={{ padding: 2, marginTop: 1 }}>
              <Typography variant="h8" gutterBottom>
                <strong>Options</strong>
                <hr></hr>
              </Typography>

              <LoadingButton
                variant="contained"
                color="secondary"
                onClick={conflateFeatures}
                loading={conflateLoading}
                size="small"
                sx={{ mt: 1 }}
              >
                Remove OSM Features
              </LoadingButton>

              <LoadingButton
                variant="contained"
                color="secondary"
                onClick={openWithJosm}
                loading={josmLoading}
                size="small"
                sx={{ mt: 1, mr: 1 }}
              >
                Open with JOSM
              </LoadingButton>

              <LoadingButton
                variant="contained"
                onClick={downloadPredictions}
                color="secondary"
                size="small"
                sx={{ mt: 1 }}
              >
                Download as Geojson
              </LoadingButton>
            </Paper>
          )}
        </Grid>
        <Snackbar
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          message={`Thanks! Your ${feedbackSubmittedCount} feedback has been submitted.`}
        />
      </Grid>
    </>
  );
};

export default Prediction;
