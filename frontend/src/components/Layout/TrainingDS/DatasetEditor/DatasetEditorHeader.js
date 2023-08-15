import {
  AppBar,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import React from "react";
import MapActions from "./MapActions";

const DatasetEditorHeader = (props) => {
  return (
    <>
      <Grid className="card">
        <Typography variant="h6" component="h2">
          Dataset {props.dsId} : {props.dsName}
        </Typography>

        <Typography variant="body1" component="h2">
          Zoom: {props.zoom && +props.zoom.toFixed(1)}
        </Typography>
        {/* <Grid item xs={3}>
          <FormControl component="fieldset">
            <RadioGroup
              row
              aria-label="position"
              name="selectedLayer"
              defaultValue="aoi"
              onChange={(e) => {
                console.log("changed", e);
                props.setEditMode(e.target.value);
                if (e.target.value === "aoi") {
                  // console.log("leaflet-bar a",document.querySelectorAll(".leaflet-bar a"))

                  document.querySelectorAll(".leaflet-bar a").forEach((e) => {
                    e.style.backgroundColor = "rgb(51, 136, 255)";
                    console.log("leaflet-bar a", e.style);
                  });
                } else {
                  console.log(
                    "leaflet-bar a",
                    document.querySelectorAll(".leaflet-bar a")
                  );

                  document.querySelectorAll(".leaflet-bar a").forEach((e) => {
                    e.style.backgroundColor = "#D73434";
                    console.log("leaflet-bar a", e.style);
                  });
                }
              }}
            >
           
            </RadioGroup>
          </FormControl>
        </Grid> */}

        <MapActions></MapActions>
      </Grid>
    </>
  );
};

export default DatasetEditorHeader;
