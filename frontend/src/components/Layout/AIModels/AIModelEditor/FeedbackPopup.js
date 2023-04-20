import React, { useState } from "react";
import { makeStyles } from "@mui/styles";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FeedbackMap from "./FeedbackMap";
import LoadingButton from "@mui/lab/LoadingButton";

const useStyles = makeStyles((theme) => ({
  content: {
    padding: theme.spacing(2),
  },
}));

const FeedbackPopup = ({ feedbackData, onClose, sourceImagery }) => {
  const classes = useStyles();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Published Model Feedbacks</DialogTitle>
      <DialogContent className={classes.content}>
        <FeedbackMap
          feedbackData={feedbackData}
          sourceImagery={sourceImagery}
        />
        <LoadingButton
          variant="contained"
          color="primary"
          size="small"
          sx={{ mt: 1 }}
          onClick={() => {}}
        >
          Apply Validated Feedback to Model
        </LoadingButton>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackPopup;
