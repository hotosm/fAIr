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
import { OfflinePredictionsSettingsInfo } from "./offline-predictions-settings-info";
import { OfflinePredictionActions } from "./offline-predictions-actions";
import { ToolTip } from "@/components/ui/tooltip";
import { MapSwipeProjectIsActive } from "./mapswipe-project-active";
import { getDisplayStatus } from "@/features/user-profile/utils/get-display-status";
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
    cell: ({ row }) => {
      const displayStatus = getDisplayStatus(
        row.original.status,
        row.original.published,
      );
      return <TrainingStatusBadge status={displayStatus} />;
    },
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
    accessorFn: (row) => (row.result ? row.result["count"] : 0),
    // accessorKey: "result_count",
    cell: (row) => (
      <span title={row.getValue() as string}>
        {roundNumber(row.getValue() as number)}
      </span>
    ),
  },
  {
    header: "MapSwipe",
    accessorKey: undefined,
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
