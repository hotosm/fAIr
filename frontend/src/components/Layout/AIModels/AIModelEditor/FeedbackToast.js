import React from "react";
import { makeStyles } from "@mui/styles";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  close: {
    padding: theme.spacing(0.5),
  },
}));

const FeedbackToast = ({ count }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
    // navigate(`/feedback/${data.published_training}`);
  };

  React.useEffect(() => {
    if (count > 0) {
      handleClick();
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
      />
    </>
  );
};

export default FeedbackToast;
