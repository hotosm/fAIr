import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Pagination,
  Snackbar,
  Tooltip,
  Typography,
  Button,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import FolderIcon from "@mui/icons-material/Folder";
import { MapTwoTone, ZoomInMap } from "@mui/icons-material";
import usePagination from "./Pagination";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import ScreenshotMonitorIcon from "@mui/icons-material/ScreenshotMonitor";
import PlaylistRemoveIcon from "@mui/icons-material/PlaylistRemove";
import { useMutation } from "react-query";
import axios from "../../../../axios";
import AOIDetails from "./AOIDetails";
import AuthContext from "../../../../Context/AuthContext";
import * as Terraformer from "@terraformer/wkt";

const Demo = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
}));

const ListItemWithWiderSecondaryAction = withStyles({
  secondaryAction: {
    paddingRight: 96,
  },
})(ListItem);

const PER_PAGE = 5;
const DEFAULT_FILTER = {
  items: [],
  linkOperator: "and",
  quickFilterValues: [],
  quickFilterLogicOperator: "and",
};

const postAoi = async (polygon, dataset, accessToken) => {
  console.log("Posting AOI");
  console.log(dataset);
  const headers = {
    "Content-Type": "application/json",
    "access-token": accessToken,
  };
  const data = {
    geom: `SRID=4326;${polygon}`,
    dataset,
  };
  const response = await axios.post("/aoi/", data, { headers });
  console.log(response.data);
  return response.data;
};

