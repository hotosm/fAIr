import { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { SortableHeader } from "@/features/models/components/table-header";
import { TableSkeleton } from "@/features/models/components/skeletons";
import { TOfflinePrediction } from "@/types";
import { useState } from "react";
import {
  formatDate,
  formatDuration,
  roundNumber,
  truncateString,
} from "@/utils";

import { TrainingStatusBadge } from "@/components/shared/training-status-badge";

import { ToolTip } from "@/components/ui/tooltip";
// import { Badge } from "@/components/ui/badge";
// import { Image } from "@/components/ui/image";
// import { MapSwipeLogo } from "@/assets/svgs";
// import { ToolTip } from "@/components/ui/tooltip";

import { OfflinePredictionsSettingsInfo } from "@/features/offline-predictions/components/offline-predictions-settings-info";
import { OfflinePredictionActions } from "@/features/offline-predictions/components/offline-predictions-actions";
import { MapSwipeProjectIsActive } from "@/features/offline-predictions/components/mapswipe-project-active";

type OfflinePredictionsTableProps = {
  data: TOfflinePrediction[];
  isError: boolean;
  isPending: boolean;
  handleTrainingLogsModal: (taskId: string) => void;
  handlePredictionResultModal: (prediction: TOfflinePrediction) => void;
  handleCreateOrViewMapSwipeProject: (prediction: TOfflinePrediction) => void;
};

const columnDefinitions = (
  handleTrainingLogsModal: (taskId: string) => void,
  handlePredictionResultModal: (prediction: TOfflinePrediction) => void,
  handleCreateOrViewMapSwipeProject: (prediction: TOfflinePrediction) => void,
): ColumnDef<TOfflinePrediction>[] => [
<<<<<<< HEAD
<<<<<<< HEAD
    {
      accessorKey: "id",
      header: ({ column }) => <SortableHeader title={"ID"} column={column} />,
    },
    {
      header: "Prediction Name",
      accessorFn: (row) =>
        row.description && row.description.length > 0 ? row.description : "-",
      cell: (row) => {
        const value = row.getValue() as string;
        return (
          <ToolTip content={value}>
            <span className="flex items-center gap-x-2 max-w-[200px] truncate">
              {truncateString(value)}
            </span>
          </ToolTip>
        );
      },
    },
    {
      accessorKey: "created_at",
      accessorFn: (row) =>
        row.created_at !== null ? formatDate(row.created_at) : "-",
      header: "Date Submitted",
      cell: (row) => {
        return <span>{row.getValue() as string}</span>;
      },
    },
    {
      accessorFn: (row) => row.config.zoom_level,
      header: "Zoom Level",
      cell: (row) => {
        return <span>{row.getValue() as string}</span>;
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => <TrainingStatusBadge status={row.getValue() as string} />,
    },
    {
      header: "Duration",
      accessorFn: (row) =>
        row.finished_at && row.started_at
          ? formatDuration(new Date(row.started_at), new Date(row.finished_at))
          : "-",
      cell: (row) => (
        <span title={row.getValue() as string}>{row.getValue() as string}</span>
      ),
    },
    {
      header: "Detected Features",
      accessorKey: "result_count",
      cell: (row) => (
        <span title={row.getValue() as string}>
          {roundNumber(row.getValue() as number)}
=======
  {
            accessorKey: "id",
          header: ({column}) => <SortableHeader title={"ID"} column={column} />,
  },
          {
            header: "Prediction Name",
    accessorFn: (row) =>
      row.description && row.description.length > 0
          ? truncateString(row.description)
          : "-",
    cell: (row) => {
      return (
          <span className="flex items-center gap-x-2">
            {row.getValue() as string}{" "}
>>>>>>> 96253ddb (chore: formatting)
          </span>
      );
    },
<<<<<<< HEAD
    // {
    //   header: "MapSwipe",
    //   accessorKey: "result_count",
    //   cell: (row) => (
    //     <span className="flex items-center justify-start">
    //       {row.row.original.mapswipe_id ? (
    //         <ToolTip
    //           content={"A MapSwipe project is associated with this prediction. Click on 'actions"}
    //         >
    //           <Image
    //             src={MapSwipeLogo}
    //             className="icon lg:icon-lg"
    //             alt="MapSwipe Icon"
    //           />
    //         </ToolTip>
    //       ) : "-"}
    //     </span>
    //   ),
    // },
    {
      header: "Info",
      cell: ({ row }: { row: any }) => (
        <OfflinePredictionsSettingsInfo predictionConfig={row.original.config} />
      ),
    },
    {
      header: "Actions",
      cell: ({ row }: { row: any }) => (
        <OfflinePredictionActions
          handlePredictionResultModal={handlePredictionResultModal}
          handleTrainingLogsModal={handleTrainingLogsModal}
          predictionResult={row.original}
          handleCreateOrViewMapSwipeProject={handleCreateOrViewMapSwipeProject}
        />
      ),
    },
  ];
=======
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader title={"ID"} column={column} />,
  },
  {
    header: "Prediction Name",
    accessorFn: (row) =>
      row.description && row.description.length > 0
        ? truncateString(row.description)
        : "-",
  },

  {
    accessorKey: "created_at",
    accessorFn: (row) =>
      row.created_at !== null ? formatDate(row.created_at) : "-",
    header: "Date Submitted",
    cell: (row) => {
      return <span>{row.getValue() as string}</span>;
    },
  },
  {
    accessorFn: (row) => row.config.zoom_level,
    header: "Zoom Level",
    cell: (row) => {
      return <span>{row.getValue() as string}</span>;
    },
  },
  {
=======
  },

  {
    accessorKey: "created_at",
    accessorFn: (row) =>
      row.created_at !== null ? formatDate(row.created_at) : "-",
    header: "Date Submitted",
    cell: (row) => {
      return <span>{row.getValue() as string}</span>;
    },
  },
  {
    accessorFn: (row) => row.config.zoom_level,
    header: "Zoom Level",
    cell: (row) => {
      return <span>{row.getValue() as string}</span>;
    },
  },

  {
>>>>>>> 96253ddb (chore: formatting)
header: "Status",
  accessorKey: "status",
    cell: (row) => <TrainingStatusBadge status={row.getValue() as string} />,
  },
{
  header: "Duration",
    accessorFn: (row) =>
      row.finished_at && row.started_at
        ? formatDuration(new Date(row.started_at), new Date(row.finished_at))
        : "-",
      cell: (row) => (
        <span title={row.getValue() as string}>{row.getValue() as string}</span>
      ),
  },
{
<<<<<<< HEAD
=======
    header: "Detected Features",
    accessorKey: "result_count",
    cell: (row) => (
      <span title={row.getValue() as string}>
        {roundNumber(row.getValue() as number)}
      </span>
    ),
  },
  {
>>>>>>> 96253ddb (chore: formatting)
  header: "MapSwipe",
    accessorKey: "result_count",
      cell: (row) => (
        <MapSwipeProjectIsActive
          MapSwipeId={row.row.original.mapswipe_id as string}
        />
      ),
  },
{
  header: "Info",
    cell: ({ row }: { row: any }) => (
      <OfflinePredictionsSettingsInfo predictionConfig={row.original.config} />
    ),
  },
{
  header: "Actions",
    cell: ({ row }: { row: any }) => (
      <OfflinePredictionActions
        handlePredictionResultModal={handlePredictionResultModal}
        handleTrainingLogsModal={handleTrainingLogsModal}
        predictionResult={row.original}
        handleCreateOrViewMapSwipeProject={handleCreateOrViewMapSwipeProject}
      />
    ),
  },
];
<<<<<<< HEAD
>>>>>>> 7c4f2468 (feat: wip with mapswipe integration)
=======
>>>>>>> 96253ddb (chore: formatting)

const OfflinePredictionsTable: React.FC<OfflinePredictionsTableProps> = ({
  data,
  isPending,
  isError,
  handleTrainingLogsModal,
  handlePredictionResultModal,
  handleCreateOrViewMapSwipeProject,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  if (isPending || isError) return <TableSkeleton />;

  return (
    <div className="max-w-full overflow-auto min-h-screen">
      <DataTable
        // @ts-ignore
        data={data as TOfflinePrediction[]}
        columns={columnDefinitions(
          handleTrainingLogsModal,
          handlePredictionResultModal,
          handleCreateOrViewMapSwipeProject,
        )}
        sorting={sorting}
        setSorting={setSorting}
      />
    </div>
  );
};

export default OfflinePredictionsTable;
