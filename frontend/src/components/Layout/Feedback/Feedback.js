import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AuthContext from "../../../Context/AuthContext";
import axios from "../../../axios";
import { useMutation, useQuery } from "react-query";
import { Alert, AlertTitle, Grid, Typography } from "@mui/material";
import { EditControl } from "react-leaflet-draw";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
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
const Feedback = (props) => {
  let { id, trainingId } = useParams();

  const { accessToken } = useContext(AuthContext);

  const [sourceImagery, setSourceImagery] = useState("");
  const getSourceImagery = async () => {
    try {
      const response = await axios.get(`/training/${trainingId}/`);
      setSourceImagery(response.data.source_imagery);
      getImagery(response.data.source_imagery);
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
  //   const { data: feedbackData, isLoading } = useQuery(
  //     "getFeedback" + trainingId,
  //     getFeedback,
  //     {
  //       refetchInterval: 120000,
  //     }
  //   );
  useEffect(() => {
    getFeedback();

    return () => {};
  }, []);

  const [zoom, setZoom] = useState(15);
  const [bounds, setBounds] = useState({});

  const [map, setMap] = useState(null);

  const [windowSize, setWindowSize] = useState([
    window.innerWidth,
    window.innerHeight,
  ]);
  const { mutate: getImagery, data: oamImagery } = useMutation(async (url) => {
    const res = await axios.get(url.replace("/{z}/{x}/{y}", ""));
    if (res.error) {
      //   setError(res.error.response.statusText);
      return;
    }
    if (map)
      map.setView([res.data.center[1], res.data.center[0]], res.data.center[2]);
    console.log("OAM data", res.data, "map", map);
    return res.data;
  });

  //   useEffect(() => {
  //     console.log("map && oamImagery", map, oamImagery);

  //     if (map && oamImagery) {
  //       //   map.setView(
  //       //     ([oamImagery.center[1], oamImagery.center[0]], oamImagery.center[2])
  //       //   );
  //       //   setZoom(oamImagery.center[2]);
  //     }
  //     return () => {};
  //   }, [map, oamImagery]);

  function getFeatureStyle(feature) {
    return {
      color: "red",
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
  const _onCreate = (e, str) => {
    console.log("_onCreate", e);
    const { layerType, layer } = e;

    const { _leaflet_id } = layer;

    // call the API and add the AOI to DB
    const newAOI = {
      id: _leaflet_id,
      type: str,
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
    const approximated = str === "aoi" ? approximateGeom(points) : points;
    const polygon = "SRID=4326;POLYGON((" + approximated + "))";

    console.log("converToPolygon([layer])", polygon);
    mutateCreateDB({
      geom: polygon,
      leafletId: _leaflet_id,
      polyTemp: converToGeoPolygon([newAOI])[0][0],
    });
  };
  const [refresh, setRefresh] = useState(Math.random());
  return (
    <>
      {!feedbackData && "Loading ..."}

      {feedbackData && (
        <Grid container spacing={2} padding={2}>
          <Grid item xs={9}>
            {oamImagery && (
              <MapContainer
                className="pointer"
                center={[oamImagery.center[1], oamImagery.center[0]]}
                style={{
                  height: windowSize[1] - 100,
                  width: "100%",
                  display: "flex",
                }}
                zoom={15}
                whenCreated={setMap}
              >
                {/* <MyComponent /> */}
                {oamImagery && (
                  <TileLayer
                    maxZoom={oamImagery.maxzoom}
                    minZoom={oamImagery.minzoom}
                    attribution={oamImagery.name}
                    url={sourceImagery}
                  />
                )}

                <FeatureGroup>
                  {/* <Polygon
            pathOptions={blueOptions}
            positions={converToPolygon(
              mapLayers.filter((e) => e.type === "aoi")
            )}
          /> */}
                  <GeoJSON
                    key={JSON.stringify(feedbackData)}
                    data={feedbackData}
                    pmIgnore={false}
                    style={getFeatureStyle}
                    // onEachFeature={onEachFeature}
                  />
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
              <Alert severity="info">
                <AlertTitle>
                  Mappers feedback is show in red in the map
                </AlertTitle>
              </Alert>
            </Grid>
            <Grid item xs={12}>
              {oamImagery && (
                <FeedbackAOI
                  oamImagery={oamImagery}
                  trainingId={trainingId}
                  refresh={refresh}
                ></FeedbackAOI>
              )}
            </Grid>
          </Grid>
        </Grid>
      )}
    </>
  );
};

export default Feedback;
