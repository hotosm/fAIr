import Alert from "@material-ui/lab/Alert";
import { Button, Grid, TextField, Typography } from "@mui/material";
import React, { useContext, useState } from "react";
import SaveIcon from "@material-ui/icons/Save";
import { useMutation } from "react-query";
import axios from "../../../../axios";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../../../Context/AuthContext";
const DatasetNew = (props) => {
  const [error, setError] = useState(null);
  const [DSName, setDSName] = useState("");
  const navigate = useNavigate();
  const [oamURL, setOAMURL] = useState();
  const { accessToken } = useContext(AuthContext);
  const regUrl = /^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/;
  const saveDataset = async () => {
    try {
      const body = {
        name: DSName,
        status: 0,
        source_imagery: oamURL,
      };
      const headers = {
        "access-token": accessToken,
      };
      const res = await axios.post("/dataset/", body, { headers });

      if (res.error) setError(res.error.response.statusText);

      console.log("/training-datasets/", res);
      navigate(`/training-datasets/${res.data.id}`);

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
              Create New Training Dataset
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body1" component="div">
              Enter a name that represents the training datasets. It is
              recommedned to use a local name of the area where the training
              dataset exists
            </Typography>
          </Grid>

          <Grid item xs={9} md={9} padding={1}>
            <TextField
              id="ds-name"
              label="Name"
              helperText="Maximum 256 characters"
              type="text"
              value={DSName}
              fullWidth
              onChange={(e) => {
                setDSName(e.target.value);
              }}
              error={DSName.trim() === ""}
            />

            <TextField
              error={!oamURL}
              id="standard-error-helper-text"
              label="TMS Link"
              helperText={
                <>
                  TMS Imagery link should look like this{" "}
                  <strong>
                    {" "}
                    {
                      "https://tiles.openaerialmap.org/ ****/*/***/{z}/{x}/{y}"
                    }{" "}
                  </strong>
                </>
              }
              variant="standard"
              value={oamURL}
              fullWidth
              onChange={(e) => {
                let trimmedValue = e.target.value.trim();
                // let regUrl = /^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/;
                // let endsWithPng =
                //   trimmedValue.endsWith(".png") ||
                //   trimmedValue.endsWith(".jpeg");
                // if (endsWithPng) {
                //   trimmedValue = trimmedValue.slice(0, -4);
                // }
                let hasZXY = trimmedValue.includes("{z}/{x}/{y}");
                let isValid =
                  regUrl.test(trimmedValue) &&
                  hasZXY &&
                  trimmedValue !== "" &&
                  trimmedValue != null;
                setError(!isValid);
                setOAMURL(trimmedValue);
              }}
            />
          </Grid>

          <Grid item xs={3} md={3}>
            <Grid container justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                size="small"
                onClick={() => {
                  console.log("save");
                  mutate();
                }}
                disabled={
                  !oamURL ||
                  !regUrl.test(oamURL) ||
                  DSName.trim() === "" ||
                  !oamURL.includes("{z}/{x}/{y}") ||
                  isLoading
                }
              >
                Create Training Dataset
              </Button>
            </Grid>
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

export default DatasetNew;
