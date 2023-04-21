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
import CustomGridLayer from "./GridLayer";

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
import Snackbar from "@mui/material/Snackbar";

const Prediction = () => {
  const { id } = useParams();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [feedbackSubmittedCount, setFeedbackSubmittedCount] = useState(0);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  const [error, setError] = useState(false);
  const [josmLoading, setJosmLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [predictionZoomlevel, setpredictionZoomlevel] = useState(null);

  const [apiCallInProgress, setApiCallInProgress] = useState(false);
  const [confidence, setConfidence] = useState(50);
  const [totalFeedbackCount, settotalFeedbackCount] = useState(0);
  const [totalPredictionsCount, settotalPredictionsCount] = useState(0);
  const [totalReviewNeedCount, settotalReviewNeedCount] = useState(0);
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
    setpredictionZoomlevel(zoom);
    const updatedPredictions = addIdsToPredictions(res.data);
    return updatedPredictions;
  });

  const handleSubmitFeedback = async () => {
    setFeedbackLoading(true);
    const incorrectFeatures = predictions.features.filter(
      (feature) => feature.properties.feedbackType === "INCORRECT"
    );
    try {
      for (let i = 0; i < incorrectFeatures.length; i++) {
        const { geometry } = incorrectFeatures[i];
        const body = {
          geom: geometry,
          feedback_type: "INCORRECT",
          training: modelInfo.trainingId,
          zoom_level: predictionZoomlevel,
        };
        console.log(body);
        const headers = {
          "access-token": accessToken,
          Authorization: `Bearer ${accessToken}`,
        };
        await axios.post("/feedback/", body, { headers });
      }
      const correctFeatures = predictions.features.filter(
        (feature) => feature.properties.feedbackType !== "INCORRECT"
      );
      predictions.features = correctFeatures;
      settotalPredictionsCount(predictions.features.length);
      setFeedbackLoading(false);
      settotalFeedbackCount(0);
      setFeedbackSubmittedCount(incorrectFeatures.length);
      setSnackbarOpen(true);
    } catch (error) {
      console.error(error);
      setFeedbackLoading(false);
      window.alert("An error occurred while submitting feedback.");
    }
  };

  async function openWithJosm() {
    setJosmLoading(true);
    if (!predictions) {
      setError("No predictions available");
      return;
    }

    // Remove the "id" and "featuretype" properties from each feature in the "features" array
    const modifiedPredictions = {
      ...predictions,
      features: predictions.features
        .filter((feature) => feature.properties.featuretype !== "INCORRECT")
        .map((feature) => {
          const { id, featuretype, ...newProps } = feature.properties;
          return {
            ...feature,
            properties: newProps,
          };
        }),
    };

    try {
      const response = await axios.post("/geojson2osm/", {
        geojson: modifiedPredictions,
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
      setError("Couldn't Open JOSM , Check if JOSM is Open");
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
  function latLngToTile(lat, lng, zoom) {
    const tileX = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
    const tileY = Math.floor(
      ((1 -
        Math.log(
          Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
        ) /
          Math.PI) /
        2) *
        Math.pow(2, zoom)
    );

    return { tileX, tileY };
  }

  function changeFeatureColor(featureId, color, feedbackType) {
    const feature = predictions.features.find(
      (feature) => feature.properties.id === featureId
    );

    if (feature) {
      feature.properties.color = color;
      if (
        (feature.properties.feedbackType === "INITIAL" ||
          feature.properties.feedbackType === "NEED REVIEW") &&
        feedbackType !== "NEED REVIEW"
      ) {
        settotalFeedbackCount((prevCount) => prevCount + 1);
      }
      if (
        feature.properties.feedbackType === "NEED REVIEW" &&
        feedbackType !== "NEED REVIEW"
      ) {
        settotalReviewNeedCount((prevCount) => prevCount - 1);
      }
      feature.properties.feedbackType = feedbackType;
    }
  }

  function addIdsToPredictions(predictions) {
    const features = predictions.features.map((feature, index) => {
      return {
        ...feature,
        properties: {
          ...feature.properties,
          id: index,
          feedbackType: "INITIAL",
        },
      };
    });

    settotalPredictionsCount(features.length);

    return { ...predictions, features };
  }

  function getPolygonCentroid(coordinates) {
    let xSum = 0;
    let ySum = 0;
    let count = 0;

    coordinates[0].forEach(([lng, lat]) => {
      xSum += lng;
      ySum += lat;
      count++;
    });

    return {
      lat: ySum / count,
      lng: xSum / count,
    };
  }

  function highlightNeighbors(tileX, tileY, zoom) {
    if (!predictions) return;

    predictions.features.forEach((feature) => {
      const centroid = getPolygonCentroid(feature.geometry.coordinates);
      const currentTile = latLngToTile(centroid.lat, centroid.lng, zoom);
      if (
        currentTile.tileX === tileX &&
        currentTile.tileY === tileY &&
        feature.properties.feedbackType == "INITIAL"
      ) {
        console.log("Neighbour on same tile", feature.properties.id);
        settotalReviewNeedCount((prevCount) => prevCount + 1);
        changeFeatureColor(feature.properties.id, "yellow", "NEED REVIEW");
      }
    });
  }

  function onEachFeature(feature, layer) {
    layer.on("click", (e) => {
      const zoom = predictionZoomlevel;
      const { tileX, tileY } = latLngToTile(e.latlng.lat, e.latlng.lng, zoom);

      // Create the popup content
      const popupContent =
        `
      <div>
        <p> <strong>Feedback:</strong> ` +
        feature.properties.feedbackType +
        `</p>
        <button id="rightButton" class="feedback-button">&#128077; Right</button>
        <button id="wrongButton" class="feedback-button">&#128078; Wrong</button>
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
          changeFeatureColor(feature.properties.id, "green", "CORRECT");
          e.target.closePopup();
        });
      popupElement
        .querySelector("#wrongButton")
        .addEventListener("click", () => {
          // Highlight neighboring features
          highlightNeighbors(tileX, tileY, zoom);
          changeFeatureColor(feature.properties.id, "red", "INCORRECT");
          e.target.closePopup();
        });
    });
  }

  function getFeatureStyle(feature) {
    let color = "green";

    if (feature.properties.feedbackType === "NEED REVIEW") {
      color = "yellow";
    } else if (feature.properties.feedbackType === "INCORRECT") {
      color = "red";
    } else if (feature.properties.feedbackType === "CORRECT") {
      color = "green";
    }

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
            <CustomGridLayer key={Date.now()} />

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

          {map && (
            <Box>
              <Paper elevation={1} sx={{ padding: 2, marginTop: 0 }}>
                <Box display="flex" alignItems="center">
                  <Tooltip title="Select confidence threshold probability for filtering out low-confidence predictions">
                    <Typography variant="body2" style={{ marginRight: "10px" }}>
                      <strong>Confidence: </strong>
                    </Typography>
                  </Tooltip>
                  <FormControl size="small">
                    <Select
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
              {predictions && (
                <Paper elevation={1} sx={{ padding: 2, marginTop: 0.5 }}>
                  <Typography variant="h8" gutterBottom>
                    <strong>Feedback</strong>
                  </Typography>
                  <Typography variant="body2">
                    Total Predictions:
                    {totalPredictionsCount}
                  </Typography>
                  <Typography variant="body2">
                    Total Feedbacks:
                    {totalFeedbackCount}
                  </Typography>
                  {totalReviewNeedCount > 0 && (
                    <Typography variant="body2">
                      Review Needed:
                      {totalReviewNeedCount}
                    </Typography>
                  )}
                  {totalFeedbackCount > 1 && totalReviewNeedCount === 0 && (
                    <LoadingButton
                      variant="contained"
                      color="primary"
                      onClick={handleSubmitFeedback}
                      size="small"
                      loading={feedbackLoading}
                      sx={{ mt: 1 }}
                    >
                      Submit my feedback
                    </LoadingButton>
                  )}
                </Paper>
              )}
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
                    <Typography variant="body2">ID: {modelInfo.id}</Typography>
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
                      Accuracy: {modelInfo.trainingAccuracy} %
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
            <LoadingButton
              variant="contained"
              color="secondary"
              onClick={openWithJosm}
              loading={josmLoading}
              size="small"
              sx={{ mt: 1 }}
            >
              Open Results with JOSM
            </LoadingButton>
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
          message={`Thanks! Your ${feedbackSubmittedCount} feedback has been submitted and removed from predictions.`}
        />
      </Grid>
    </>
  );
};

export default Prediction;
