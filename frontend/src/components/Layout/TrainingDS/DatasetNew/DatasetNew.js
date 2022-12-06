import Alert from '@material-ui/lab/Alert'
import { Button, Grid, TextField, Typography } from '@mui/material'
import React, { useState } from 'react'
import SaveIcon from '@material-ui/icons/Save';
import { useMutation } from 'react-query';
import axios from "../../../../axios"
import { useNavigate } from 'react-router-dom';
const DatasetNew = props =>
{

    const [error, setError] = useState(null)
    const [DSName, setDSName] = useState("")
    const navigate = useNavigate();

    const saveDataset = async () => {
        try {
         
        const body = {
            "name": DSName,
            "created_by": 0,            
            "status": 0
          }

          const res = await axios.post("/dataset/" , body);
    
          if (res.error) 
            setError(res.error.response.statusText);
        
            console.log("/training-datasets/",res)
            navigate(`/training-datasets/${res.data.id}` )

          return res.data;
        } catch (e) {
          console.log("isError");
          setError(JSON.stringify(e));
        } finally {
          
        }
      };
      const { mutate,  isLoading} = useMutation(saveDataset);

      
    return <>
    <div style={{height: "600px",  }} >
            <Grid container padding={2} spacing={2}>
            <Grid item xs={12}>
                <Typography variant="h6" component="div">
                    Create New Training Dataset
                </Typography>
            </Grid>
            
            <Grid item xs={12}>
                <Typography variant="body1" component="div">
                    Enter a name that represents the training datasets. It is recommedned to use a local name of the are where the training dataset exists
                </Typography>
            </Grid>
           
           <Grid item xs={12} md={9} padding={1}>
            <TextField
              id="ds-name"
              label="Name"
              helperText="Maximum 256 characters"
            
              type="text"
              value={DSName}
              fullWidth
              onChange={(e) => {
                setDSName(e.target.value)
                
              }}
              error={DSName.trim() === ""}
            />
          </Grid>
            {error &&
                <Grid item xs={12}>
                    <Alert severity="error">{error}</Alert>

                </Grid>}
                <Grid item xs={3}>
                <Grid container justifyContent="flex-end">

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={()=> {
                            console.log("save")
                            mutate()
                        }}
                        disabled={DSName.trim() === "" || isLoading}
                        
                    >
                        Create New
                    </Button>
                </Grid>

            </Grid>
            

        </Grid>
    </div>
   
        </>
}

export default DatasetNew;