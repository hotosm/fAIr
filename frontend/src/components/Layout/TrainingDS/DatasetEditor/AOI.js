import React, { useContext, useEffect, useState } from "react";
import { Collapse, Box } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
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
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import RefreshIcon from "@mui/icons-material/Refresh";
import UploadProgressModal from "./UploadProgressModal";
const Demo = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
}));

const ListItemWithWiderSecondaryAction = withStyles({
  secondaryAction: {
    paddingRight: 96,
  },
})(ListItem);

const PER_PAGE = 5;

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
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const count = Math.ceil(props.mapLayers.length / PER_PAGE);
  let [page, setPage] = useState(1);
  const [openSnack, setOpenSnack] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [geoJsonFile, setGeoJsonFile] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [expandedAoi, setExpandedAoi] = useState(null);

  const handleExpandClick = (aoiId) => {
    setExpandedAoi(expandedAoi === aoiId ? null : aoiId);
  };
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

  const handleFileChange = async (event, aoiId) => {
    try {
      setIsModalOpen(true);
      setIsLoading(true);
      const file = event.target.files[0];
      if (!file) return;

      const headers = {
        "access-token": accessToken,
      };

      const fileContent = await file.text();
      const geoJsonData = JSON.parse(fileContent);

      if (geoJsonData.type !== "FeatureCollection") {
        console.error("Invalid GeoJSON format");
        return;
      }

      const geometries = geoJsonData.features.map(
        (feature) => feature.geometry
      );
      let feature_count = 0;
      for (const geometry of geometries) {
        feature_count = feature_count + 1;
        const progress_updater = {
          current: feature_count,
          total: geometries.length,
        };
        setProgress(progress_updater);
        console.log(feature_count);
        const data = {
          geom: JSON.stringify(geometry),
          aoi: aoiId,
        };

        // Send a POST request to the /label/ API for each geometry
        const res = await axios.post(`/label/`, data, {
          headers,
        });

        if (res.error) {
          console.error(res.error.response.statusText);
        } else {
          console.log("Label uploaded successfully");
        }
      }
    } catch (e) {
      console.error("Error uploading labels", e);
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
    }
  };

  const downloadAOI = async (aoiId) => {
    try {
      const headers = {
        "access-token": accessToken,
      };

      const res = await axios.get(`/aoi/${aoiId}/`, {
        headers,
        responseType: "json",
      });

      if (res.error) {
        console.log(res.error.response.statusText);
      } else {
        const jsonStr = JSON.stringify(res.data);
        console.log(jsonStr);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `AOI_${aoiId}.geojson`;

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.log("Error:", e);
    }
  };

  const downloadLabels = async (aoiId) => {
    try {
      const headers = {
        "access-token": accessToken,
      };

      const res = await axios.get(`/label/?aoi=${aoiId}`, {
        headers,
        responseType: "json",
      });

      if (res.error) {
        console.log(res.error.response.statusText);
      } else {
        const jsonStr = JSON.stringify(res.data);
        console.log(jsonStr);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `AOI_Labels_${aoiId}.geojson`;

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.log("Error:", e);
    }
  };

  const fetchOSMLebels = async (aoiId) => {
    setFetchError(null);
    try {
      const headers = {
        "access-token": accessToken,
      };

      const res = await axios.post(`/label/osm/fetch/${aoiId}/`, null, {
        headers,
      });

      if (res.error) {
        console.log(res.error.response.statusText);
        setFetchError("Failed to fetch OSM data. Please try again.");
      } else {
        return res.data;
      }
    } catch (e) {
      console.log("isError", e);
      setFetchError("Failed to fetch OSM data. Please check your connection.");
    }
  };

  const { mutate: mutateFetch } = useMutation(fetchOSMLebels, {
    onError: () => {
      setFetchError("Failed to fetch OSM data. Please try again.");
    },
  });

  const { mutate: mutateDownload, data: fetchdwnld } = useMutation(downloadAOI);
  const { mutate: mutateDownloadLables, data: fetchdwnldlabels } =
    useMutation(downloadLabels);

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
        <UploadProgressModal open={isModalOpen} progress={progress} />
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
                    {/* JOSM Editor Button */}
                    <Tooltip title="Create map data in JOSM Editor">
                      <IconButton
                        aria-label="comments"
                        sx={{ width: 24, height: 24 }}
                        className="margin1 transparent"
                        onClick={async (e) => {
                          const Imgurl = new URL(
                            "http://127.0.0.1:8111/imagery"
                          );
                          Imgurl.searchParams.set("type", "tms");
                          Imgurl.searchParams.set(
                            "title",
                            props.oamImagery.name
                          );
                          Imgurl.searchParams.set("url", props.oamImagery.url);
                          const imgResponse = await fetch(Imgurl);

                          const loadurl = new URL(
                            "http://127.0.0.1:8111/load_and_zoom"
                          );
                          loadurl.searchParams.set(
                            "bottom",
                            layer.latlngs[0].lat
                          );
                          loadurl.searchParams.set("top", layer.latlngs[1].lat);
                          loadurl.searchParams.set(
                            "left",
                            layer.latlngs[0].lng
                          );
                          loadurl.searchParams.set(
                            "right",
                            layer.latlngs[2].lng
                          );
                          await fetch(loadurl);

                          if (!imgResponse.ok) setOpenSnack(true);
                        }}
                      >
                        <img
                          alt="JOSM logo"
                          className="editor-logo-small"
                          src="/josm-logo.png"
                        />
                      </IconButton>
                    </Tooltip>

                    {/* ID Editor Button */}
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

                    {/* Fetch OSM Data */}
                    <Tooltip title="Fetch OSM data for this TA">
                      <IconButton
                        aria-label="fetch OSM data"
                        sx={{ width: 24, height: 24 }}
                        className="margin1"
                        onClick={(e) => {
                          mutateFetch(layer.aoiId);
                        }}
                      >
                        <MapTwoTone fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* Zoom to TA */}
                    <Tooltip title="Zoom to TA">
                      <IconButton
                        sx={{ width: 24, height: 24 }}
                        className="margin1"
                        onClick={(e) => {
                          const lat =
                            layer.latlngs.reduce(
                              (accumulator, curValue) =>
                                accumulator + curValue.lat,
                              0
                            ) / layer.latlngs.length;
                          const lng =
                            layer.latlngs.reduce(
                              (accumulator, curValue) =>
                                accumulator + curValue.lng,
                              0
                            ) / layer.latlngs.length;
                          props.selectAOIHandler([lat, lng], 17);
                        }}
                      >
                        <ZoomInMap fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* Expand More Options */}
                    <Tooltip
                      title={
                        expandedAoi === layer.aoiId
                          ? "Hide More Options"
                          : "Show More Options"
                      }
                    >
                      <IconButton
                        sx={{ width: 24, height: 24 }}
                        className="margin1"
                        onClick={() => handleExpandClick(layer.aoiId)}
                      >
                        {expandedAoi === layer.aoiId ? (
                          <ExpandLessIcon fontSize="small" />
                        ) : (
                          <ExpandMoreIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>

                    {/* Collapsible section for more options */}
                    <Collapse
                      in={expandedAoi === layer.aoiId}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        {/* Download AOI */}
                        <Tooltip title="Download this AOI">
                          <IconButton
                            aria-label="download AOI"
                            sx={{ width: 24, height: 24 }}
                            className="margin1"
                            onClick={(e) => {
                              mutateDownload(layer.aoiId);
                            }}
                          >
                            <CloudDownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Download Labels */}
                        <Tooltip title="Download Labels in this AOI">
                          <IconButton
                            aria-label="download labels"
                            sx={{ width: 24, height: 24 }}
                            className="margin1"
                            onClick={(e) => {
                              mutateDownloadLables(layer.aoiId);
                            }}
                          >
                            <CloudDownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Delete TA */}
                        <Tooltip title="Delete TA">
                          <IconButton
                            aria-label="delete TA"
                            sx={{ width: 24, height: 24 }}
                            className="margin1"
                            onClick={(e) => {
                              mutateDeleteAOI(layer.aoiId, layer.id);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Upload GeoJSON */}
                        <input
                          type="file"
                          accept=".geojson"
                          style={{ display: "block" }}
                          id={`file-input-${layer.aoiId}`}
                          onChange={(e) => handleFileChange(e, layer.aoiId)}
                        />
                      </Box>
                    </Collapse>
                  </ListItemSecondaryAction>
                </ListItemWithWiderSecondaryAction>
              ))}
          </List>
        </Demo>
        {fetchError && <Typography variant="body2">{fetchError}</Typography>}
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
