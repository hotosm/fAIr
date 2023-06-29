import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Button,
  Container,
  Grid,
  IconButton,
  Link,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQuery } from "react-query";
import axios from "../../../../axios";
import Alert from "@material-ui/lab/Alert";
import EditIcon from "@material-ui/icons/Edit";
import AddIcon from "@material-ui/icons/Add";
import { useNavigate } from "react-router-dom";
import ArchiveIcon from "@material-ui/icons/Archive";
import { modelStatus } from "../../../../utils";
import OSMUser from "../../../Shared/OSMUser";

const DEFAULT_FILTER = {
  items: [{ columnField: "created_date", id: 8537, operatorValue: "contains" }],
  linkOperator: "and",
  quickFilterValues: [],
  quickFilterLogicOperator: "and",
};
const AIModelsList = (props) => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const getModels = async () => {
    try {
      const res = await axios.get("/model");

      if (res.error) setError(res.error.response.statusText);
      else {
        // console.log("getmodel", res.data);

        return res.data;
      }
    } catch (e) {
      setError(e);
    } finally {
    }
  };
  const { data, isLoading, refetch } = useQuery("getModels", getModels, {
    refetchInterval: 60000,
  });

  const columns = [
    { field: "id", headerName: "ID", width: 90 },
    {
      field: "name",
      headerName: "Name",
      width: 250,
      renderCell: (params) => {
        return (
          <Tooltip title={params.value} placement="right">
            <span>{params.value}</span>
          </Tooltip>
        );
      },
    },
    {
      field: "created_at",
      headerName: "Created at",
      minWidth: 170,
      valueGetter: (params) => {
        return params.value && new Date(params.value).toLocaleString();
      },
    },
    {
      field: "last_modified",
      headerName: "Last modified at",
      minWidth: 170,
      valueGetter: (params) => {
        return params.value && new Date(params.value).toLocaleString();
      },
    },
    {
      field: "created_by",
      headerName: "User",
      minWidth: 120,
      renderCell: (params) => {
        return <OSMUser uid={params.value}></OSMUser>;
      },
    },
    {
      field: "dataset",
      headerName: "Dataset ID",
      width: 150,

      renderCell: (params) => {
        return <span> {params.value}</span>;
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (params) => {
        return <>{`${modelStatus(params.value)}`}</>;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 110,
      renderCell: (params) => {
        return (
          <>
            <Tooltip title="Edit Model and View Trainings" aria-label="Edit">
              <IconButton
                aria-label="comments"
                onClick={(e) => {
                  navigate(`/ai-models/${params.row.id}`);
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Archive Model" aria-label="Archive">
              <IconButton
                aria-label="comments"
                className="margin1"
                onClick={(e) => {
                  console.log("call Archive");
                }}
              >
                <ArchiveIcon />
              </IconButton>
            </Tooltip>
          </>
        );
        //  <p>{`${params.row.status} and id ${params.row.id}`}</p>;
      },
    },
  ];

  return (
    <>
      <Grid container padding={2} spacing={2}>
        <Grid item xs={9}>
          <Typography variant="h6" component="div">
            fAIr AI Models
          </Typography>
        </Grid>
        <Grid item xs={3}>
          <Grid container justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                navigate("/ai-models/new");
              }}
            >
              Create New
            </Button>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1" component="div">
            Each model is trained using a specific training data and has a
            status. Published Models can be used to predect features on the same
            imagery used in the training dataset.
          </Typography>
        </Grid>
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}
        {localStorage.getItem("modelFilter") !== null &&
          JSON.parse(localStorage.getItem("modelFilter")).items.length > 0 &&
          JSON.parse(localStorage.getItem("modelFilter")).items[0].value && (
            <Grid item xs={12}>
              <Grid container justifyContent="flex-end">
                <Alert severity="info">
                  Below list is filtered, click{" "}
                  <Link
                    href="#"
                    color="inherit"
                    onClick={(e) => {
                      e.preventDefault();
                      localStorage.setItem(
                        "modelFilter",
                        JSON.stringify(DEFAULT_FILTER)
                      );
                      refetch();
                    }}
                  >
                    here
                  </Link>{" "}
                  to show all models
                </Alert>
              </Grid>
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
                  localStorage.setItem("modelFilter", JSON.stringify(filter));
                  refetch();
                }}
                onSortModelChange={(sorter) => {
                  console.log("grid sorter", sorter);
                  localStorage.setItem("modelSorter", JSON.stringify(sorter));
                  refetch();
                }}
                filterModel={
                  localStorage.getItem("modelFilter")
                    ? JSON.parse(localStorage.getItem("modelFilter"))
                    : DEFAULT_FILTER
                }
                sortModel={
                  localStorage.getItem("modelSorter")
                    ? JSON.parse(localStorage.getItem("modelSorter"))
                    : []
                }
                // TODO: BUG when no filter sorter check
              />
            </div>
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default AIModelsList;
