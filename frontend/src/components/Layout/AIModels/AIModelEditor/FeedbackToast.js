import React from "react";
import { makeStyles } from "@mui/styles";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import FeedbackPopup from "./FeedbackPopup";
import { useNavigate } from "react-router-dom";
import axios from "../../../../axios";

const useStyles = makeStyles((theme) => ({
  close: {
    padding: theme.spacing(0.5),
  },
}));

const FeedbackToast = ({ count, feedbackData, trainingId }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [popupOpen, setPopupOpen] = React.useState(false);
  const [sourceImagery, setSourceImagery] = React.useState(null);

  const handleClick = async () => {
    if (sourceImagery === null) {
      try {
        const response = await axios.get(`/training/${trainingId}/`);
        setSourceImagery(response.data.source_imagery);
      } catch (error) {
        console.error(error);
      }
    }
    setOpen(false);
    setPopupOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  React.useEffect(() => {
    if (count > 0) {
      setOpen(true);
    }
  }, [count]);

  return (
    <>
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        open={open}
        // autoHideDuration={6000}
        onClose={handleClose}
        message={`You have ${count} number of feedback for your published training model. Tap to view them.`}
        action={
          <>
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              className={classes.close}
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        }
        onClick={handleClick}
      />
      {popupOpen && (
        <FeedbackPopup
          feedbackData={feedbackData}
          isOpen={popupOpen}
          sourceImagery={sourceImagery}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </>
  );
};

export default FeedbackToast;
