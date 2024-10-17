import { DataTable } from "@/components/ui/data-table"
import { TModel } from "@/types"
import { APPLICATION_ROUTES, formatDate, roundNumber } from "@/utils";
import { truncateString } from "@/utils";
import { ColumnDef, SortingState, } from "@tanstack/react-table";
import { useState } from "react";
import React from 'react';
import { useNavigate } from "react-router-dom";
import { SortableHeader } from "../components/table-header";
import { TableSkeleton } from "../components/skeletons";



type ModelListProps = {
    models?: TModel[]
    isPending: boolean
}


const columnDefinitions: ColumnDef<TModel>[] = [
    {
        accessorKey: 'id',
        header: ({ column }) => <SortableHeader title={'ID'} column={column} />
    },
    {
        accessorKey: 'name',
        header: 'Model Name',
        cell: ({ row }) => <span title={row.getValue('name')}>{truncateString(row.getValue('name'), 50)}</span>,
    },
    {
        accessorKey: 'user.username',
        header: 'Created by',
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => <SortableHeader title={'Date Created'} column={column} />,
        cell: ({ row }) => {
            return <span>{formatDate(row.getValue('created_at'))}</span>
        },
    },
    {
        accessorKey: 'last_modified',
        header: ({ column }) => <SortableHeader title={'Last Modified'} column={column} />,
        cell: ({ row }) => {
            return <span>{formatDate(row.getValue('last_modified'))}</span>
        },
    },
    {
        accessorKey: 'accuracy',
        header: ({ column }) => <SortableHeader title={'Accuracy (%)'} column={column} />,
        cell: ({ row }) => {
            return <span>{roundNumber(row.getValue('accuracy'))}</span>
        },
    }
]


const ModelListTableLayout: React.FC<ModelListProps> = ({ models, isPending }) => {
    if (isPending) return <TableSkeleton />;
    const [sorting, setSorting] = useState<SortingState>([]);
    const navigate = useNavigate();

    const handleClick = (rowData: TModel) => {
        navigate(`${APPLICATION_ROUTES.MODELS}/${rowData.id}`)
    }
    return (
        <DataTable data={models as TModel[]} columns={columnDefinitions} sorting={sorting} setSorting={setSorting} onRowClick={handleClick} />
    )
}

export default ModelListTableLayout;