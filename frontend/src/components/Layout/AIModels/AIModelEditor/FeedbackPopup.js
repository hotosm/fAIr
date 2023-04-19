import React, { useState } from "react";
import { makeStyles } from "@mui/styles";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FeedbackMap from "./FeedbackMap";

const useStyles = makeStyles((theme) => ({
  content: {
    padding: theme.spacing(2),
  },
}));

const FeedbackPopup = ({ feedbackData, onClose }) => {
  const classes = useStyles();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Feedback</DialogTitle>
      <DialogContent className={classes.content}>
        <FeedbackMap feedbackData={feedbackData} />
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackPopup;
