import React, { useContext, useState } from 'react'
import LoadingButton from "@mui/lab/LoadingButton";

import ImportExportIcon from '@mui/icons-material/ImportExport';
import axios from '../../../../axios'
import { useMutation } from 'react-query';
import { Checkbox, FormControlLabel, FormGroup, Grid, Tooltip } from '@mui/material';
import { useParams } from 'react-router-dom';
import AuthContext from '../../../../Context/AuthContext';

const MapActions = props => {

  const [error, setError] = useState(false)
  const  { id: datasetId } = useParams();
  const [selectedZooms, setSelectedZooms] = useState([])
  const {accessToken} = useContext(AuthContext)
  const handleCheckZoom = e =>
  {
    let temp = [];
    if (e.target.checked)
    {      
      [19,20,21].forEach(element => {
        if (element <= +e.target.value )
        temp.push(element)
      });
      setSelectedZooms(temp)
    }
    else
    {
      [19,20,21].forEach(element => {
        if (element < +e.target.value )
        temp.push(element)
      });
      setSelectedZooms(temp)
    }
    console.log("handleCheckZoom",e.target.checked,e.target.value,selectedZooms)
  }
  const downloadDS = async () => {

    try {

      const body =
      {
        dataset_id: datasetId,
        source: props.oamImagery.url,
        zoom_level: selectedZooms
      }
      console.log('body',body)
      setError(false)
      const headers = {
        "access-token": accessToken
      }
      const res = await axios.post("/dataset/image/build/", body,{headers});

      console.log(res)
      if (res.error) {
        setError(res.error.response.data.Error);
        return;
      }

      return res.data;
    } catch (e) {
      console.log("isError");
      setError(e);
    } finally {

    }
  }

  const { mutate, data, isLoading } = useMutation(downloadDS);

  return <>
    {/* { JSON.stringify(props.oamImagery) } */}
    {/* <br/> */}
    {/* <p>{JSON.stringify(selectedZooms)}</p> */}
    <Grid container >

      <Grid item xs={4} md={4} className="margin-checkbox">
      <Grid container justifyContent="flex-end">
      <FormGroup aria-label="position" >     
      <Tooltip title="Check to download imagery on zoom 19" arrow>
          <FormControlLabel
          value="19"
          control={<Checkbox color="primary" className='small-checkbox'/>}
          label="19"
          labelPlacement="end"
          defaultChecked
          checked={selectedZooms.includes(19)}
          onChange={handleCheckZoom}
        />
        </Tooltip>
        <FormControlLabel
          value="20"
          control={<Checkbox color="primary" className='small-checkbox'/>}
          label="20"
          labelPlacement="end"
          defaultChecked
          checked={selectedZooms.includes(20)}
          onChange={handleCheckZoom}
        />
         <FormControlLabel
          value="21"
          control={<Checkbox color="primary" className='small-checkbox'/>}
          label="21"
          labelPlacement="end"
          defaultChecked
          checked={selectedZooms.includes(21)}
          onChange={handleCheckZoom}
         
        />
      </FormGroup>
      </Grid>
      </Grid>
      <Grid item xs={8} md={8}>
        
          <LoadingButton
            onClick={(e) => { console.log("Build"); mutate() }}
            endIcon={<ImportExportIcon />}
            loading={isLoading}
            loadingPosition="end"
            variant="contained"
            disabled={props.oamImagery === null || selectedZooms.length === 0 || props.mapLayersLength === 0}
          >
            Sync Dataset
          </LoadingButton>
          <br />
          {error && error}
       
      </Grid>

    </Grid>
  </>


}
export default MapActions;