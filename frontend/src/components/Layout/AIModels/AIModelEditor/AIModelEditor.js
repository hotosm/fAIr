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
import FeedbackPopup from "./FeedbackPopup";
import FormGroup from "@mui/material/FormGroup";
import LoadingButton from "@mui/lab/LoadingButton/LoadingButton";

const AIModelEditor = (props) => {
  let { id } = useParams();
  const [error, setError] = useState(null);
  const [epochs, setEpochs] = useState(20);
  const [zoomLevel, setZoomLevel] = useState([19, 20, 21]);
  const [popupOpen, setPopupOpen] = useState(false);
  const [sourceImagery, setSourceImagery] = React.useState(null);
  const [freezeLayers, setFreezeLayers] = useState(false);

  const [popupRowData, setPopupRowData] = useState(null);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [feedbackData, setFeedbackData] = useState(null);
  const [random, setRandom] = useState(Math.random());
  const [batchSize, setBatchSize] = useState(8);
  const [description, setDescription] = useState("");
  const [feedbackPopupOpen, setFeedbackPopupOpen] = React.useState(false);
  const { accessToken } = useContext(AuthContext);
  const zoomLevels = [19, 20, 21];
  const getModelById = async () => {
    try {
      const modelId = +id;
      const res = await axios.get(`/model/${modelId}`);
      if (res.error) setError(res.error.response.statusText);
      else {
        // console.log("getmodel", res.data);
        getFeedbackCount(res.data.published_training);
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

  const { data, isLoading, refetch } = useQuery(
    "getModelById" + id,
    getModelById,
    {
      refetchInterval: 60000,
    }
  );
  const [isLoadingFeedbackCount, setIsLoadingFeedbackCount] = useState(true);
  const getFeedbackCount = async (trainingId) => {
    try {
      setFeedbackCount(0);
      const response = await axios.get(`/feedback/?training=${trainingId}`);
      setFeedbackData(response.data);
      console.log(`/feedback/?training=${trainingId}`, response.data);
      setFeedbackCount(response.data.features.length);
      setIsLoadingFeedbackCount(false);
    } catch (error) {
      console.error("Error fetching feedback information:", error);
    }
  };

  // useEffect(() => {
  //   if (data?.published_training) {
  //     getFeedbackCount();
  //   }
  // }, [data]);

  const handleFeedbackClick = async (trainingId) => {
    getFeedbackCount();
    if (sourceImagery === null) {
      try {
        const response = await axios.get(`/training/${trainingId}/`);
        setSourceImagery(response.data.source_imagery);
      } catch (error) {
        console.error(error);
      }
    }
    setFeedbackPopupOpen(true);
  };

  const saveTraining = async () => {
    try {
      const body = {
        epochs: epochs,
        batch_size: batchSize,
        freeze_layers: freezeLayers,
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
  const refetshModelDetails = () => {
    refetch();
  };
  const { mutate, isLoading: isLoadingSaveTraining } =
    useMutation(saveTraining);
  const navigate = useNavigate();
  return (
    <>
      {data && (
        <Grid container padding={2} spacing={2}>
          <Grid item xs={6} md={6}>
            {/* {data.published_training && (
              <FeedbackToast
                count={feedbackCount}
                feedbackData={feedbackData}
                trainingId={data.published_training}
              />
            )} */}
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
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Zoom Levels</FormLabel>
              <FormGroup row>
                {zoomLevels.map((level) => (
                  <FormControlLabel
                    key={level}
                    sx={{ mr: "0.5rem" }}
                    control={
                      <Checkbox
                        sx={{ transform: "scale(0.8)" }}
                        checked={zoomLevel.includes(level)}
                        onChange={(e) => {
                          if (e.target.checked) {
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
              </FormGroup>
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
          {/* <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Freeze Layers</FormLabel>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      sx={{ transform: "scale(0.8)" }}
                      checked={freezeLayers}
                      onChange={(e) => setFreezeLayers(e.target.checked)}
                      name="freeze-layers"
                    />
                  }
                  label="Freeze Layers"
                />
              </FormGroup>
            </FormControl>
          </Grid> */}

          <Grid item xs={12} md={12}></Grid>
          <Grid item xs={6} md={6}>
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
              sx={{ pl: 2 }}
            >
              Submit a training request
            </Button>
          </Grid>
          <Grid item xs={6} md={6} textAlign="right">
            <LoadingButton
              variant="contained"
              color="primary"
              size="small"
              onClick={() => {
                //handleFeedbackClick(data.published_training);
                // add logic to view feedbacks here
                navigate(
                  `/ai-models/${data.id}/${data.published_training}/feedback`
                );
              }}
              disabled={feedbackCount <= 0}
              loading={isLoadingFeedbackCount}
            >
              {feedbackCount > 0
                ? "View Feedbacks"
                : "No feedback for published training"}
            </LoadingButton>
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
              refetshModelDetails={refetshModelDetails}
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
      {feedbackPopupOpen && data.published_training && (
        <FeedbackPopup
          isOpen={feedbackPopupOpen}
          feedbackData={feedbackData}
          sourceImagery={sourceImagery}
          trainingId={data.published_training}
          onClose={() => setFeedbackPopupOpen(false)}
        />
      )}
    </>
  );
};
export default AIModelEditor;
