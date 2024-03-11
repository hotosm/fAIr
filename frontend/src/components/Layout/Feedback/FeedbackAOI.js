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
import { useMutation, useQuery } from "react-query";
import axios from "../../../axios";
import AOIDetails from "./FeedbackAOIDetails";
import AuthContext from "../../../Context/AuthContext";
import FeedbackAOIDetails from "./FeedbackAOIDetails";
import area from "@turf/area";
import centroid from "@turf/centroid";
const Demo = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
}));

const ListItemWithWiderSecondaryAction = withStyles({
  secondaryAction: {
    paddingRight: 96,
  },
})(ListItem);

const PER_PAGE = 5;
const FeedbackAOI = (props) => {
  const [dense, setDense] = useState(true);
  const [openSnack, setOpenSnack] = useState(false);

  const getFeedbackAOIs = async () => {
    try {
      const res = await axios.get(
        `/feedback-aoi/?training=${props.trainingId}`
      );

      if (res.error) {
        // setError(res.error.response.statusText);
      } else {
        console.log(`/feedback-aoi/?training=${props.trainingId}`, res.data);
        props.setAOIs(res.data);
        return res.data;
      }
    } catch (e) {
      // setError(e);
    } finally {
    }
  };
  const { data, isLoading, refetch } = useQuery(
    "getFeedbackAOIs" + props.trainingId,
    getFeedbackAOIs,
    { refetchInterval: 60000 }
  );
  const count = Math.ceil(data ? data?.features.length / PER_PAGE : 0);
  let [page, setPage] = useState(1);
  let _DATA = usePagination(data ? data?.features : [], PER_PAGE);
  const handleChange = (e, p) => {
    setPage(p);
    _DATA.jump(p);
  };
  // console.log("_DATA", _DATA);
  useEffect(() => {
    refetch();
    return () => {};
  }, [props.refresh]);

  const { accessToken } = useContext(AuthContext);
  const fetchOSMLebels = async (aoiId) => {
    try {
      const headers = {
        "access-token": accessToken,
      };

      const res = await axios.post(
        `/label/feedback/osm/fetch/${aoiId}/`,
        null,
        {
          headers,
        }
      );

      if (res.error) {
        // setMapError(res.error.response.statusText);
        console.log(res.error.response.statusText);
      } else {
        // success full fetch
        // props.setRefresh(Math.random());
        return res.data;
      }
    } catch (e) {
      console.log("isError", e);
    } finally {
    }
  };
  const { mutate: mutateFetch, data: fetchResult } =
    useMutation(fetchOSMLebels);
  const DeleteAOI = async (id) => {
    try {
      const headers = {
        "access-token": accessToken,
      };

      const res = await axios.delete(`/feedback-aoi/${id}`, {
        headers,
      });

      if (res.error) {
        console.log(res);
        console.log(res.error.response.statusText);
      } else {
        // success full fetch

        refetch();
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
        <Tooltip title="For maximum model accuracy, the map features need to be aligned and complete in every TA.">
          <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
            List of feedback for TAs{` (${data?.features.length})`}
          </Typography>
        </Tooltip>
        <Demo>
          {data && data.features && data.features.length > PER_PAGE && (
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
            {data &&
              data.features &&
              data.features.length > 0 &&
              _DATA.currentData().map((layer) => {
                // console.log(layer);
                return (
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
                      primary={"AOI id " + layer.id}
                      secondary={
                        <span>
                          Area: {area(layer).toLocaleString()} sqm <br />
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
                          {/* add here a container to get the AOI status from DB */}
                          {layer.id && (
                            <FeedbackAOIDetails
                              id={layer.id}
                            ></FeedbackAOIDetails>
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
                          onClick={async (e) => {
                            try {
                              // mutateFetch(layer.aoiId);
                              console.log("layer", layer);
                              console.log(
                                " props.sourceImagery",
                                props.sourceImagery
                              );

                              const Imgurl = new URL(
                                "http://127.0.0.1:8111/imagery"
                              );
                              Imgurl.searchParams.set("type", "tms");
                              Imgurl.searchParams.set("title", "Imagery");
                              Imgurl.searchParams.set(
                                "url",
                                props.sourceImagery
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
                                layer.geometry.coordinates[0][0][1]
                              );
                              loadurl.searchParams.set(
                                "top",
                                layer.geometry.coordinates[0][1][1]
                              );
                              loadurl.searchParams.set(
                                "left",
                                layer.geometry.coordinates[0][0][0]
                              );
                              loadurl.searchParams.set(
                                "right",
                                layer.geometry.coordinates[0][2][0]
                              );
                              const loadResponse = await fetch(loadurl);

                              if (!imgResponse.ok) {
                                setOpenSnack(true);
                              }
                            } catch (error) {
                              console.log("error", error);
                              setOpenSnack(true);
                            }
                          }}
                        >
                          {/* <MapTwoTone   /> */}
                          <img
                            alt="JOSM logo"
                            className="editor-logo-small"
                            src="/josm-logo.png"
                          />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Create Labels on ID Editor">
                        <IconButton
                          aria-label="comments"
                          sx={{ width: 24, height: 24 }}
                          className="margin1 transparent"
                          onClick={(e) => {
                            console.log(
                              "props.sourceImagery",
                              props.sourceImagery
                            );
                            const url = `https://www.openstreetmap.org/edit/#background=${
                              props.sourceImagery
                                ? "custom:" + props.sourceImagery
                                : "Bing"
                            }&disable_features=boundaries&gpx=https://fair-dev.hotosm.org/api/v1/feedback-aoi/gpx/${
                              layer.id
                            }&map=10.70/18.9226/81.6991`;
                            console.log(url);
                            window.open(url, "_blank", "noreferrer");
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
                      <Tooltip title="Fetch OSM Data in this TA">
                        <IconButton
                          aria-label="comments"
                          sx={{ width: 24, height: 24 }}
                          className="margin1"
                          onClick={(e) => {
                            mutateFetch(layer.id);
                            console.log(
                              "call raw data API to fetch OSM labels"
                            );
                          }}
                        >
                          <MapTwoTone fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {/* <IconButton aria-label="comments"
                className="margin1"
                disabled
                onClick={(e)=> {

                  console.log("Remove labels ")
                }}>
                   <PlaylistRemoveIcon />
                </IconButton> */}
                      <Tooltip title="Zoom to layer">
                        <IconButton
                          sx={{ width: 24, height: 24 }}
                          className="margin1"
                          edge={"end"}
                          aria-label="delete"
                          onClick={(e) => {
                            console.log("centroid(e)", centroid(layer));
                            const cneter = centroid(layer);
                            const lat = cneter.geometry.coordinates[1];
                            const lng = cneter.geometry.coordinates[0];

                            props.selectAOIHandler([lat, lng], 17);
                          }}
                        >
                          <ZoomInMap fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete this TA">
                        <IconButton
                          aria-label="comments"
                          sx={{ width: 24, height: 24 }}
                          className="margin-left-12"
                          onClick={(e) => {
                            mutateDeleteAOI(layer.id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItemWithWiderSecondaryAction>
                );
              })}
          </List>
        </Demo>
        {props.mapLayers && props.mapLayers.length === 0 && (
          <Typography variant="body1" component="h2">
            No TA yet. Start creating one by selecting Draw a rectangle, 3rd
            down at the top left.
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
export default FeedbackAOI;
