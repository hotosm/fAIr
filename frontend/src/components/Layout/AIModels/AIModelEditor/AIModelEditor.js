import {
  Alert,
  Button,
  Grid,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { modelStatus } from "../../../../utils";
import axios from "../../../../axios";
import { useMutation, useQuery } from "react-query";
import Popup from "./Popup";

import OSMUser from "../../../Shared/OSMUser";
import SaveIcon from "@material-ui/icons/Save";
import { Checkbox, FormControlLabel } from "@mui/material";
import { FormControl, FormLabel } from "@material-ui/core";

import AuthContext from "../../../../Context/AuthContext";
import Trainings from "./Trainings";
import DatasetCurrent from "./DatasetCurrent";
import FeedbackToast from "./FeedbackToast";

const AIModelEditor = (props) => {
  let { id } = useParams();
  const [error, setError] = useState(null);
  const [epochs, setEpochs] = useState(20);
  const [zoomLevel, setZoomLevel] = useState([19]);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupRowData, setPopupRowData] = useState(null);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [random, setRandom] = useState(Math.random());
  const [batchSize, setBatchSize] = useState(8);
  const [description, setDescription] = useState("");
  const { accessToken } = useContext(AuthContext);
  const zoomLevels = [19, 20, 21];
  const getModelById = async () => {
    try {
      const modelId = +id;
      const res = await axios.get(`/model/${modelId}`);
      if (res.error) setError(res.error.response.statusText);
      else {
        // console.log("getmodel", res.data);
        return res.data;
      }
    } catch (e) {
      setError(e);
    } finally {
    }
  };
  const openPopupWithTrainingId = async (trainingId) => {
    try {
      const response = await axios.get(`/training/${trainingId}/`);
      setPopupRowData(response.data);
      setPopupOpen(true);
    } catch (error) {
      console.error("Error fetching training information:", error);
    }
  };
  const handlePopupOpen = (row) => {
    setPopupRowData(row);
    setPopupOpen(true);
  };

  const { data, isLoading, refetch } = useQuery("getModelById", getModelById, {
    refetchInterval: 60000,
  });
  const getFeedbackCount = async () => {
    try {
      const response = await axios.get(
        `/feedback/?training=${data.published_training}`
      );
      console.log(response.data.features);
      const feedbackCount = response.data.features.length;
      console.log(feedbackCount);
      setFeedbackCount(feedbackCount);
    } catch (error) {
      console.error("Error fetching feedback information:", error);
    }
  };
  useEffect(() => {
    if (data?.published_training) {
      getFeedbackCount();
    }
  }, [data]);

  const saveTraining = async () => {
    try {
      const body = {
        epochs: epochs,
        batch_size: batchSize,
        model: id,
        zoom_level: zoomLevel,
        description: description,
      };
      const headers = {
        "access-token": accessToken,
      };
      const res = await axios.post("/training/", body, { headers });

      if (res.error) {
        setError(
          res.error.response.statusText +
            " / " +
            JSON.stringify(res.error.response.data)
        );
        return;
      }

      console.log("/training/", res);
      setRandom(Math.random());
      return res.data;
    } catch (e) {
      console.log("isError");
      setError(JSON.stringify(e));
    } finally {
    }
  };
  const { mutate, isLoading: isLoadingSaveTraining } =
    useMutation(saveTraining);
  const navigate = useNavigate();
  return (
    <>
      {data && (
        <Grid container padding={2} spacing={2}>
          <Grid item xs={6} md={6}>
            <FeedbackToast count={feedbackCount} />
            <Typography variant="h6" component="div">
              Model ID: {data.id}
            </Typography>
            <Typography
              variant="h6"
              component="div"
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <div>
                Status: <b>{modelStatus(data.status)}</b>
                {data.published_training && (
                  <>
                    ,
                    <Link
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        openPopupWithTrainingId(data.published_training);
                      }}
                      color="inherit"
                    >
                      <b>Training: {data.published_training}</b>
                    </Link>
                  </>
                )}
              </div>
              {data.status === 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/start-mapping/" + data.id);
                  }}
                >
                  Start mapping
                </Button>
              )}
            </Typography>

            <Typography variant="h6" component="div">
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/training-datasets/" + data.dataset);
                }}
                color="inherit"
              >
                Dataset Id: {data.dataset}
              </Link>
            </Typography>
            <Typography variant="h6" component="div">
              Current dataset size:{" "}
              <DatasetCurrent datasetId={data.dataset}></DatasetCurrent>
            </Typography>
          </Grid>
          <Grid item xs={6} md={6}>
            <Typography variant="h6" component="div">
              Name: {data.name}
            </Typography>
            <Typography variant="h6" component="div">
              Created by: {<OSMUser uid={data.created_by}></OSMUser>}
            </Typography>
            <Typography variant="h6" component="div">
              Created on: {new Date(data.created_at).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              id="model-epochs"
              label="Epochs"
              helperText={
                <span>
                  Epochs refers to the number of times the learning algorithm
                  will go through the entire training dataset, recommended
                  between 20 - 60. The higher it is the longer model training
                  takes
                </span>
              }
              type="number"
              value={epochs}
              fullWidth
              onChange={(e) => {
                setEpochs(+e.target.value);
              }}
              error={epochs === null || epochs <= 0}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              id="model-batch"
              label="Batch Size"
              helperText={
                <span>
                  Batch size refers to number of sample pairs to work through
                  before updating the internal model parameters. 8 is
                  recommended and preferred to be 8, 16, 32 ...etc
                </span>
              }
              type="number"
              value={batchSize}
              fullWidth
              onChange={(e) => {
                setBatchSize(+e.target.value);
              }}
              error={batchSize === null || batchSize <= 0}
            />
          </Grid>
          <Grid item xs={12} md={6} container>
            <FormControl>
              <FormLabel component="legend">Zoom Levels</FormLabel>
              {zoomLevels.map((level) => (
                <FormControlLabel
                  key={level}
                  sx={{ mr: "0.5rem", flexDirection: "row" }}
                  control={
                    <Checkbox
                      sx={{ transform: "scale(0.8)" }}
                      checked={zoomLevel.includes(level)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          console.log(e.target.value);
                          console.log(level);
                          setZoomLevel([...zoomLevel, level]);
                        } else {
                          setZoomLevel(zoomLevel.filter((l) => l !== level));
                        }
                      }}
                      name={`zoom-level-${level}`}
                    />
                  }
                  label={`Zoom ${level}`}
                />
              ))}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              id="model-description"
              label="Short Description (optional)"
              helperText={
                <span>
                  A short description to document why you submitted this
                  training
                </span>
              }
              type="text"
              value={description}
              fullWidth
              onChange={(e) => {
                setDescription(e.target.value);
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}></Grid>
          <Grid item xs={12} md={6}></Grid>
          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<SaveIcon />}
              onClick={() => {
                console.log("save");
                mutate();
              }}
              disabled={epochs <= 0 || batchSize <= 0}
            >
              Submit a training request
            </Button>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
          <Grid item xs={12}>
            <Trainings
              modelId={id}
              datasetId={data.dataset}
              random={random}
            ></Trainings>
          </Grid>
        </Grid>
      )}
      {popupRowData && (
        <Popup
          open={popupOpen}
          handleClose={() => setPopupOpen(false)}
          row={popupRowData}
        />
      )}
    </>
  );
};
export default AIModelEditor;
