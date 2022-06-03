import {
  Alert,
  AlertTitle,
  Avatar,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import { MapTwoTone, RemoveCircle, ZoomInMap } from "@mui/icons-material";
import LoadingButton from "@mui/lab/LoadingButton";
import SendIcon from "@mui/icons-material/Send";
import { useMutation } from "react-query";
import axios from "../axios";
import { utilAesDecrypt } from "@id-sdk/util";
const TileServerList = (props) => {
  const [error, setError] = useState(false);
  const [inputError, setInputError] = useState(false);
  const [imageryDetails, setImageryDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [oamURL, setOAMURL] = useState("https://tiles.openaerialmap.org/5ac4fc6f26964b0010033112/0/5ac4fc6f26964b0010033113/{z}/{x}/{y}");

  const getImageryDetails = async (url) => {
    try {
     
      setLoading(true);
      setInputError(false);
      const res = await axios.get(url.replace("/{z}/{x}/{y}", ""));

      if (res.error) setInputError(res.error.response.statusText);

      props.addImagery(res.data, url);
      setImageryDetails(res.data);
      return res.data;
    } catch (e) {
      console.log("isError");
      setInputError(e);
    } finally {
      setLoading(false);
    }
  };
  const { mutate, data } = useMutation(getImageryDetails);

  const addImageryHandler = (e) => {
    const template =
      "7586487389962e3f6e31ab2ed8ca321f2f3fe2cf87f1dedce8fc918b4692efd86fcd816ab8a35303effb1be9abe39b1cce3fe6db2c740044364ae68560822c88373d2c784325baf4e1fa007c6dbedab4cea3fa0dd86ee0ae4feeef032d33dcac28e4b16c90d55a42087c6b66526423ea1b4cc7e63c613940eb1c60f48270060bf41c5fcb6a628985ebe6801e9e71f015cf9dd7a76f004360017065667dc1cfe028f1332689e2d001bd06d4ebf019f829f3aac2";
    console.log("utilAesDecrypt(template)", utilAesDecrypt(template));
    mutate(oamURL);
  };

  return (
    <>
      <Grid item md={12}>
        <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
          Open Aerial Imagery
        </Typography>
        <List dense={true}>
          {imageryDetails && (
            <ListItem
              secondaryAction={
                <>
                  <IconButton
                    edge={"end"}
                    aria-label="zoom"
                    onClick={(e) => {
                      props.navigateToCenter(imageryDetails.center);
                    }}
                  >
                    <ZoomInMap />
                  </IconButton>
                  <IconButton
                    edge={"end"}
                    aria-label="delete"
                    onClick={(e) => {
                      console.log("delete imagery");
                      setImageryDetails(null);
                      props.removeImagery();
                    }}
                  >
                    <RemoveCircle />
                  </IconButton>
                </>
              }
            >
              <ListItemAvatar>
                <Avatar>
                  <MapTwoTone />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={imageryDetails.name}
                secondary={
                  "Max zoom:" +
                  imageryDetails.maxzoom +
                  ", Min zoom:" +
                  imageryDetails.minzoom
                }
              />
            </ListItem>
          )}
        </List>
      </Grid>
      {!imageryDetails && (
        <>
          <Grid item md={12} padding={1}>
            <TextField
              error={error}
              id="standard-error-helper-text"
              label="OAM Link"
              helperText={<>Link style should be <strong> {"https://tiles.openaerialmap.org/****/*/***/{z}/{x}/{y}"} </strong></>}
              variant="standard"
              value={
                oamURL
              }
              fullWidth
              onChange={(e) => {
                setInputError(false)
                setOAMURL(e.target.value.trim());
                let regUrl = /^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/;
                
                setError(!regUrl.test(e.target.value.trim()))
              }}
            />
          </Grid>
          <Grid item md={12} padding={1}>
            <LoadingButton
              onClick={addImageryHandler}
              endIcon={<SendIcon />}
              loading={loading}
              loadingPosition="end"
              variant="contained"
              disabled={oamURL.trim() === "" || inputError || error}
            >
              Add
            </LoadingButton>
          </Grid>
          {inputError && (
            <Grid item md={12} padding={1}>
              <Alert severity="error">
                <AlertTitle>Error</AlertTitle>
                {inputError}
              </Alert>
            </Grid>
          )}
        </>
      )}
    </>
  );
};

export default TileServerList;
