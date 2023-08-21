import LoadingButton from "@mui/lab/LoadingButton/LoadingButton";
import {
  Alert,
  AlertTitle,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  Link,
  TextField,
} from "@mui/material";
import React, { useContext, useState } from "react";
import AuthContext from "../../../Context/AuthContext";
import axios from "../../../axios";
import { useMutation } from "react-query";
import { useNavigate } from "react-router-dom";

const FeedackTraining = (props) => {
  const [epochs, setEpochs] = useState(20);
  const [batchSize, setBatchSize] = useState(8);
  const [error, setError] = useState(null);
  const { accessToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const submitFeedbackTraining = async () => {
    try {
      setError(null);
      const headers = {
        "access-token": accessToken,
      };
      const body = {
        training_id: props.trainingId,
        epochs: epochs,
        batch_size: batchSize,
        zoom_level: [19, 20, 21],
      };
      const res = await axios.post(`/feedback/training/submit/`, body, {
        headers,
      });
      console.log("/feedback/training/submit", res);
      if (res.error) {
        setError(
          res.error.response.statusText +
            " / " +
            JSON.stringify(res.error.response.data)
        );
        return;
      }
      console.log("training submitted", res.data);

      return res.data;
    } catch (e) {
      console.log("isError");
      setError(JSON.stringify(e));
    } finally {
    }
  };

  const {
    mutate,
    isLoading,
    status,
    error: apiError,
  } = useMutation(submitFeedbackTraining);
  return (
    <Grid item xs={12} className="card">
      <TextField
        label="Epochs"
        type="number"
        value={epochs}
        onChange={(e) => setEpochs(Math.max(0, parseInt(e.target.value)))}
        inputProps={{ min: 1, step: 1 }}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Batch Size"
        type="number"
        value={batchSize}
        onChange={(e) => setBatchSize(Math.max(0, parseInt(e.target.value)))}
        inputProps={{ min: 1, step: 1 }}
        fullWidth
        margin="normal"
      />
      <FormControl margin="normal">
        <FormLabel component="legend">Freeze Layers</FormLabel>
        <FormGroup row>
          <FormControlLabel
            control={
              <Checkbox
                sx={{ transform: "scale(0.8)" }}
                checked={true}
                // onChange={(e) => setFreezeLayers(e.target.checked)}
                name="freeze-layers"
                disabled={true}
              />
            }
            label="Freeze Layers"
          />
        </FormGroup>
      </FormControl>
      <LoadingButton
        variant="contained"
        color="primary"
        size="small"
        sx={{ mt: 1 }}
        onClick={() => {
          mutate();
        }}
        loading={isLoading}
      >
        Apply Feedback training to Model
      </LoadingButton>

      {status === "success" && !error && (
        <Alert severity="success">
          <AlertTitle>
            Training is submitted successfully, go to{" "}
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/ai-models/" + props.modelId);
              }}
            >
              Model id: {props.modelId}
            </Link>{" "}
            for more details
          </AlertTitle>
        </Alert>
      )}
      {apiError && (
        <Alert severity="error">
          <AlertTitle>{apiError}</AlertTitle>
        </Alert>
      )}
      {error && (
        <Alert severity="error">
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}
    </Grid>
  );
};

export default FeedackTraining;
