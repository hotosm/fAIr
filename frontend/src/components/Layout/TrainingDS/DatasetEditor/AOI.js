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
  SvgIcon,
  Typography,
} from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import MapIcon from "@mui/icons-material/Map";
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
  const count = Math.ceil(props.mapLayers.length / PER_PAGE);
  let [page, setPage] = useState(1);
  const [openSnack, setOpenSnack] = useState(false);
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
    } finally {
    }
  };
  const { mutate: mutateDeleteAOI } = useMutation(DeleteAOI);

  return (
    <>
      <Grid item md={12} className="card" marginBottom={1}>
        <Tooltip title="For each AOI, we need to make sure that the map data inside it is aligned and complete">
          <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
            Training Areas{` (${props.mapLayers.length})`}
          </Typography>
        </Tooltip>
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
                              The area is very small for an AOI
                              <br />
                              Delete it and create a bigger AOI
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
                    {/* <Tooltip title="Create map data in RapID Editor">
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
                       
                        <img
                          alt="RapiD logo"
                          className="editor-logo-small"
                          src="/rapid-logo.png"
                        />
                      </IconButton>
                    </Tooltip> */}
                    <Tooltip title="Create map data in JOSM Editor">
                      <IconButton
                        aria-label="comments"
                        sx={{ width: 24, height: 24 }}
                        className="margin1 transparent"
                        onClick={async (e) => {
                          try {
                            // mutateFetch(layer.aoiId);
                            console.log("layer", layer);

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
                            // bounds._southWest.lng,
                            // bounds._southWest.lat,
                            // bounds._northEast.lng,
                            // bounds._northEast.lat,
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
                          className="osm-logo-small"                         src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Openstreetmap_logo.svg/256px-Openstreetmap_logo.svg.png"
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Fetch OSM data for this AOI">
                      <IconButton
                        aria-label="comments"
                        sx={{ width: 24, height: 24 }}
                        className="margin1"
                        onClick={(e) => {
                          mutateFetch(layer.aoiId);
                          console.log("Call raw data API to fetch OSM labels");
                        }}
                      >
                        <MapTwoTone fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* <IconButton aria-label="comments"
                className="margin1"
                disabled
                onClick={(e)=> {

                  console.log("Remove labels")
                }}>
                   <PlaylistRemoveIcon />
                </IconButton> */}
                    <Tooltip title="Zoom to AOI">
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
                    <Tooltip title="Delete AOI">
                      <IconButton
                        aria-label="comments"
                        sx={{ width: 24, height: 24 }}
                        className="margin-left-13"
                        onClick={(e) => {
                          // console.log(
                          //   `layer.aoiId ${layer.aoiId} and layer.id ${layer.id}`
                          // );
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
            No AOIs yet, start creating one by clicking Draw a rectangle, 3rd down at the top 
            left of the image/map
          </Typography>
        )}
      </Grid>
      <Snackbar
        open={openSnack}
        autoHideDuration={5000}
        onClose={() => {
          console.log("openSnack", openSnack);
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
        // action={action}
        color="red"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      />
    </>
  );
};
export default AOI;
