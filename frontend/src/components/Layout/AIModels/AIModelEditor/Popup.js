import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import axios from "../../../../axios";

const Popup = ({ open, handleClose, row }) => {
  const [error, setError] = useState(null);
  const [traceback, setTraceback] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const renderTraceback = () => {
    if (!traceback) {
      return null;
    }

    return traceback.split("\n").map((line, index) => (
      <div key={index} style={{ display: "flex" }}>
        <span style={{ color: "gray", marginRight: "1em" }}>{index + 1}.</span>
        <span style={{ whiteSpace: "nowrap" }}>{line}</span>
      </div>
    ));
  };

  useEffect(() => {
    setLoading(true);
    if (row.status === "FAILED" || row.status === "RUNNING") {
      getTrainingStatus(row.task_id).finally(() => setLoading(false));
    } else if (row.status === "FINISHED") {
      getDatasetId(row.model).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [row.status, row.task_id, row.model]);

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>
        Training {row.id} {row.description}
      </DialogTitle>
      <DialogContent>
        <p>
          <b>Epochs / Batch Size:</b> {row.epochs}/{row.batch_size}
        </p>
        <p>
          <b>Source Image (TMS): </b>
          {row.source_imagery}
        </p>

        <p>
          <b>Task Id:</b> {row.task_id}
        </p>
        <p>
          <b>Zoom Level:</b>{" "}
          {typeof row.zoom_level === "string"
            ? row.zoom_level
                .split(",")
                .reduce((acc, cur, i) => (i % 2 ? acc + ", " + cur : acc + cur))
            : row.zoom_level.toString()}
        </p>
        <p>
          <b>Accuracy:</b> {row.accuracy}
        </p>
        <p>
          <b>Status:</b> {row.status}
        </p>
        {(row.status === "FAILED" || row.status === "RUNNING") && (
          <>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <CircularProgress />
              </div>
            ) : (
              traceback && (
                <div
                  style={{
                    backgroundColor: "black",
                    color: "white",
                    padding: "10px",
                    fontSize: "12px",
                    whiteSpace: "pre-wrap",
                    fontFamily: "monospace",
                    overflow: "auto",
                  }}
                >
                  {renderTraceback()}
                </div>
              )
            )}
          </>
        )}
        {row.status === "FINISHED" && (
          <>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <CircularProgress />
              </div>
            ) : (
              imageUrl && (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <img
                    src={imageUrl}
                    alt="training graph"
                    style={{ width: "98%" }}
                  />
                </div>
              )
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} style={{ color: "white" }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Popup;
