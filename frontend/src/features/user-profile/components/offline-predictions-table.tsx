import { Badge } from "@/components/ui/badge";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";

import { SortableHeader } from "@/features/models/components/table-header";
import { TableSkeleton } from "@/features/models/components/skeletons";
import { TBadgeVariants, TOfflinePrediction } from "@/types";
import { useState } from "react";
import {
  formatDate,
  formatDuration,
  showSuccessToast,
  showWarningToast,
  truncateString,
} from "@/utils";
import { DropDown } from "@/components/ui/dropdown";
import { ElipsisIcon, InfoIcon } from "@/components/ui/icons";
import { DropdownPlacement, ModelTrainingStatus } from "@/enums";
import useCopyToClipboard from "@/hooks/use-clipboard";
import { API_ENDPOINTS } from "@/services";
import { BASE_API_URL } from "@/config";
import { TrainingLogsDialog } from "./training-logs-dialog";
import { useDialog } from "@/hooks/use-dialog";
import { PredictionResultDrawer } from "./predictions-results-drawer";

type OfflinePredictionsTableProps = {
  data: TOfflinePrediction[];
  isError: boolean;
  isPending: boolean;
};

const columnDefinitions = (
  handleTrainingLogsModal: (taskId: string) => void,
  handlePredictionResultModal: (prediction: TOfflinePrediction) => void,
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
    cell: (row) => {
      const statusToVariant: Record<string, TBadgeVariants> = {
        finished: "green",
        failed: "red",
        submitted: "blue",
        running: "yellow",
      };

      return (
        <Badge
          variant={
            statusToVariant[
              String(row.getValue()).toLocaleLowerCase() as TBadgeVariants
            ]
          }
        >
          {String(row.getValue()).toLocaleLowerCase() as string}
        </Badge>
      );
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
    header: "Info",
    cell: ({ row }: { row: any }) => {
      return (
        <DropDown
          disableCheveronIcon
          placement={DropdownPlacement.BOTTOM_END}
          triggerComponent={
            <Badge
              variant="default"
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="rounded-lg px-2 items-center flex"
            >
              <InfoIcon className="icon" />
            </Badge>
          }
          className="text-right"
          distance={10}
        >
          <div className="flex flex-col gap-2 bg-white p-4">
            <p className="font-bold text-body-3  text-dark text-start">
              Settings Info
            </p>
            {Object.entries(row.original.config)
              .filter(
                ([key]) =>
                  key !== "checkpoint" && key !== "source" && key !== "bbox",
              )
              .map(([key, value]) => (
                <span
                  key={key}
                  className="text-body-3 text-dark flex items-center gap-x-2 justify-between"
                >
                  {key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                  :{" "}
                  <span className="font-semibold">
                    {typeof value === "boolean"
                      ? value
                        ? "True"
                        : "False"
                      : String(value)}
                  </span>
                </span>
              ))}
          </div>
        </DropDown>
      );
    },
  },
  {
    header: "Actions",
    cell: ({ row }: { row: any }) => {
      const { copyToClipboard } = useCopyToClipboard();
      return (
        <DropDown
          disableCheveronIcon
          triggerComponent={
            <Badge
              variant="default"
              onClick={(e) => {
                // Prevent the row click event from firing
                e.stopPropagation();
              }}
              className="rounded-lg px-2 items-center flex"
            >
              <ElipsisIcon className="icon rotate-90" />
            </Badge>
          }
          className="text-right"
          distance={10}
          menuItems={[
            {
              name: "Download results",
              value: "Download results",
              onClick: (e) => {
                e.stopPropagation();
                const downloadUrl =
                  BASE_API_URL +
                  API_ENDPOINTS.DOWNLOAD_PREDICTION_LABELS_FILE(
                    row.original.id,
                  );
                // It's possible that the download file is large, so we open it in a new tab
                // to avoid blocking the UI.
                // This will allow the user to download the file without interrupting their workflow.
                window.open(downloadUrl, "_blank");
              },
              disabled: row.getValue("status") !== ModelTrainingStatus.FINISHED,
            },
            {
              name: "View results",
              value: "View results",
              onClick: (e) => {
                e.stopPropagation();
                handlePredictionResultModal(row.original);
              },
              disabled: row.getValue("status") !== ModelTrainingStatus.FINISHED,
            },
            {
              name: "Copy results link",
              value: "Copy results link",
              onClick: async (e) => {
                e.stopPropagation();
                await copyToClipboard(
                  BASE_API_URL +
                    API_ENDPOINTS.DOWNLOAD_PREDICTION_LABELS_FILE(
                      row.original.id,
                    ),
                );
                showSuccessToast("Copied results link to clipboard!");
              },
              disabled: row.getValue("status") !== ModelTrainingStatus.FINISHED,
            },
            {
              name: !row.original.mapswipe_id
                ? "Create MapSwipe project"
                : "View MapSwipe project",
              value: !row.original.mapswipe_id
                ? "Create MapSwipe project"
                : "View MapSwipe project",
              onClick: (e) => {
                // can be used to create or view a MapSwipe project
                // Prevent the row click event from firing
                e.stopPropagation();
                showWarningToast(
                  "This feature is not yet implemented. Please check back later.",
                );
              },
              disabled: row.getValue("status") !== ModelTrainingStatus.FINISHED,
            },
            {
              name: "View logs",
              value: "View logs",
              disabled: ![
                ModelTrainingStatus.FAILED,
                ModelTrainingStatus.IN_PROGRESS,
              ].includes(row.getValue("status")),
              onClick: (e) => {
                // Prevent the row click event from firing
                e.stopPropagation();
                handleTrainingLogsModal(row.original.task_id as string);
              },
            },
            {
              name: "Copy imagery link",
              value: "Copy imagery link",
              onClick: async (e) => {
                e.stopPropagation();
                await copyToClipboard(row.original.config.source);
                showSuccessToast("Copied imagery link to clipboard");
              },
            },
          ]}
        />
      );
    },
  },
];

const OfflinePredictionsTable: React.FC<OfflinePredictionsTableProps> = ({
  data,
  isPending,
  isError,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { isOpened, openDialog, closeDialog } = useDialog();
  const {
    isOpened: isPredictionResultOpened,
    openDialog: openPredictionResultDialog,
    closeDialog: closePredictionResultDialog,
  } = useDialog();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activePrediction, setActivePrediction] =
    useState<TOfflinePrediction | null>(null);
  const handleTrainingLogsModal = (taskId: string) => {
    setActiveTaskId(taskId);
    openDialog();
  };
  const handlePredictionResultModal = (prediction: TOfflinePrediction) => {
    setActivePrediction(prediction);
    openPredictionResultDialog();
  };
  if (isPending || isError) return <TableSkeleton />;

  return (
    <>
      {activePrediction && (
        <PredictionResultDrawer
          tileServiceUrl={activePrediction.config.source}
          predictionId={activePrediction.id}
          isOpened={isPredictionResultOpened}
          closeDialog={closePredictionResultDialog}
        />
      )}
      {activeTaskId && (
        <TrainingLogsDialog
          taskId={activeTaskId}
          isOpened={isOpened}
          closeDialog={closeDialog}
        />
      )}
      <div className="max-w-full overflow-auto min-h-screen">
        <DataTable
          // @ts-ignore
          data={data as TOfflinePrediction[]}
          columns={columnDefinitions(
            handleTrainingLogsModal,
            handlePredictionResultModal,
          )}
          sorting={sorting}
          setSorting={setSorting}
        />
      </div>
    </>
  );
};

export default OfflinePredictionsTable;
