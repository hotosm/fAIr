import Alert from "@material-ui/lab/Alert";
import { Button, Grid, TextField, Typography } from "@mui/material";
import React, { useContext, useState } from "react";
import SaveIcon from "@material-ui/icons/Save";
import { useMutation } from "react-query";
import axios from "../../../../axios";
import { useNavigate } from "react-router-dom";
import DatasetSelect from "./DatasetSelect";
import AuthContext from "../../../../Context/AuthContext";
const AIModelNew = (props) => {
  const [error, setError] = useState(null);
  const [modelName, setmodelName] = useState("");

  const [errorDatasetID, setErrorDatasetID] = useState(null);

  const [datasetID, setDatasetID] = useState(0);

  const handleDatasetChange = (id) => {
    setDatasetID(id);
  };

  const navigate = useNavigate();
  const { accessToken } = useContext(AuthContext);
  const saveDataset = async () => {
    try {
      const body = {
        name: modelName,
        dataset: datasetID,
      };
      const headers = {
        "access-token": accessToken,
      };
      const res = await axios.post("/model/", body, { headers });

      if (res.error) {
        setError(
          res.error.response.statusText +
            " / " +
            JSON.stringify(res.error.response.data)
        );
        return;
      }

      console.log("/ai-models/", res);
      navigate(`/ai-models/${res.data.id}`);

      return res.data;
    } catch (e) {
      console.log("isError");
      setError(JSON.stringify(e));
    } finally {
    }
  };

  const { mutate, isLoading } = useMutation(saveDataset);

  return (
    <>
      <div style={{ height: "600px" }}>
        <Grid container padding={2} spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" component="div">
              Create New Local AI Model
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body1" component="div">
              Enter a name that represents the AI model. It is recommedned to
              use a local name of the area where the AI model is trained as
              using the model in similar location might be performing better
            </Typography>
          </Grid>

          <Grid item xs={9} md={9} padding={1}>
            <TextField
              id="ds-name"
              label="Name"
              helperText="Maximum 256 characters"
              type="text"
              value={modelName}
              fullWidth
              onChange={(e) => {
                setmodelName(e.target.value);
              }}
              error={modelName.trim() === ""}
            />
          </Grid>

          <Grid item xs={3} md={3}>
            <Grid container justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<SaveIcon />}
                onClick={() => {
                  console.log("save");
                  mutate();
                }}
                disabled={
                  datasetID === 0 || modelName.trim() === "" || isLoading
                }
              >
                Create AI Model
              </Button>
            </Grid>
          </Grid>
          <Grid item xs={9} md={9} padding={1}>
            <DatasetSelect onSelect={handleDatasetChange} />
          </Grid>
          <Grid item xs={9} md={9} padding={1}>
            <TextField
              id="ds-baseModel"
              label="Base Model"
              helperText="Select the base model, only RAMP is supported so far"
              type="text"
              value={"RAMP"}
              fullWidth
              disabled

              // error={parseInt(datasetID) || datasetID === null || datasetID.trim() === 0}
            />
          </Grid>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
        </Grid>
      </div>
    </>
  );
};

export default AIModelNew;
