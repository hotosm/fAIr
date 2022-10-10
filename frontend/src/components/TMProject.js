import LoadingButton from '@mui/lab/LoadingButton';
import { Alert, AlertTitle, Grid, TextField, Typography } from '@mui/material';
import React, { useState } from 'react'

import ImportExportIcon from '@mui/icons-material/ImportExport';
import { useMutation } from 'react-query';
import axios from '../axios'
const TMProject = props =>
{

    const TM_API = process.env.REACT_APP_TM_API;
    const [projectId, setProjectId] = useState("11999")
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState(false)
    const getTMProjectTasks = async (projectId) =>
    {

        try {
            setSuccess(false)
            setError(false)
            const res = await axios.get(TM_API.replace("PROJECT_ID",projectId));
      
            console.log(res)
            if (res.error) {
                    setError(res.error.response.data.Error);
                    return;
                }

            props.addtoMap(res.data)
            setSuccess(true)
            return res.data;
          } catch (e) {
            console.log("isError");
            setError(e);
          } finally {
          
          }
    }

    const { mutate, data, isLoading } = useMutation(getTMProjectTasks);

    const getTMProjectTasksHandler = e =>
    {
        mutate(projectId);
    }
    return <>
    <Grid item md={12}>
        <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
         Import TM Project Validated Tasks
        </Typography>
        <Grid item md={12} padding={1}>
            <TextField
              id="tasking-manager-project-id"
              label="TM Project Id"
              helperText="Project id, e.g. 11999"
            
              type="number"
              value={projectId}
              fullWidth
              onChange={(e) => {
                setProjectId(e.target.value)
                setSuccess(false)
              }}
            />
          </Grid>
          <Grid item md={12} padding={1}>
            <LoadingButton
              onClick={getTMProjectTasksHandler}
              endIcon={<ImportExportIcon  />}
               loading={isLoading}
              loadingPosition="end"
              variant="contained"
              disabled={true}

            >
              Import
            </LoadingButton>
            
          </Grid>
          <Grid item md={12} padding={1}>
          <Alert severity="info" >
                <AlertTitle>Importing validated tasks from HOT Tasking Manager ptoject is still an idea</AlertTitle>
               
              </Alert>
          </Grid>
          <Grid item md={12} padding={1}>
             {error && <Alert severity="error" onClose={() => {setError(false)}} >
                <AlertTitle>Error</AlertTitle>
                {error}                
              </Alert>}
          {success &&
           <Alert severity="success" onClose={() => {
               setSuccess(false)
               setProjectId("")
               }}>
                <AlertTitle>Success</AlertTitle>
               All validated tasks in Project id # <a target="_blank" href={"https://tasks.hotosm.org/projects/"+projectId+"/tasks"}>{projectId}</a> have been added to the AOIs
              </Alert>}
               </Grid>
    </Grid>
    </>;
}

export default TMProject;