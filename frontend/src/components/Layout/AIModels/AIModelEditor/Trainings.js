import React, { useContext, useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Grid,
  IconButton,
  Tooltip,
  Typography,
  CircularProgress,
} from "@mui/material";

import { useMutation, useQuery } from "react-query";
import axios from "../../../../axios";
import Alert from "@material-ui/lab/Alert";
import PublishIcon from "@material-ui/icons/Publish";
import { useNavigate } from "react-router-dom";
import OSMUser from "../../../Shared/OSMUser";
import { timeSpan } from "../../../../utils";
import TrainingSize from "./TrainingSize";
import Popup from "./Popup";
import InfoIcon from "@mui/icons-material/Info";

import AuthContext from "../../../../Context/AuthContext";
import Feedback from "./Feedback";

const DEFAULT_FILTER = {
  items: [{ columnField: "created_date", id: 8537, operatorValue: "contains" }],
  linkOperator: "and",
  quickFilterValues: [],
  quickFilterLogicOperator: "and",
};
const TrainingsList = (props) => {
  const [error, setError] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [popupRow, setPopupRow] = useState(null);

  const handlePopupOpen = (row) => {
    setPopupOpen(true);
    setPopupRow(row);
  };

  const handlePopupClose = () => {
    setPopupOpen(false);
    setPopupRow(null);
  };
  const getTraingings = async () => {
    try {
      const res = await axios.get(`/training/?model=${props.modelId}`);

      if (res.error) setError(res.error.response.statusText);
      else {
        //console.log("gettraining", res.data);

        return res.data;
      }
    } catch (e) {
      setError(e);
    } finally {
    }
  };
  const { data, isLoading, refetch } = useQuery(
    "getTraingings" + props.modelId,
    getTraingings,
    { refetchInterval: 60000 }
  );

  const columns = [
    { field: "id", headerName: "ID", width: 60, flex: 1 },
    {
      field: "description",
      headerName: "Description",
      flex: 1,
      renderCell: (params) => {
        return (
          <Tooltip title={params.value} placement="right">
            <span>{params.value}</span>
          </Tooltip>
        );
      },
    },
    {
      field: "epochs",
      headerName: "Epochs/Batch Size",
      minWidth: 120,
      flex: 1,
      valueGetter: (params) => {
        return params.row.epochs + "/" + params.row.batch_size;
      },
    },

    {
      field: "started_at",
      headerName: "Started at",
      minWidth: 170,
      flex: 1,
      valueGetter: (params) => {
        return params.value && new Date(params.value).toLocaleString();
      },
    },
    {
      field: "finished_at",
      headerName: "Finished at",
      minWidth: 170,
      flex: 1,
      valueGetter: (params) => {
        return params.value && new Date(params.value).toLocaleString();
      },
    },
    {
      field: "timeSpan",
      headerName: "Time",
      minWidth: 40,
      flex: 1,
      valueGetter: (params) => {
        // console.log("params",params)
        if (params.row.status === "FINISHED") {
          const time =
            timeSpan(params.row.started_at, params.row.finished_at) * 1;
          if (time < 1) return `${(time * 60).toFixed(1)} mins`;
          else return `${time.toFixed(1)} hr(s)`;
        }
      },
    },
    {
      field: "chips_length",
      headerName: "DS size",
      flex: 1,
      renderCell: (params) => {
        return <>{`${params.value === 0 ? "" : params.value}`}</>;
      },
    },
    {
      field: "created_by",
      headerName: "User",
      minWidth: 120,
      flex: 1,
      renderCell: (params) => {
        return <OSMUser uid={params.value}></OSMUser>;
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 50,
      flex: 1,
      renderCell: (params) => {
        return <>{`${params.value}`}</>;
      },
    },
    {
      field: "popup",
      headerName: "Info/Feedback",
      width: 100,
      renderCell: (params) => {
        // console.log("params in info row", params);
        return (
          <div>
            <IconButton
              onClick={() => handlePopupOpen(params.row)}
              aria-label="popup"
            >
              <InfoIcon size="small" />
            </IconButton>
            <Feedback trainingId={params.row.id}></Feedback>
          </div>
        );
      },
    },
    {
      field: "accuracy",
      headerName: "Accuracy",
      minWidth: 80,
      flex: 1,
      renderCell: (params) => {
        return params.value && params.value.toFixed(2);
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 110,
      flex: 1,
      renderCell: (params) => {
        return (
          <>
            {params.row.status === "FINISHED" && (
              <Tooltip title="Publish Traning" aria-label="Publish">
                <IconButton
                  aria-label="comments"
                  onClick={(e) => {
                    console.log("publish action");
                    mutate(params.row.id);
                  }}
                >
                  {publishing ? (
                    <CircularProgress size={24} />
                  ) : (
                    <PublishIcon />
                  )}
                </IconButton>
              </Tooltip>
            )}
          </>
        );
      },
    },
  ];

  useEffect(() => {
    if (props.random) refetch();

    return () => {};
  }, [props.random]);

  const { accessToken } = useContext(AuthContext);
  const publishModel = async (trainingId) => {
    setPublishing(true);
    try {
      const headers = {
        "access-token": accessToken,
      };
      const res = await axios.post(`training/publish/${trainingId}/`, null, {
        headers,
      });

      if (res.error) {
        setError(
          res.error.response.statusText +
            " / " +
            JSON.stringify(res.error.response.data)
        );
        return;
      }
      console.log("Model published", res.data);
      props.refetshModelDetails();
      return res.data;
    } catch (e) {
      console.log("isError");
      setError(JSON.stringify(e));
    } finally {
      setPublishing(false);
    }
  };

  const { mutate } = useMutation(publishModel);
  return (
    <>
      <Grid container padding={2} spacing={2}>
        <Grid item xs={9}>
          <Typography variant="h6" component="div">
            Model {props.modelId} Trainings
          </Typography>
        </Grid>
        <Grid item xs={3}></Grid>
        <Grid item xs={12}>
          <Typography variant="body1" component="div">
            Description about the list of training for this model
          </Typography>
        </Grid>
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}
        <Grid item xs={12}>
          {isLoading && <p>Loading ... </p>}
          {!isLoading && (
            <div style={{ height: 600, width: "100%" }}>
              <DataGrid
                rows={data}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10]}
                disableSelectionOnClick
                onFilterModelChange={(filter) => {
                  console.log("grid filter", filter);
                  localStorage.setItem(
                    "modelTrainingFilter",
                    JSON.stringify(filter)
                  );
                  refetch();
                }}
                onSortModelChange={(sorter) => {
                  console.log("grid sorter", sorter);
                  localStorage.setItem(
                    "modelTrainingSorter",
                    JSON.stringify(sorter)
                  );
                  refetch();
                }}
                filterModel={
                  localStorage.getItem("modelTrainingFilter")
                    ? JSON.parse(localStorage.getItem("modelTrainingFilter"))
                    : DEFAULT_FILTER
                }
                sortModel={
                  localStorage.getItem("modelTrainingSorter")
                    ? JSON.parse(localStorage.getItem("modelTrainingSorter"))
                    : [{ field: "id", sort: "desc" }]
                }
                // TODO: BUG when no filter sorter check
              />
            </div>
          )}
        </Grid>
      </Grid>
      {popupOpen && (
        <Popup open={popupOpen} handleClose={handlePopupClose} row={popupRow} />
      )}
    </>
  );
};

export default TrainingsList;
