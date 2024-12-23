import { DataTable } from "@/components/ui/data-table";
import { TModel } from "@/types";
import { APPLICATION_ROUTES, formatDate, roundNumber } from "@/utils";
import { truncateString } from "@/utils";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { useState } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { SortableHeader } from "@/features/models/components/table-header";
import { TableSkeleton } from "@/features/models/components/skeletons";

type ModelListProps = {
  models?: TModel[];
  isPending: boolean;
  isError: boolean;
};

const columnDefinitions: ColumnDef<TModel>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader title={"ID"} column={column} />,
  },
  {
    accessorKey: "name",
    header: "Model Name",
    cell: ({ row }) => (
      <span title={row.getValue("name")}>
        {truncateString(row.getValue("name"), 50)}
      </span>
    ),
  },
  {
    accessorKey: "user.username",
    header: "Created by",
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <SortableHeader title={"Date Created"} column={column} />
    ),
    cell: ({ row }) => {
      return <span>{formatDate(row.getValue("created_at"))}</span>;
    },
  },
  {
    accessorKey: "base_model",
    header: "Base Model",
    cell: ({ row }) => {
      return <span>{row.getValue("base_model")}</span>;
    },
  },
  {
    accessorKey: "accuracy",
    header: ({ column }) => (
      <SortableHeader title={"Accuracy (%)"} column={column} />
    ),
    cell: ({ row }) => {
      return <span>{roundNumber(row.getValue("accuracy") ?? 0)}</span>;
    },
  },
];

const ModelListTableLayout: React.FC<ModelListProps> = ({
  models,
  isPending,
  isError,
}) => {
  if (isPending || isError) return <TableSkeleton />;
  const [sorting, setSorting] = useState<SortingState>([]);
  const navigate = useNavigate();

  const handleClick = (rowData: TModel) => {
    navigate(`${APPLICATION_ROUTES.MODELS}/${rowData.id}`);
  };
  return (
    <DataTable
      data={models as TModel[]}
      columns={columnDefinitions}
      sorting={sorting}
      setSorting={setSorting}
      onRowClick={handleClick}
    />
  );
};

export default ModelListTableLayout;
