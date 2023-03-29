import LoadingButton from "@mui/lab/LoadingButton";
import { Alert, Button, Grid } from "@mui/material";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  FeatureGroup,
  LayersControl,
  MapContainer,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { useMutation, useQuery } from "react-query";
import { useParams } from "react-router-dom";
import axios from "../../../../axios";
import AuthContext from "../../../../Context/AuthContext";
import { GeoJSON } from "react-leaflet";

const Prediction = () => {
  const { id } = useParams();
  const [error, setError] = useState(false);
  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(0);
  const [bounds, setBounds] = useState({});
  const [windowSize, setWindowSize] = useState([
    window.innerWidth,
    window.innerHeight,
  ]);

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
    };
    const res = await axios.post(`/prediction/`, body, { headers });
    if (res.error) {
      setError(
        `${res.error.response.statusText}, ${JSON.stringify(
          res.error.response.data
        )}`
      );
      return;
    }
    return res.data;
  });

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

  return (
    <>
      <Grid container padding={2} spacing={2}>
        <Grid item xs={9} md={10}>
          <MapContainer
            className="pointer"
            center={[-0.29815, 36.07572]}
            style={{
              height: windowSize[1] - 150,
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
                  style={() => ({
                    color: "pink",
                    weight: 4,
                  })}
                />
              )}
            </FeatureGroup>
          </MapContainer>
        </Grid>
        <Grid item xs={3} md={2}>
          <LoadingButton
            variant="contained"
            color="primary"
            disabled={zoom < 19 || !zoom || zoom > 21}
            loading={predictionLoading}
            onClick={() => {
              setError(false);
              callPredict();
            }}
          >
            Detect
          </LoadingButton>
          {map && (
            <>
              <span>Zoom {JSON.stringify(zoom)}</span>
              <br />
              <span>Zoom to level 19, 20, 21 to detect features</span>
              <br />
              <span>Model Id {id}</span>
            </>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Grid>
      </Grid>
    </>
  );
};

export default Prediction;
