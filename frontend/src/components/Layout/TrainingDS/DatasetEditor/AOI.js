import React, { useContext, useEffect, useState } from "react";
import {
  Avatar,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Pagination,
  SvgIcon,
  Typography,
} from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import MapIcon from "@mui/icons-material/Map";
import FolderIcon from "@mui/icons-material/Folder";
import { MapTwoTone, ZoomInMap } from "@mui/icons-material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import RefreshIcon from "@mui/icons-material/Refresh";
import usePagination from "./Pagination";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import ScreenshotMonitorIcon from "@mui/icons-material/ScreenshotMonitor";
import UploadProgressModal from "./UploadProgressModal";
import PlaylistRemoveIcon from "@mui/icons-material/PlaylistRemove";
import { useMutation } from "react-query";
import axios from "../../../../axios";
import AOIDetails from "./AOIDetails";
import AuthContext from "../../../../Context/AuthContext";
const Demo = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
}));

const ListItemWithWiderSecondaryAction = withStyles({
  secondaryAction: {
    paddingRight: 96,
  },
})(ListItem);

const PER_PAGE = 5;
const AOI = (props) => {
  const [dense, setDense] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const count = Math.ceil(props.mapLayers.length / PER_PAGE);
  let [page, setPage] = useState(1);
  let _DATA = usePagination(
    props.mapLayers.filter((e) => e.type === "aoi"),
    PER_PAGE
  );
  const handleChange = (e, p) => {
    setPage(p);
    _DATA.jump(p);
  };
  // console.log("_DATA", _DATA);
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
        // setMapError(res.error.response.statusText);
        console.log(res.error.response.statusText);
      } else {
        // success full fetch

        return res.data;
      }
    } catch (e) {
      console.log("isError", e);
    } finally {
    }
  };

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

  const { mutate: mutateFetch, data: fetchResult } =
    useMutation(fetchOSMLebels);

  const { mutate: mutateDownload, data: fetchdwnld } = useMutation(downloadAOI);
  const { mutate: mutateDownloadLables, data: fetchdwnldlabels } =
    useMutation(downloadLabels);

  return (
    <>
      <Grid item md={12} className="card" marginBottom={1}>
        <Tooltip title="For each AOI, we need to make sure labels inside it are alighed and complete to acheive best model accuracy">
          <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
            List of Area of Interests{` (${props.mapLayers.length})`}
          </Typography>
        </Tooltip>
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
                              Area seems to be very small for an AOI
                              <br />
                              Make sure it is not a Label
                            </>
                          ) : (
                            ""
                          )}
                        </span>
                        {/* add here a container to get the AOI status from DB */}
                        {layer.aoiId && (
                          <AOIDetails aoiId={layer.aoiId}></AOIDetails>
                        )}
                      </span>
                    }
                  />
                  <ListItemSecondaryAction>
                    {/* <IconButton aria-label="comments">
                   <DeleteIcon />
                </IconButton> */}
                    <Tooltip title="Create Labels on RapID Editor">
                      <IconButton
                        aria-label="comments"
                        sx={{ width: 24, height: 24 }}
                        className="margin1 transparent"
                        onClick={(e) => {
                          // mutateFetch(layer.aoiId);
                          // console.log("Open in Editor")
                          window.open(
                            `https://rapideditor.org/rapid#background=${
                              props.oamImagery
                                ? "custom:" + props.oamImagery.url
                                : "Bing"
                            }&datasets=fbRoads,msBuildings&disable_features=boundaries&map=16.00/17.9253/120.4841&gpx=&gpx=https://fair-dev.hotosm.org/api/v1/aoi/gpx/${
                              layer.aoiId
                            }`,
                            "_blank",
                            "noreferrer"
                          );
                        }}
                      >
                        {/* <MapTwoTone   /> */}
                        <img
                          alt="RapiD logo"
                          className="rapid-logo-small"
                          src="/rapid-logo.png"
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Create Labels on ID Editor">
                      <IconButton
                        aria-label="comments"
                        sx={{ width: 24, height: 24 }}
                        className="margin1 transparent"
                        onClick={(e) => {
                          // mutateFetch(layer.aoiId);
                          // console.log("Open in Editor")
                          window.open(
                            `https://www.openstreetmap.org/edit/#background=${
                              props.oamImagery
                                ? "custom:" + props.oamImagery.url
                                : "Bing"
                            }&disable_features=boundaries&gpx=https://fair-dev.hotosm.org/api/v1/aoi/gpx/${
                              layer.aoiId
                            }&map=10.70/18.9226/81.6991`,
                            "_blank",
                            "noreferrer"
                          );
                        }}
                      >
                        {/* <MapTwoTone   /> */}
                        <img
                          alt="OSM logo"
                          className="osm-logo-small"
                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Openstreetmap_logo.svg/256px-Openstreetmap_logo.svg.png"
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Fetch OSM Data in this AOI">
                      <IconButton
                        aria-label="comments"
                        sx={{ width: 24, height: 24 }}
                        className="margin1"
                        onClick={(e) => {
                          mutateFetch(layer.aoiId);
                          console.log("call raw data API to fetch OSM labels");
                        }}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download this AOI">
                      <IconButton
                        aria-label="comments"
                        sx={{ width: 24, height: 24 }}
                        className="margin1"
                        onClick={(e) => {
                          mutateDownload(layer.aoiId);
                          console.log("Downloading AOI as Geojson");
                        }}
                      >
                        <CloudDownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Download Labels in this AOI">
                      <IconButton
                        aria-label="comments"
                        sx={{ width: 24, height: 24 }}
                        className="margin1"
                        onClick={(e) => {
                          mutateDownloadLables(layer.aoiId);
                          console.log("Downloading AOI Labels as Geojson");
                        }}
                      >
                        <CloudDownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Zoom to layer">
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
                          // [lat, lng] are the centroid of the polygon
                          props.selectAOIHandler([lat, lng], 17);
                        }}
                      >
                        <ZoomInMap fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <input
                      type="file"
                      accept=".geojson"
                      style={{ display: "block" }}
                      id={`file-input-${layer.aoiId}`}
                      onChange={(e) => handleFileChange(e, layer.aoiId)}
                    />

                    {/* <IconButton aria-label="comments"
                className="margin1"
                disabled
                onClick={(e)=> {

                  console.log("Remove labels ")
                }}>
                   <PlaylistRemoveIcon />
                </IconButton> */}
                  </ListItemSecondaryAction>
                </ListItemWithWiderSecondaryAction>
              ))}
          </List>
        </Demo>
        {props.mapLayers && props.mapLayers.length === 0 && (
          <Typography variant="body1" component="h2">
            No AOIs yet, start creating one by selecting AOIs on the top and
            create a polygon
          </Typography>
        )}
      </Grid>
    </>
  );
};
export default AOI;
