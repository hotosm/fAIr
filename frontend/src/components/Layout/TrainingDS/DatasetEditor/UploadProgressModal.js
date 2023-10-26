import React, { useState } from "react";
import { Dialog, DialogContent, CircularProgress } from "@mui/material";

const UploadProgressModal = ({ open, progress }) => {
  console.log(progress);
  return (
    <Dialog open={open}>
      <DialogContent>
        <div style={{ textAlign: "center" }}>
          <CircularProgress />
          <p>
            Uploading {progress.current} of {progress.total} labels...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadProgressModal;
