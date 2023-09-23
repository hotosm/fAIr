import React, { useState } from "react";
import { Dialog, DialogContent, CircularProgress } from "@mui/material";

const UploadProgressModal = ({ open, onClose, progress }) => {
  return (
    <Dialog open={open} onClose={onClose}>
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
