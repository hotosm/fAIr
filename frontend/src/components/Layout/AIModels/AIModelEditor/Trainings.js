import React, { useState } from 'react'
import { DataGrid } from '@mui/x-data-grid';
import { Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { useQuery } from 'react-query';
import axios from '../../../../axios'
import Alert from '@material-ui/lab/Alert';
import PublishIcon from '@material-ui/icons/Publish';
import { useNavigate } from 'react-router-dom';
import OSMUser from '../../../Shared/OSMUser';

const DEFAULT_FILTER = {"items":[{"columnField":"created_date","id":8537,"operatorValue":"contains"}],"linkOperator":"and","quickFilterValues":[],"quickFilterLogicOperator":"and"}
const AIModelsList = props => {

    const [error, setError] = useState(null)
    const navigate = useNavigate();
    const getTraingings = async () => {

        try {


            const res = await axios.get(`/training/?model=${props.modelId}`);

            if (res.error)
                setError(res.error.response.statusText);
            else {
                console.log("gettraining", res.data)

                return res.data;
            }
        } catch (e) {
            setError(e)

        } finally {

        }
    };
    const { data, isLoading ,refetch } = useQuery("getTraingings", getTraingings, { refetchInterval: 60000 });

    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        {
            field: 'description',
            headerName: 'Description',
        },
        {
            field: 'started_at',
            headerName: 'Started at',
            minWidth:170,
            valueGetter: (params) => {

                return params.value && new Date(params.value).toLocaleString();
            }
        },
        {
            field: 'finished_at',
            headerName: 'Finished at',
            minWidth:170,
            valueGetter: (params) => {
                return params.value && new Date(params.value).toLocaleString();
            }
            ,
        },
        {
            field: 'created_by',
            headerName: 'User',
            minWidth: 120,
             renderCell: (params) => {
                return  <OSMUser uid={params.value}></OSMUser> 
                ;
            }
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 100,
            renderCell: (params) => {
                return <>{`${params.value}`}</>;
            }
        },
        {
            field: 'accuracy',
            headerName: 'Accuracy',
            minWidth: 150,
            renderCell: (params) => {
                return params.value && params.value;
            }
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 110,
            renderCell: (params) => {
                return <><Tooltip title="Publish Traning" aria-label="Publish">
                <IconButton aria-label="comments"
                
                    onClick={(e) => {
                        console.log("publish action")
                    }}>
                    <PublishIcon />
                </IconButton>
            </Tooltip>
         
            </>
                //  <p>{`${params.row.status} and id ${params.row.id}`}</p>;
            }
        }

    ];

    return <>

        <Grid container padding={2} spacing={2}>
            <Grid item xs={9}>
                <Typography variant="h6" component="div">
                    Model {props.modelId} Trainings
                </Typography>
            </Grid>
            <Grid item xs={3}>
               
            </Grid>
            <Grid item xs={12}>
                <Typography variant="body1" component="div">
                    Description about the list of training for this model 
                </Typography>
            </Grid>
            {error &&
                <Grid item xs={12}>
                    <Alert severity="error">{error}</Alert>

                </Grid>}
            <Grid item xs={12}>
                {isLoading && <p>Loading ... </p>}
                {!isLoading && <div style={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={data}
                        columns={columns}
                        pageSize={10}
                        rowsPerPageOptions={[10]}
                        disableSelectionOnClick
                        onFilterModelChange={(filter)=> { console.log('grid filter',filter); localStorage.setItem('modelTrainingFilter',JSON.stringify(filter)); refetch();}}
                        onSortModelChange={(sorter)=> { console.log('grid sorter',sorter); localStorage.setItem('modelTrainingSorter', JSON.stringify(sorter)); refetch();}}
                        filterModel={localStorage.getItem('modelTrainingFilter') ? JSON.parse(localStorage.getItem('modelTrainingFilter')) : DEFAULT_FILTER}
                        sortModel={localStorage.getItem('modelTrainingSorter')? JSON.parse(localStorage.getItem('modelTrainingSorter')) : []}
                        // TODO: BUG when no filter sorter check
                    />
                </div>}

            </Grid>

        </Grid>
    </>;
}

export default AIModelsList;