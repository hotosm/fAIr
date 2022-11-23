import React from 'react'
import { DataGrid } from '@mui/x-data-grid';
import { useDemoData } from '@mui/x-data-grid-generator';


const DatasetList = props =>
{
    const { data } = useDemoData({
        dataSet: 'Commodity',
        rowLength: 10,
        maxColumns: 6,
      });
    return <>
    <p>list</p>
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid
        {...data}
        columns={data.columns.map((column) => ({
          ...column,
          filterable: false,
        }))}
      />
    </div>
    </>;
}

export default DatasetList;