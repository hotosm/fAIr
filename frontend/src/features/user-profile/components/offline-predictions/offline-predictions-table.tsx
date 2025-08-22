import { ColumnDef, Row, SortingState } from "@tanstack/react-table";
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
import { OfflinePredictionsSettingsInfo } from "./offline-predictions-settings-info";
import { OfflinePredictionActions } from "./offline-predictions-actions";

type OfflinePredictionsTableProps = {
  data: TOfflinePrediction[];
  isError: boolean;
  isPending: boolean;
  handleTrainingLogsModal: (taskId: string) => void;
  handlePredictionResultModal: (prediction: TOfflinePrediction) => void;
};

const columnDefinitions = (
  handleTrainingLogsModal: (taskId: string) => void,
  handlePredictionResultModal: (prediction: TOfflinePrediction) => void
): ColumnDef<TOfflinePrediction>[] => [
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
    cell: (row) => {
      return (
        <span className="flex items-center gap-x-2">
          {row.getValue() as string}{" "}
        </span>
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
      </span>
    ),
  },
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
    cell: ({ row }: { row: Row<TOfflinePrediction> }) => (
      <OfflinePredictionsSettingsInfo predictionConfig={row.original.config} />
    ),
  },
  {
    header: "Actions",
    cell: ({ row }: { row: Row<TOfflinePrediction> }) => (
      <OfflinePredictionActions
        handlePredictionResultModal={handlePredictionResultModal}
        handleTrainingLogsModal={handleTrainingLogsModal}
        predictionResult={row.original}
      />
    ),
  },
];

const OfflinePredictionsTable: React.FC<OfflinePredictionsTableProps> = ({
  data,
  isPending,
  isError,
  handleTrainingLogsModal,
  handlePredictionResultModal,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  if (isPending || isError) return <TableSkeleton />;

  return (
    <div className="min-h-screen max-w-full overflow-auto">
      <DataTable
        data={data as TOfflinePrediction[]}
        columns={columnDefinitions(
          handleTrainingLogsModal,
          handlePredictionResultModal
        )}
        sorting={sorting}
        setSorting={setSorting}
      />
    </div>
  );
};

export default OfflinePredictionsTable;
