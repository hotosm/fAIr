import React, { useState, useContext } from "react";
import { makeStyles } from "@mui/styles";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FeedbackMap from "./FeedbackMap";
import LoadingButton from "@mui/lab/LoadingButton";
import axios from "../../../../axios";
import AuthContext from "../../../../Context/AuthContext";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import { FormControl, FormLabel } from "@material-ui/core";
import FormGroup from "@mui/material/FormGroup";
import { Checkbox, FormControlLabel } from "@mui/material";

const useStyles = makeStyles((theme) => ({
  content: {
    padding: theme.spacing(2),
  },
}));

const FeedbackPopup = ({
  feedbackData,
  onClose,
  sourceImagery,
  trainingId,
}) => {
  const classes = useStyles();
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [freezeLayers, setFreezeLayers] = useState(false);

  const { accessToken } = useContext(AuthContext);
  const actionCounts = {
    CREATE: 0,
    MODIFY: 0,
    ACCEPT: 0,
  };
  const [epochs, setEpochs] = useState(2);
  const [batchSize, setBatchSize] = useState(1);

  feedbackData.features.forEach((feature) => {
    switch (feature.properties.action) {
      case "CREATE":
        actionCounts.CREATE++;
        break;
      case "MODIFY":
        actionCounts.MODIFY++;
        break;
      case "ACCEPT":
        actionCounts.ACCEPT++;
        break;
      default:
        break;
    }
  });

  const handleClose = () => {
    setOpen(false);
    onClose();
  };
  const handleApplyFeedback = () => {
    setLoading(true);
    axios
      .post(
        "/apply/feedback/",
        {
          training_id: trainingId,
          epochs: epochs,
          batch_size: batchSize,
          freeze_layers: freezeLayers,
        },
        { headers: { "access-token": accessToken } }
      )
      .then((response) => {
        console.log(response.data);
        setLoading(false);
        handleClose();
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>
        {" "}
        <strong>Published Model Feedbacks</strong>
      </DialogTitle>
      <DialogContent className={classes.content}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="h6" gutterBottom>
              Feedback Information
            </Typography>
            <Typography variant="body1" gutterBottom>
              Total Feedbacks: {feedbackData.features.length}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Validated:{" "}
              {
                feedbackData.features.filter(
                  (feature) => feature.properties.validated
                ).length
              }
            </Typography>
            <Typography variant="body1" gutterBottom>
              Need Validation:{" "}
              {
                feedbackData.features.filter(
                  (feature) => !feature.properties.validated
                ).length
              }
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="h6" gutterBottom>
              Feedback Summary
            </Typography>
            <Typography variant="body1" gutterBottom>
              Created / Modified : {actionCounts.CREATE} / {actionCounts.MODIFY}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Accepted: {actionCounts.ACCEPT}
            </Typography>
            <LoadingButton
              variant="contained"
              color="primary"
              size="small"
              sx={{ mb: 1 }}
              disabled={
                feedbackData.features.filter(
                  (feature) => !feature.properties.validated
                ).length < 1
              }
              onClick={() => {
                setLoading(true);
                const feedbackIds = feedbackData.features.map(
                  (feature) => feature.properties.id
                );
                Promise.all(
                  feedbackIds.map((id) =>
                    axios.patch(
                      `/feedback/${id}/`,
                      { validated: true },
                      { headers: { "access-token": accessToken } }
                    )
                  )
                )
                  .then(() => {
                    setLoading(false);
                    console.log("All feedback validated successfully!");
                  })
                  .catch((error) => {
                    setLoading(false);
                    console.error(error);
                  });
              }}
              loading={loading}
            >
              Validate All
            </LoadingButton>
            <LoadingButton
              variant="contained"
              color="primary"
              size="small"
              sx={{ ml: 1, mb: 1 }}
              disabled={
                feedbackData.features.filter(
                  (feature) => !feature.properties.validated
                ).length < 1
              }
              onClick={() => {
                setLoading(true);
                const feedbackIds = feedbackData.features.map(
                  (feature) => feature.properties.id
                );
                Promise.all(
                  feedbackIds.map((id) =>
                    axios.delete(`/feedback/${id}/`, {
                      headers: { "access-token": accessToken },
                    })
                  )
                )
                  .then(() => {
                    setLoading(false);
                    console.log("All feedback deleted successfully!");
                  })
                  .catch((error) => {
                    setLoading(false);
                    console.error(error);
                  });
              }}
              loading={loading}
            >
              Discard All
            </LoadingButton>
          </Grid>
        </Grid>
        <FeedbackMap
          feedbackData={feedbackData}
          sourceImagery={sourceImagery}
        />
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
        <Grid item xs={12} md={6} container>
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
        </Grid>

        <LoadingButton
          variant="contained"
          color="primary"
          size="small"
          sx={{ mt: 1 }}
          onClick={handleApplyFeedback}
          loading={loading}
          disabled={
            feedbackData.features.filter(
              (feature) => feature.properties.validated
            ).length < 1
          }
        >
          Apply Validated Feedback to Model
        </LoadingButton>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackPopup;
