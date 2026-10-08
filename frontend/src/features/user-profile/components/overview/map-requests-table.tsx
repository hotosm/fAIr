import { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { SortableHeader } from "@/features/models/components/table-header";
import { TableSkeleton } from "@/features/models/components/skeletons";
import { TOfflinePrediction } from "@/types";
import { useState } from "react";
import { cn, formatDate, truncateString } from "@/utils";
import { ToolTip } from "@/components/ui/tooltip";
import { ElipsisIcon } from "@/components/ui/icons";
import { useNavigate } from "react-router-dom";
import { APPLICATION_ROUTES } from "@/constants/routes";
import { MapRequestStatusBadge } from "./map-request-status-badge";
import { PredictionRequestStatus } from "@/enums";

// ---------------------------------------------------------------------------
// Field resolvers — single source of truth so nothing is spread across the JSX.
// ---------------------------------------------------------------------------

const getFeatureMapped = (_p: TOfflinePrediction): string => _p?.category || "-";

const getModelUsed = (p: TOfflinePrediction): string =>
  p.model_name || p.local_model_stac_id || "-";

const getPredictionName = (p: TOfflinePrediction): string =>
  p.description || `Prediction #${p.id}`;

const isResultReady = (p: TOfflinePrediction): boolean =>
  p.results_ready ||
  p.status?.toLowerCase() === PredictionRequestStatus.COMPLETED;

const isPublished = (p: TOfflinePrediction): boolean =>
  p.visibility === "public" || Boolean(p.published);

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

type RowActions = {
  onViewResult: (prediction: TOfflinePrediction) => void;
  onOpenMenu: (prediction: TOfflinePrediction) => void;
  /** When provided, renders a custom kebab menu instead of the default button. */
  renderRowMenu?: (prediction: TOfflinePrediction) => React.ReactNode;
};

const columnDefinitions = ({
  onViewResult,
  onOpenMenu,
  renderRowMenu,
}: RowActions): ColumnDef<TOfflinePrediction>[] => [
  {
    id: "name",
    header: ({ column }) => (
      <SortableHeader title="Prediction Name" column={column} />
    ),
    accessorFn: (row) => getPredictionName(row),
    cell: (ctx) => {
      const value = ctx.getValue() as string;
      return (
        <ToolTip content={value}>
          <span className="block max-w-[180px] truncate">
            {truncateString(value, 24)}
          </span>
        </ToolTip>
      );
    },
  },
  {
    id: "feature_mapped",
    header: "Feature Mapped",
    accessorFn: (row) => getFeatureMapped(row),
    cell: (ctx) => <span className="capitalize">{ctx.getValue() as string}</span>,
  },
  {
    id: "model_used",
    header: "Model Used",
    accessorFn: (row) => getModelUsed(row),
    cell: (ctx) => {
      const value = ctx.getValue() as string;
      return (
        <ToolTip content={value}>
          <span className="block max-w-[160px] truncate">
            {truncateString(value, 22)}
          </span>
        </ToolTip>
      );
    },
  },
  {
    id: "date_submitted",
    header: ({ column }) => (
      <SortableHeader title="Date Submitted" column={column} />
    ),
    accessorFn: (row) =>
      row.submitted_at ? formatDate(row.submitted_at) : "-",
    cell: (ctx) => (
      <span className="whitespace-nowrap font-medium">
        {ctx.getValue() as string}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => <MapRequestStatusBadge status={row.original.status} />,
  },
  {
    id: "published",
    header: "Published",
    accessorFn: (row) => (isPublished(row) ? "Yes" : "No"),
    cell: (ctx) => <span>{ctx.getValue() as string}</span>,
  },
  {
    id: "actions",
    header: () => <span className="flex justify-end">Actions</span>,
    cell: ({ row }) => {
      const resultReady = isResultReady(row.original);
      return (
        <div className="flex items-center justify-end gap-x-2">
          <button
            type="button"
            disabled={!resultReady}
            onClick={() => onViewResult(row.original)}
            className={cn(
              "rounded-[9.3px] border  bg-off-white text-dark  px-3 py-1.5 transition-colors",
              resultReady ? "cursor-pointer border-dark" : "cursor-not-allowed opacity-40",
            )}
          >
            View result
          </button>
          {renderRowMenu ? (
            renderRowMenu(row.original)
          ) : (
            <button
              type="button"
              onClick={() => onOpenMenu(row.original)}
              aria-label="More actions"
              className="flex size-8 items-center justify-center rounded-[9.33px]  text-dark bg-off-white"
            >
              <ElipsisIcon className="size-4 rotate-90" />
            </button>
          )}
        </div>
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type MapRequestsTableProps = {
  requests: TOfflinePrediction[];
  isPending: boolean;
  isError: boolean;
  /**
   * Row actions. When omitted (e.g. the Overview preview) both fall back to
   * navigating to the full Map Requests page.
   */
  onViewResult?: (prediction: TOfflinePrediction) => void;
  onOpenMenu?: (prediction: TOfflinePrediction) => void;
  renderRowMenu?: (prediction: TOfflinePrediction) => React.ReactNode;
};

export const MapRequestsTable = ({
  requests,
  isPending,
  isError,
  onViewResult,
  onOpenMenu,
  renderRowMenu,
}: MapRequestsTableProps) => {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);

  const goToRequests = () =>
    navigate(APPLICATION_ROUTES.PROFILE_OFFLINE_PREDICTIONS);

  const goToResult = (prediction: TOfflinePrediction) =>
    navigate(
      APPLICATION_ROUTES.MAP_REQUEST_RESULT.replace(
        ":id",
        String(prediction.id),
      ),
    );

  if (isPending || isError) return <TableSkeleton />;

  return (
    <div className="max-w-full  overflow-auto">
      <DataTable
        // @ts-ignore
        data={requests}
        columns={columnDefinitions({
          onViewResult: onViewResult ?? goToResult,
          onOpenMenu: onOpenMenu ?? goToRequests,
          renderRowMenu,
        })}
        sorting={sorting}
        setSorting={setSorting}
      />
    </div>
  );
};
