import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import axios from "../../../../axios";

const Popup = ({ open, handleClose, row }) => {
  const [error, setError] = useState(null);
  const [traceback, setTraceback] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const getTrainingStatus = async (taskId) => {
    try {
      const res = await axios.get(`/training/status/${taskId}`);

      if (res.error) {
        setError(res.error.response.statusText);
        setTraceback(null);
      } else {
        setError(null);
        setTraceback(res.data.traceback);
      }
    } catch (e) {
      setError(e);
      setTraceback(null);
    }
  };

  const getDatasetId = async (modelId) => {
    try {
      const res = await axios.get(`/model/${modelId}`);

      if (res.error) {
        console.error(res.error);
      } else {
        setImageUrl(
          `${axios.defaults.baseURL}/workspace/download/dataset_${res.data.dataset}/output/training_${row.id}/graphs/training_validation_sparse_categorical_accuracy.png`
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (row.status === "FAILED") {
      getTrainingStatus(row.task_id);
    } else if (row.status === "FINISHED") {
      getDatasetId(row.model);
    }
  }, [row.status, row.task_id, row.model]);

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>
        Training {row.id} {row.description}
      </DialogTitle>
      <DialogContent>
        <p>
          Epochs/ Batch Size: {row.epochs}/{row.batch_size}
        </p>
        <p>Started at: {row.started_at}</p>
        <p>Task_id: {row.task_id}</p>
        <p>Finished at: {row.finished_at}</p>
        {row.status === "FAILED" && (
          <>
            <p>Status: {row.status}</p>
            {traceback && (
              <div
                style={{
                  backgroundColor: "black",
                  color: "white",
                  padding: "10px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {traceback}
              </div>
            )}
          </>
        )}
        {row.status === "FINISHED" && imageUrl && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <img src={imageUrl} alt="training graph" style={{ width: "98%" }} />
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default Popup;
