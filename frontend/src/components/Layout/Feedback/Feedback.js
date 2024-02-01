import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AuthContext from "../../../Context/AuthContext";
import axios from "../../../axios";
import { useMutation, useQuery } from "react-query";
import {
  Alert,
  AlertTitle,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { EditControl } from "react-leaflet-draw";
import { GeoJSON, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import centroid from "@turf/centroid";
import polygonize from "@turf/polygonize";
import {
  FeatureGroup,
  LayersControl,
  MapContainer,
  Polygon,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import FeedbackAOI from "./FeedbackAOI";
import { approximateGeom, converToGeoPolygon } from "../../../utils";
import { icon } from "leaflet";
import FeedackTraining from "./FeedbackTraining";
const ICON = icon({
  iconUrl: "/hot-marker.png",
  iconSize: new L.Point(100, 100),
  // className: "leaflet-div-icon",
});
const Feedback = (props) => {
  let { id, trainingId } = useParams();

  const { accessToken } = useContext(AuthContext);

  const [sourceImagery, setSourceImagery] = useState("");
  const [AOIs, setAOIs] = useState(null);
  const getSourceImagery = async () => {
    try {
      const response = await axios.get(`/training/${trainingId}/`);
      setSourceImagery(response.data.source_imagery);

      if (response.data.source_imagery.includes("openaerial")) {
        getImagery(response.data.source_imagery);
      } else {
        setImagery({
          maxzoom: 23,
          minzoom: 0,
          name: response.data.source_imagery,
          url: response.data.source_imagery,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };
  const [feedbackData, setFeedbackData] = useState(null);
  const {
    mutate,
    data: trainingData,
    isLoading: isLoadingTraining,
  } = useMutation(getSourceImagery);
  const getFeedback = async () => {
    try {
      const headers = {
        "access-token": accessToken,
      };
      const res = await axios.get(`/feedback/?training=${trainingId}`, null, {
        headers,
      });

      if (res.error) {
      } else {
        // console.log(`/feedback/?training=${trainingId}`, res.data);
        mutate();
        setFeedbackData(res.data);
      }
    } catch (e) {
      console.log("isError", e);
    } finally {
    }
  };
  const [originalAOIs, setOriginalAOIs] = useState(null);
  const [datasetId, setDatasetId] = useState(null);
  const getOriginalAOIs = async () => {
    try {
      const headers = {
        "access-token": accessToken,
      };
      const res = await axios.get(`/model/${id}`, null, {
        headers,
      });

      if (res.error) {
      } else {
        const datasetId = res.data.dataset;
        setDatasetId(datasetId);
        const resAOIs = await axios.get(
          `/workspace/download/dataset_${datasetId}/output/training_${trainingId}/aois.geojson`,
          null,
          {
            headers,
          }
        );
        // console.log("resAOIs", resAOIs);
        setOriginalAOIs(resAOIs.data);
      }
    } catch (e) {
      console.log("isError", e);
    } finally {
    }
  };
  //   const { data: feedbackData, isLoading } = useQuery(
  //     "getFeedback" + trainingId,
  //     getFeedback,
  //     {
  //       refetchInterval: 120000,
  //     }
  //   );
  useEffect(() => {
    getFeedback();
    getOriginalAOIs();
    return () => {};
  }, []);
  const [currentPosision, setCurrentPosision] = useState(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (
      map &&
      currentPosision &&
      currentPosision.length > 0 &&
      currentPosision[0]
    ) {
      console.log("props.currentPosision", currentPosision);
      map.setView(currentPosision, 17);
      // setZoom(props.zoom);
      // props.clearCurrentPosision();
    }

    return () => {};
  }, [currentPosision, map]);

  const [zoom, setZoom] = useState(15);
  const [bounds, setBounds] = useState({});

  const [windowSize, setWindowSize] = useState([
    window.innerWidth,
    window.innerHeight,
  ]);
  const [imagery, setImagery] = useState(null);

  const { mutate: getImagery, data: oamImagery } = useMutation(async (url) => {
    const res = await axios.get(url.replace("/{z}/{x}/{y}", ""));
    if (res.error) {
      //   setError(res.error.response.statusText);
      return;
    }
    if (map)
      map.setView([res.data.center[1], res.data.center[0]], res.data.center[2]);
    setCurrentPosision([
      res.data.center[1],
      res.data.center[0],
      res.data.center[2],
    ]);
    console.log("OAM data", res.data, "map", map);
    setImagery({
      maxzoom: res.data.maxzoom,
      minzoom: res.data.minzoom,
      name: res.data.name,
      url: url,
    });
    return res.data;
  });

  function getFeatureStyle(feature) {
    return {
      color: "blue",
      weight: 3,
    };
  }
  const [error, setError] = useState("");
  const createDB = async ({ geom, leafletId }) => {
    try {
      const body = {
        geom: geom,
        training: trainingId,
        source_imagery: sourceImagery,
      };

      const headers = {
        "access-token": accessToken,
      };
      const res = await axios.post(`/feedback-aoi/`, body, { headers });
      console.log("res ", res);

      if (res.error) {
        setError(JSON.stringify(res.error));
      } else {
        // add aoi ID to the state after insert
        setRefresh(Math.random());
        return res.data;
      }
    } catch (e) {
      console.log("isError", e);
      setError(e);
    } finally {
    }
  };
  const { mutate: mutateCreateDB, data: createResult } = useMutation(createDB);
  const _onCreate = (e) => {
    console.log("_onCreate", e);
    const { layerType, layer } = e;

    const { _leaflet_id } = layer;

    // call the API and add the AOI to DB
    const newAOI = {
      id: _leaflet_id,
      latlngs: layer.getLatLngs()[0],
      area: L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]),
    };
    const points = JSON.stringify(
      converToGeoPolygon([newAOI])[0][0].reduce(
        (p, c, i) => p + c[1] + " " + c[0] + ",",
        ""
      )
    ).slice(1, -2);
    // console.log("points",points)
    const approximated = approximateGeom(points);
    const polygon = "SRID=4326;POLYGON((" + approximated + "))";

    console.log("converToPolygon([layer])", polygon);
    mutateCreateDB({
      geom: polygon,
      leafletId: _leaflet_id,
      polyTemp: converToGeoPolygon([newAOI])[0][0],
    });
  };
  const [refresh, setRefresh] = useState(Math.random());
  const getLabels = async (box) => {
    try {
      console.log(" getLabels for box", box);

      const headers = {
        "access-token": accessToken,
      };
      const res = await axios.get(
        `/feedback-label/?in_bbox=${box._southWest.lng},${box._southWest.lat},${box._northEast.lng},${box._northEast.lat}&feedback_aoi__training=${trainingId}`,
        { headers }
      );
      console.log("res from getLabels ", res);
      if (res.error) setError(res.error);
      else {
        // show on the map
        let leafletGeoJSON = new L.GeoJSON(res.data);
        const newLayers = [];
        leafletGeoJSON.eachLayer((layer) => {
          const { _leaflet_id, feature } = layer;
          //  console.log("on get labels layer",layer,layer.getLatLngs(),L.GeometryUtil.geodesicArea(layer.getLatLngs()))
          newLayers.push({
            id: _leaflet_id,
            aoiId: -1,
            feature: feature,
            type: "label",
            latlngs: layer.getLatLngs()[0],
          });
        });

        return res.data;
      }
    } catch (e) {
      console.log("isError", e);
      setError(e);
    } finally {
    }
  };
  const { mutate: mutategetLabels, data: labelsData } = useMutation(getLabels);

  function MyComponent() {
    const map = useMapEvents({
      zoomend: (e) => {
        const { _animateToZoom } = e.target;
        // console.log("zoomend", e, _animateToZoom);
        setZoom(_animateToZoom);
      },
      moveend: (e) => {
        const { _animateToZoom, _layers } = e.target;
        // console.log("moveend", e, e.target.getBounds());
        // console.log("zoom is", _animateToZoom);
        // console.log("see the map ", map);

        if (_animateToZoom >= 18) {
          mutategetLabels(e.target.getBounds());
        } else {
          // remote labels layer
        }
      },
    });
    return null;
  }
  const navigate = useNavigate();
  const onEachFeatureOriginalAOIs = (feature, layer) => {
    layer.bindPopup("Original dataset AOI");
  };

  const selectAOIHandler = (e, zoom) => {
    setCurrentPosision([e[0], e[1], zoom]);
  };
  return (
    <>
      {!feedbackData && (
        <Stack sx={{ width: "100%", color: "grey.500" }} spacing={2}>
          <LinearProgress color="hot" />
          <LinearProgress color="hot" />
          <LinearProgress color="hot" />
          <LinearProgress color="hot" />
          <LinearProgress color="hot" />
          <LinearProgress color="hot" />
          <LinearProgress color="hot" />
          <LinearProgress color="hot" />
          <LinearProgress color="hot" />
        </Stack>
      )}

      {feedbackData && (
        <Grid container spacing={2} padding={2}>
          <Grid item xs={9}>
            {sourceImagery && (
              <MapContainer
                className="pointer"
                center={
                  oamImagery
                    ? [oamImagery.center[1], oamImagery.center[0]]
                    : [0, 0]
                }
                style={{
                  height: windowSize[1] - 100,
                  width: "100%",
                  display: "flex",
                }}
                zoom={15}
                zoomDelta={0.25}
                wheelPxPerZoomLevel={Math.round(36 / 0.5)}
                zoomSnap={0}
                scrollWheelZoom={true}
                inertia={true}
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
                  {imagery && (
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
                {/* {oamImagery && (
                  <TileLayer
                    maxZoom={oamImagery.maxzoom}
                    minZoom={oamImagery.minzoom}
                    attribution={oamImagery.name}
                    url={sourceImagery}
                  />
                )} */}

                <FeatureGroup>
                  <GeoJSON
                    key={JSON.stringify(feedbackData)}
                    data={feedbackData}
                    pmIgnore={false}
                    style={getFeatureStyle}
                    // onEachFeature={onEachFeature}
                  />

                  {feedbackData &&
                    feedbackData.features.map((f, indx) => {
                      return (
                        <Marker
                          key={indx}
                          position={[
                            centroid(f).geometry.coordinates[1],
                            centroid(f).geometry.coordinates[0],
                          ]}
                          icon={ICON}
                        >
                          <Popup>
                            <span>Feedback</span>
                          </Popup>
                        </Marker>
                      );
                    })}

                  <GeoJSON
                    key={Math.random()}
                    data={AOIs}
                    pmIgnore={false}
                    style={{
                      color: "blue",
                      weight: 4,
                    }}
                  />
                  <GeoJSON
                    key={Math.random()}
                    data={originalAOIs}
                    pmIgnore={false}
                    style={{
                      color: "rgb(51, 136, 255)",
                      weight: 4,
                    }}
                    onEachFeature={onEachFeatureOriginalAOIs}
                  />
                  {zoom >= 18 && (
                    <GeoJSON
                      key={JSON.stringify(labelsData)}
                      data={labelsData}
                      pmIgnore={false}
                      style={{
                        color: "red",
                        weight: 4,
                      }}
                      // onEachFeature={onEachFeature}
                    />
                  )}
                </FeatureGroup>
                <FeatureGroup
                  ref={(reactFGref) => {
                    // _onFeatureGroupReady(reactFGref, geoJsonLoadedFile);
                    // if (zoom >= 19) {
                    //   _onFeatureGroupReadyLabels(reactFGref, geoJsonLoadedLabels);
                    // } else {
                    //   setgeoJsonLoadedLabels(null);
                    // }
                  }}
                >
                  <EditControl
                    position="topleft"
                    onCreated={_onCreate}
                    // onEdited={_onEdited}
                    // onDeleted={_onDeleted}
                    // onEditStart={_onEditStart}
                    // onEditStop={_onEditStop}
                    // onDrawStart={_onEditStart}
                    // onDrawStop={_onEditStop}
                    draw={{
                      polyline: false,
                      polygon: false,
                      rectangle: true,
                      circle: false,
                      circlemarker: false,
                      marker: false,
                    }}
                  />
                </FeatureGroup>
              </MapContainer>
            )}
          </Grid>
          <Grid paddingTop={2} paddingLeft={2} item xs={3}>
            <Grid item xs={12} marginBottom={1}>
              <Typography variant="body1" component="h2">
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/ai-models/" + id);
                  }}
                >
                  Model id: {id}
                </Link>
                , Training id: {trainingId}
              </Typography>
              <Typography variant="body1" component="h2">
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/training-datasets/" + datasetId);
                  }}
                >
                  Original dataset id: {datasetId}
                </Link>
              </Typography>
              <Typography variant="body1" component="h2">
                Total feedbacks: {feedbackData && feedbackData.features.length}
              </Typography>{" "}
              <Typography variant="body1" component="h2">
                Zoom: {zoom && zoom.toFixed(1)}
              </Typography>
            </Grid>
            <Grid item xs={12} marginBottom={1}>
              <Alert severity="info">
                <AlertTitle>
                  Mappers feedback is shown in markers on the map
                </AlertTitle>
              </Alert>
            </Grid>
            <Grid item xs={12}>
              {sourceImagery && (
                <FeedbackAOI
                  sourceImagery={sourceImagery}
                  trainingId={trainingId}
                  refresh={refresh}
                  setAOIs={setAOIs}
                  selectAOIHandler={selectAOIHandler}
                ></FeedbackAOI>
              )}
            </Grid>
            <FeedackTraining
              trainingId={trainingId}
              modelId={id}
            ></FeedackTraining>
          </Grid>
        </Grid>
      )}
    </>
  );
};

export default Feedback;
