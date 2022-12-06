import { AppBar, FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, Typography } from '@mui/material';
import React from 'react'
import MapActions from './MapActions';

const DatasetEditorHeader = props => {


    return <>
        <AppBar position="fixed" className='dataset-editor-header MuiAppBar-root2' >
            <Grid container padding={2}>

                <Grid item xs={3} height={50} >
                    <Typography variant="h6" component="h2" >{props.dsName }</Typography>
                </Grid>

                <Grid item xs={3}>
                <Typography variant="body1" component="h2" >Zoom: {props.zoom && +props.zoom.toFixed(1)}
               
                        <br />
                        {"Editing " + props.editMode}
                        </Typography>
                </Grid>
                <Grid item xs={3} className="switcher-margin">
                <FormControl component="fieldset">
      <RadioGroup row aria-label="position" name="selectedLayer" defaultValue="aoi" onChange={(e)=>
    {
        console.log("changed",e)
        props.setEditMode(e.target.value)
        if (e.target.value === "aoi") {
            // console.log("leaflet-bar a",document.querySelectorAll(".leaflet-bar a"))

            document.querySelectorAll(".leaflet-bar a").forEach(e => {
                e.style.backgroundColor = "rgb(51, 136, 255)"
                console.log("leaflet-bar a", e.style)

            })
        }
        else {
            console.log("leaflet-bar a", document.querySelectorAll(".leaflet-bar a"))

            document.querySelectorAll(".leaflet-bar a").forEach(e => {
                e.style.backgroundColor = "#D73434"
                console.log("leaflet-bar a", e.style)
            })
        }
    }}>
        <FormControlLabel
          value="aoi"
          control={<Radio color="primary"  className='small-radio-aoi'/>}
          label="AOIs"
          labelPlacement="top"
          
          
        />
         <FormControlLabel
          value="label"
          control={<Radio color="primary" className='small-radio-label' />}
          label="Labels"
          labelPlacement="top"
          
        />        
       
      </RadioGroup>
    </FormControl>

                    {/* <select defaultValue="aoi" id="selectedLayer" onChange={
                        (e) => {
                            props.setEditMode(e.target.value)
                            if (e.target.value === "aoi") {
                                // console.log("leaflet-bar a",document.querySelectorAll(".leaflet-bar a"))

                                document.querySelectorAll(".leaflet-bar a").forEach(e => {
                                    e.style.backgroundColor = "rgb(51, 136, 255)"
                                    console.log("leaflet-bar a", e.style)

                                })
                            }
                            else {
                                console.log("leaflet-bar a", document.querySelectorAll(".leaflet-bar a"))

                                document.querySelectorAll(".leaflet-bar a").forEach(e => {
                                    e.style.backgroundColor = "#D73434"
                                    console.log("leaflet-bar a", e.style)
                                })
                            }
                        }
                    }>
                        <option value="label">Labels</option>
                        <option value="aoi">AOIs</option>
                    </select> */}
                    </Grid>
                    <Grid item xs={3}>
                    
                            <MapActions oamImagery={props.oamImagery} mapLayersLength={props.mapLayersLength}></MapActions>
                    
                </Grid>
               
            </Grid>
        </AppBar>
    </>;
}

export default DatasetEditorHeader;