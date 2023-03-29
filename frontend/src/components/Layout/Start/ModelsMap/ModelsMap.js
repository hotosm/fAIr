import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Grid, IconButton, Tooltip, Typography } from "@mui/material";
import { useQuery } from "react-query";
import axios from "../../../../axios";

import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import OSMUser from "../../../Shared/OSMUser";
import TrainingMap from "./TrainingMap";
import DatasetMap from "./DatasetMap";
const PublishedAIModelsList = (props) => {
  const [error, setError] = useState(null);

  const getPublishedModels = async () => {
    try {
      const res = await axios.get("/model/?status=0");

      if (res.error) setError(res.error.response.statusText);
      else return res.data;
    } catch (e) {
      setError(e);
    }
  };

  const { data: publishedModels, isLoading } = useQuery(
    "getPublishedModels",
    getPublishedModels
  );
  const navigate = useNavigate();

  const columns = [
    { field: "id", headerName: "ID" },
    { field: "name", headerName: "Name" },
    {
      field: "last_modified",
      headerName: "Last Modified",
      minWidth: 170,
      valueGetter: (params) => {
        return params.value && new Date(params.value).toLocaleString();
      },
    },

    {
      field: "dataset_name",
      headerName: "Dataset",
      minWidth: 170,
      renderCell: (params) => {
        return <TrainingMap datasetId={params.row.dataset}></TrainingMap>;
      },
    },
    {
      field: "training_desc",
      headerName: "Training",
      minWidth: 250,
      renderCell: (params) => {
        return (
          <DatasetMap trainingId={params.row.published_training}></DatasetMap>
        );
      },
    },
    {
      field: "created_by",
      headerName: "Created By",
      minWidth: 120,
      renderCell: (params) => {
        return <OSMUser uid={params.value}></OSMUser>;
      },
    },

    {
      field: "actions",
      headerName: "Actions",
      minWidth: 160,
      renderCell: (params) => {
        return (
          <>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                navigate("/start-mapping/" + params.id);
              }}
            >
              Start Mapping
            </Button>
          </>
        );
      },
    },
  ];

  return (
    <>
      <Grid container padding={2} spacing={2}>
        <Grid item xs={9}>
          <Typography variant="h6" component="div">
            Published Models
          </Typography>
        </Grid>
        <Grid item xs={12}>
          {isLoading && <p>Loading ... </p>}
          {!isLoading && (
            <div style={{ height: 600, width: "100%" }}>
              <DataGrid
                rows={publishedModels}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10]}
                disableSelectionOnClick
              />
            </div>
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default PublishedAIModelsList;
