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
const Prediction = (props) => {
  let { id } = useParams();
  const [error, setError] = useState(false);
  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(0);
  const [bounds, setBounds] = useState({});
  const [windowSize, setWindowSize] = useState([
    window ? window.innerWidth : 0,
    window ? window.innerHeight : 0,
  ]);
  useEffect(() => {
    getModel();

    return () => {};
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

  const getModel = async () => {
    try {
      const res = await axios.get(`/model/${id}`);

      if (res.error) setError(res.error.response.statusText);
      else {
        console.log("getmodel", res.data);
        mutate(res.data.dataset);
        return res.data;
      }
    } catch (e) {
      setError(e);
    } finally {
    }
  };
  const { data, isLoading } = useMutation(getModel);
  const getDataset = async (datasetId) => {
    try {
      const res = await axios.get(`/dataset/${datasetId}`);

      if (res.error) setError(res.error.response.statusText);
      else {
        console.log("getdataset", res.data);
        getImagery(res.data.source_imagery);
        return res.data;
      }
    } catch (e) {
      setError(e);
    } finally {
    }
  };
  const { mutate, data: dataset } = useMutation(getDataset);

  const getImageryDetails = async (url) => {
    try {
      const res = await axios.get(url.replace("/{z}/{x}/{y}", ""));

      if (res.error) {
        setError(res.error.response.statusText);
        return;
      }
      console.log("oamImagery", res.data, "Map", map);
      if (map)
        map.setView(
          [res.data.center[1], res.data.center[0]],
          res.data.center[2]
        );
      return res.data;
    } catch (e) {
      console.log("isError");
      setError(e);
    } finally {
    }
  };
  const { accessToken } = useContext(AuthContext);

  const { mutate: getImagery, data: oamImagery } =
    useMutation(getImageryDetails);

  const predict = async () => {
    try {
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
      console.log(body);
      const res = await axios.post(`/prediction/`, body, { headers });

      console.log("prediction res", res);
      if (res.error) {
        setError(res.error.response.statusText + ", ", res.error.response.data);
        return;
      }

      console.log("prediction", res.data);
      return res.data;
    } catch (e) {
      console.log("isError");
      setError(e);
    } finally {
    }
  };
  const {
    mutate: callPredict,
    data: predictions,
    isLoading: predictionLoading,
  } = useMutation(predict);

  function MyComponent() {
    const map = useMapEvents({
      zoomend: (e) => {
        const { _animateToZoom } = e.target;
        console.log("zoomend", e, _animateToZoom);
        setZoom(_animateToZoom);
      },
      moveend: (e) => {
        console.log("moveend", e, e.target.getBounds());
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
              <LayersControl.BaseLayer name="Maxar Preimum">
                <TileLayer
                  maxNativeZoom={21}
                  maxZoom={24}
                  attribution='<a href="https://wiki.openstreetmap.org/wiki/DigitalGlobe" target="_blank"><img class="source-image" src="https://osmlab.github.io/editor-layer-index/sources/world/Maxar.png"><span class="attribution-text">Terms &amp; Feedback</span></a>'
                  url={
                    "https://services.digitalglobe.com/earthservice/tmsaccess/tms/1.0.0/DigitalGlobe:ImageryTileService@EPSG:3857@jpg/{z}/{x}/{-y}.jpg?connectId=" +
                    process.env.REACT_APP_MAXAR_CONNECT_ID
                  }
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="OSM" checked={true}>
                <TileLayer
                  maxZoom={24}
                  maxNativeZoom={19}
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Google">
                <TileLayer
                  maxNativeZoom={22}
                  maxZoom={26}
                  attribution='&copy; <a href="https://www.google.com">Google</a>'
                  url="http://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                />
              </LayersControl.BaseLayer>
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
                />
              )}
            </FeatureGroup>
          </MapContainer>
        </Grid>
        <Grid item xs={3} md={2}>
          <LoadingButton
            variant="contained"
            color="primary"
            disabled={zoom < 19 || !zoom}
            loading={predictionLoading}
            onClick={() => {
              setError(false);
              console.log(map.getBounds()._northEast.lat);
              console.log(map.getZoom());
              callPredict();
            }}
          >
            Detect
          </LoadingButton>
          {map && (
            <div>
              <span>Zoom {JSON.stringify(zoom)}</span>
              <br />
              <span>Zoom to level +=19 to detect features</span>
              <br />
              <span>Model Id {id}</span>
            </div>
          )}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default Prediction;
