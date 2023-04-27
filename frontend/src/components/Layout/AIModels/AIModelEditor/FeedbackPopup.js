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
  const { accessToken } = useContext(AuthContext);
  const actionCounts = {
    CREATE: 0,
    MODIFY: 0,
    ACCEPT: 0,
  };
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
        { training_id: trainingId },
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
          </Grid>
        </Grid>
        <FeedbackMap
          feedbackData={feedbackData}
          sourceImagery={sourceImagery}
        />
        <LoadingButton
          variant="contained"
          color="primary"
          size="small"
          sx={{ mt: 1 }}
          onClick={handleApplyFeedback}
          loading={loading}
        >
          Apply Validated Feedback to Model
        </LoadingButton>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackPopup;
