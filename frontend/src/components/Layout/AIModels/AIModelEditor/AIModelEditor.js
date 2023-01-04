import { Alert, Button, Grid, TextField, Typography } from '@mui/material';
import React, { useContext, useState } from 'react'
import { useParams } from 'react-router-dom';
import { modelStatus } from '../../../../utils';
import axios from '../../../../axios'
import { useMutation, useQuery } from 'react-query';
import OSMUser from '../../../Shared/OSMUser';
import SaveIcon from '@material-ui/icons/Save';
import AuthContext from '../../../../Context/AuthContext';
import Trainings from './Trainings';
const AIModelEditor = props => {

    let { id } = useParams();
    const [error, setError] = useState(null)
    const [epochs, setEpochs] = useState(20)
    const [batchSize, setBatchSize] = useState(8)
    const [description, setDescription] = useState("")
    const { accessToken } = useContext(AuthContext)
    const getModelById = async () => {

        try {

            const modelId = +id;
            const res = await axios.get(`/model/${modelId}`);
            if (res.error)
                setError(res.error.response.statusText);
            else {
                console.log("getmodel", res.data)
                return res.data;
            }
        } catch (e) {
            setError(e)

        } finally {

        }
    };
    const { data, isLoading, refetch } = useQuery("getModelById", getModelById, { refetchInterval: 60000 });

    const saveTraining = async () => {
        try {

            const body = {
                "epochs": epochs,
                "batch_size": batchSize,
                "model": id,
                "description": description
            }
            const headers = {
                "access-token": accessToken
            }
            const res = await axios.post("/training/", body, { headers });

            if (res.error) {
                setError(res.error.response.statusText + " / " + JSON.stringify(res.error.response.data));
                return
            }

            console.log("/training/", res)

            return res.data;
        } catch (e) {
            console.log("isError");
            setError(JSON.stringify(e));
        } finally {

        }
    };
    const { mutate, isLoading: isLoadingSaveTraining } = useMutation(saveTraining);
    return <>
        {data &&
            <Grid container padding={2} spacing={2}>
                <Grid item xs={6} md={6}>
                    <Typography variant="h6" component="div">
                        Model ID: {data.id}
                    </Typography>
                    <Typography variant="h6" component="div">
                        Status: {modelStatus(data.status)}
                    </Typography>
                </Grid>
                <Grid item xs={6} md={6}>
                    <Typography variant="h6" component="div">
                        Name: {data.name}
                    </Typography>
                    <Typography variant="h6" component="div">
                        Created by: {<OSMUser uid={data.created_by}></OSMUser>}
                    </Typography>
                    <Typography variant="h6" component="div">
                        Created on: {data.created_at}
                    </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        id="model-epochs"
                        label="Epochs"
                        helperText={<span>Epochs refers to the number of times the learning algorithm will go through the entire training dataset, recommended between 20 - 60. The higher it is the longer model training takes</span>}

                        type="number"
                        value={epochs}
                        fullWidth
                        onChange={(e) => {
                            setEpochs(+e.target.value)
                        }}
                        error={epochs === null || epochs <= 0}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                <TextField
                        id="model-batch"
                        label="Batch Size"
                        helperText={<span>Batch size refers to number of sample pairs to work through before updating the internal model parameters. 8 is recommended and preferred to be 8, 16, 32 ...etc</span>}

                        type="number"
                        value={batchSize}
                        fullWidth
                        onChange={(e) => {
                            setBatchSize(+e.target.value)
                        }}
                        error={batchSize === null || batchSize <= 0}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                <TextField
                        id="model-description"
                        label="Short Description (optional)"
                        helperText={<span>A short description to document why you submitted this training</span>}

                        type="text"
                        value={description}
                        fullWidth
                        onChange={(e) => {
                            setDescription(e.target.value)
                        }}                       
                    />
                </Grid>
                <Grid item xs={12} md={6}>

                </Grid>
                <Grid item xs={12} md={6}>

                </Grid>
                <Grid item xs={12} md={6}>
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<SaveIcon />}
                        onClick={() => {
                            console.log("save")
                            mutate()
                        }}
                        disabled={epochs <= 0 || batchSize <= 0}

                    >
                        Submit a training request
                    </Button>
                </Grid>
                
                {error &&
                    <Grid item xs={12}>
                        <Alert severity="error">{error}</Alert>

                    </Grid>}
                    <Grid item xs={12}>
                        <Trainings modelId={id}></Trainings>
                    </Grid>
            </Grid>}
    </>;
}
export default AIModelEditor