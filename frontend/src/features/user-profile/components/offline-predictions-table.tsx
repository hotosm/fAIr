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
import { ModelTrainingStatus } from "@/enums";
import useCopyToClipboard from "@/hooks/use-clipboard";
import { API_ENDPOINTS } from "@/services";
import { BASE_API_URL } from "@/config";

type OfflinePredictionsTableProps = {
  data: TOfflinePrediction[];
  isError: boolean;
  isPending: boolean;
};

const columnDefinitions = (): ColumnDef<TOfflinePrediction>[] => [
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
          triggerComponent={
            <Badge
              variant="default"
              onClick={(e) => {
                // Prevent the row click event from firing
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
                // Prevent the row click event from firing
                e.stopPropagation();
                // publishTraining(row.getValue("id"));
              },
              disabled: row.getValue("status") !== ModelTrainingStatus.FINISHED,
            },
            {
              name: "View results",
              value: "View results",
              onClick: (e) => {
                // Prevent the row click event from firing
                e.stopPropagation();
                // terminationMutation(row.getValue("id"));
              },
              disabled: row.getValue("status") !== ModelTrainingStatus.FINISHED,
            },
            {
              name: "Copy results link",
              value: "Copy results link",
              onClick: async (e) => {
                // Prevent the row click event from firing
                e.stopPropagation();
                await copyToClipboard(
                  BASE_API_URL +
                    API_ENDPOINTS.GET_PREDICTIONS_TASK_STATUS(
                      row.original.task_id,
                    ),
                );
                showSuccessToast("Copied results link to clipboard");
              },
              disabled: row.getValue("status") !== ModelTrainingStatus.FINISHED,
            },
            {
              name: "Create MapSwipe project",
              value: "Create MapSwipe project",
              onClick: (e) => {
                // Prevent the row click event from firing
                e.stopPropagation();
                // terminationMutation(row.getValue("id"));
              },
              disabled: row.getValue("status") !== ModelTrainingStatus.FINISHED,
            },
            {
              name: "View logs",
              value: "View logs",
              disabled: row.getValue("status") !== ModelTrainingStatus.FAILED,
              onClick: (e) => {
                // Prevent the row click event from firing
                e.stopPropagation();
                // handleTrainingModal(row.getValue("id") as number);
                showWarningToast(
                  `Can't view logs for this prediction at this time.`,
                );
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
  if (isPending || isError) return <TableSkeleton />;

  return (
    <>
      <div className="max-w-full overflow-auto">
        <DataTable
          // @ts-ignore
          data={data as TOfflinePrediction[]}
          columns={columnDefinitions()}
          sorting={sorting}
          setSorting={setSorting}
        />
      </div>
    </>
  );
};

export default OfflinePredictionsTable;
