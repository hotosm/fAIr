import { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { SortableHeader } from "@/features/models/components/table-header";
import { TableSkeleton } from "@/features/models/components/skeletons";
import { TOfflinePrediction } from "@/types";
import { useState } from "react";
import { cn, formatDate, truncateString } from "@/utils";
import { ToolTip } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { APPLICATION_ROUTES } from "@/constants/routes";
import { MapRequestCardList } from "@/features/user-profile/components/overview/map-request-card-list";
import {
  getPredictionName,
  getModelUsed,
  isPublished,
  isResultReady,
  getResultPath,
} from "@/features/user-profile/components/overview/map-request-fields";
import { MapRequestStatusBadge } from "@/features/user-profile/components/overview/map-request-status-badge";

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
}: RowActions): ColumnDef<TOfflinePrediction>[] => [
  {
    id: "sn",
    header: ({ column }) => <SortableHeader title="SN" column={column} />,
    accessorFn: (_row, index) => index + 1,
  },
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
    header: () => <span className="block text-center">Actions</span>,
    cell: ({ row }) => {
      const resultReady = isResultReady(row.original);
      return (
        <div className="flex items-center justify-center gap-x-2">
          <button
            type="button"
            disabled={!resultReady}
            onClick={() => onViewResult(row.original)}
            className={cn(
              "rounded-[9.3px] text-off-white  bg-grey  px-3 py-1.5 transition-colors",
              resultReady ? "cursor-pointer " : "cursor-not-allowed opacity-40",
            )}
          >
            View result
          </button>
          {/* {renderRowMenu ? (
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
          )} */}
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
  /** Colour of the phone cards (see MapRequestCardList). */
  mobileCardTone?: "white" | "grey";
};

export const MapRequestsTable = ({
  requests,
  isPending,
  isError,
  onViewResult,
  onOpenMenu,
  renderRowMenu,
  mobileCardTone,
}: MapRequestsTableProps) => {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);

  const goToRequests = () =>
    navigate(APPLICATION_ROUTES.PROFILE_OFFLINE_PREDICTIONS);

  const goToResult = (prediction: TOfflinePrediction) =>
    navigate(getResultPath(prediction));

  if (isPending || isError) return <TableSkeleton />;

  return (
    <>
      {/* Phones: cards. The wide table only fits larger screens. */}
      <MapRequestCardList
        className="md:hidden"
        requests={requests}
        onViewResult={onViewResult ?? goToResult}
        tone={mobileCardTone}
      />
      <div
        className={cn(
          "hidden md:block max-w-full overflow-x-auto [&_table]:min-w-[1152px] [&_table]:table-fixed",
          "[&_th]:h-8 [&_th]:px-5 [&_th]:text-[12px] [&_th]:font-normal [&_th]:text-[#404446]",
          "[&_td]:h-16 [&_td]:px-5 [&_td]:py-4 [&_td]:text-[13px] [&_td]:font-medium [&_td]:text-[#404446]",
          "[&_th:nth-child(1)]:w-[9.3%] [&_th:nth-child(2)]:w-[23.4%] [&_th:nth-child(3)]:w-[14.8%]",
          "[&_th:nth-child(4)]:w-[18.2%] [&_th:nth-child(5)]:w-[13.6%] [&_th:nth-child(6)]:w-[10.3%] [&_th:nth-child(7)]:w-[10.4%]",
        )}
      >
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
    </>
  );
};
