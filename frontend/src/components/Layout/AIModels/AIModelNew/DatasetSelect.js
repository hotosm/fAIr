import React, { useState, useEffect } from "react";
import { Grid, Select, MenuItem, FormControl, InputLabel } from "@mui/material";

function DatasetSelect(props) {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(props.datasetID || "");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/v1/dataset/")
      .then((response) => response.json())
      .then((data) => {
        setDatasets(data);
      })
      .catch((error) => console.error(error));
  }, []);

  const handleDatasetChange = (event) => {
    const datasetID = event.target.value;
    setSelectedDataset(datasetID);
    props.onSelect(datasetID);
  };

  return (
    <Grid>
      <FormControl fullWidth>
        <InputLabel id="dataset-select-label">Dataset</InputLabel>
        <Select
          labelId="dataset-select-label"
          id="dataset-select"
          value={selectedDataset}
          onChange={handleDatasetChange}
          error={!selectedDataset}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {datasets.map((dataset) => (
            <MenuItem key={dataset.id} value={dataset.id}>
              {dataset.id}: {dataset.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
  );
}
export default DatasetSelect;