const AOI = (props) => {
  const [dense, setDense] = useState(true);
  const count = Math.ceil(props.mapLayers.length / PER_PAGE);
  let [page, setPage] = useState(1);
  const [openSnack, setOpenSnack] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [geoJsonFile, setGeoJsonFile] = useState(null);
  let _DATA = usePagination(
    props.mapLayers.filter((e) => e.type === "aoi"),
    PER_PAGE
  );
  const handleChange = (e, p) => {
    setPage(p);
    _DATA.jump(p);
  };

  useEffect(() => {
    return () => {};
  }, [props]);

  const { accessToken } = useContext(AuthContext);
  const fetchOSMLebels = async (aoiId) => {
    try {
      const headers = {
        "access-token": accessToken,
      };

      const res = await axios.post(`/label/osm/fetch/${aoiId}/`, null, {
        headers,
      });

      if (res.error) {
        console.log(res.error.response.statusText);
      } else {
        return res.data;
      }
    } catch (e) {
      console.log("isError", e);
    }
  };
  const { mutate: mutateFetch, data: fetchResult } =
    useMutation(fetchOSMLebels);

  const DeleteAOI = async (id, leafletId) => {
    try {
      const headers = {
        "access-token": accessToken,
      };

      const res = await axios.delete(`/aoi/${id}`, {
        headers,
      });

      if (res.error) {
        console.log(res);
        console.log(res.error.response.statusText);
      } else {
        console.log(`AOI ${id} deleted from DB`);

        props.deleteAOIButton(id, leafletId);
        return res.data;
      }
    } catch (e) {
      console.log("isError", e);
    }
  };
  const { mutate: mutateDeleteAOI } = useMutation(DeleteAOI);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith(".geojson")) {
        setFileError("Invalid file format. Please upload a .geojson file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const geoJson = JSON.parse(e.target.result);
          let geometry;

          if (geoJson.type === "FeatureCollection") {
            // if (geoJson.features.length > 1) {
            //   setFileError(
            //     "Feature collection contains multiple features. Only uploaded first one"
            //   );
            // }
            // TODO : for featurecollection loop through the features and add AOI one by one
            const feature = geoJson.features[0];
            if (
              feature.geometry.type !== "Polygon" &&
              feature.geometry.type !== "MultiPolygon"
            ) {
              setFileError("GeoJSON must contain a Polygon or MultiPolygon.");
              return;
            }
            geometry = feature.geometry;
          } else if (geoJson.type === "Feature") {
            if (
              geoJson.geometry.type !== "Polygon" &&
              geoJson.geometry.type !== "MultiPolygon"
            ) {
              setFileError(
                "Feature geometry type must be Polygon or MultiPolygon."
              );
              return;
            }
            geometry = geoJson.geometry;
          } else if (
            geoJson.type === "Polygon" ||
            geoJson.type === "MultiPolygon"
          ) {
            geometry = geoJson;
          } else {
            setFileError("Invalid GeoJSON format.");
            return;
          }

          const wkt = Terraformer.geojsonToWKT(geometry);
          await postAoi(wkt, props.datasetId, accessToken);
          setFileError(null);
          setGeoJsonFile(null);
        } catch (error) {
          console.error(error);
          setFileError("Error processing GeoJSON file.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <Grid item md={12} className="card" marginBottom={1}>
        <Tooltip title="For each TA, we need to make sure that the map data inside it is aligned and complete">
          <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
            Training Areas{` (${props.mapLayers.length})`}
          </Typography>
        </Tooltip>
        <input
          accept=".geojson"
          style={{ display: "none" }}
          id="geojson-upload"
          type="file"
          onChange={handleFileUpload}
        />
        <label htmlFor="geojson-upload">
          <Button
            variant="contained"
            color="primary"
            component="span"
            startIcon={<AddIcon />}
          >
            Upload
          </Button>
        </label>
        {fileError && (
          <Alert severity="error" onClose={() => setFileError(null)}>
            {fileError}
          </Alert>
        )}
        <Demo>
          {props.mapLayers && props.mapLayers.length > PER_PAGE && (
            <Pagination
              count={count}
              size="large"
              page={page}
              variant="outlined"
              shape="rounded"
              onChange={handleChange}
            />
          )}
          <List dense={dense}>
            {props.mapLayers &&
              props.mapLayers.length > 0 &&
              _DATA.currentData().map((layer) => (
                <ListItemWithWiderSecondaryAction
                  className="classname"
                  key={layer.id}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      <FolderIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={"AOI id " + layer.aoiId}
                    secondary={
                      <span>
                        Area: {parseInt(layer.area).toLocaleString()} sqm <br />
                        <span style={{ color: "red" }}>
                          {parseInt(layer.area) < 5000 ? (
                            <>
                              The area is very small for a TA
                              <br />
                              Delete it and create a bigger TA
                            </>
                          ) : (
                            ""
                          )}
                        </span>
                        {layer.aoiId && (
                          <AOIDetails aoiId={layer.aoiId}></AOIDetails>
                        )}
                      </span>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Create map data in JOSM Editor">
                      <IconButton
                        aria-label="comments"
                        sx={{ width: 24, height: 24 }}
                        className="margin1 transparent"
                        onClick={async (e) => {
                          try {
                            const Imgurl = new URL(
                              "http://127.0.0.1:8111/imagery"
                            );
                            Imgurl.searchParams.set("type", "tms");
                            Imgurl.searchParams.set(
                              "title",
                              props.oamImagery.name
                            );
                            Imgurl.searchParams.set(
                              "url",
                              props.oamImagery.url
                            );
                            const imgResponse = await fetch(Imgurl);
                            const loadurl = new URL(
                              "http://127.0.0.1:8111/load_and_zoom"
                            );
                            loadurl.searchParams.set(
                              "bottom",
                              layer.latlngs[0].lat
                            );
                            loadurl.searchParams.set(
                              "top",
                              layer.latlngs[1].lat
                            );
                            loadurl.searchParams.set(
                              "left",
                              layer.latlngs[0].lng
                            );
                            loadurl.searchParams.set(
                              "right",
                              layer.latlngs[2].lng
                            );
                            const loadResponse = await fetch(loadurl);

                            if (!imgResponse.ok) {
                              setOpenSnack(true);
                            }
                          } catch (error) {
                            setOpenSnack(true);
                          }
                        }}
                      >
                        <img
                          alt="JOSM logo"
                          className="editor-logo-small"
                          src="/josm-logo.png"
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Create map data in ID Editor">
                      <IconButton
                        aria-label="comments"
                        sx={{ width: 24, height: 24 }}
                        className="margin1 transparent"
                        onClick={(e) => {
                          window.open(
                            `https://www.openstreetmap.org/edit/#background=${
                              props.oamImagery
                                ? "custom:" + props.oamImagery.url
                                : "Bing"
                            }&disable_features=boundaries&gpx=${
                              process.env.REACT_APP_API_BASE
                            }/aoi/gpx/${layer.aoiId}&map=10.70/18.9226/81.6991`,
                            "_blank",
                            "noreferrer"
                          );
                        }}
                      >
                        <img
                          alt="OSM logo"
                          className="osm-logo-small"
                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Openstreetmap_logo.svg/256px-Openstreetmap_logo.svg.png"
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Fetch OSM data for this TA">
                      <IconButton
                        aria-label="comments"
                        sx={{ width: 24, height: 24 }}
                        className="margin1"
                        onClick={(e) => {
                          mutateFetch(layer.aoiId);
                        }}
                      >
                        <MapTwoTone fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Zoom to TA">
                      <IconButton
                        sx={{ width: 24, height: 24 }}
                        className="margin1"
                        edge={"end"}
                        aria-label="delete"
                        onClick={(e) => {
                          const lat =
                            layer.latlngs.reduce(function (
                              accumulator,
                              curValue
                            ) {
                              return accumulator + curValue.lat;
                            },
                            0) / layer.latlngs.length;
                          const lng =
                            layer.latlngs.reduce(function (
                              accumulator,
                              curValue
                            ) {
                              return accumulator + curValue.lng;
                            },
                            0) / layer.latlngs.length;
                          props.selectAOIHandler([lat, lng], 17);
                        }}
                      >
                        <ZoomInMap fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete TA">
                      <IconButton
                        aria-label="comments"
                        sx={{ width: 24, height: 24 }}
                        className="margin-left-13"
                        onClick={(e) => {
                          mutateDeleteAOI(layer.aoiId, layer.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItemWithWiderSecondaryAction>
              ))}
          </List>
        </Demo>
        {props.mapLayers && props.mapLayers.length === 0 && (
          <Typography variant="body1" component="h2">
            No TAs yet, start creating one by clicking Draw a rectangle, 3rd
            down at the top left of the image/map
          </Typography>
        )}
      </Grid>
      <Snackbar
        open={openSnack}
        autoHideDuration={5000}
        onClose={() => {
          setOpenSnack(false);
        }}
        message={
          <Alert severity="error">
            <span>
              Please make sure JOSM is open and Remote Control feature is
              enabled{" "}
              <a
                target="_blank"
                rel="noreferrer"
                href="https://josm.openstreetmap.de/wiki/Help/Preferences/RemoteControl"
              >
                Click here for more details
              </a>
            </span>
          </Alert>
        }
        color="red"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      />
    </>
  );
};
export default AOI;
