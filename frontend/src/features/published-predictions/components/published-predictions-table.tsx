import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ToolTip } from "@/components/ui/tooltip";
import { NoTrainingAreaIcon, MapIcon, InfoIcon } from "@/components/ui/icons";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { SortableHeader } from "@/features/models/components/table-header";
import { TableSkeleton } from "@/features/models/components/skeletons";
import { TOfflinePrediction } from "@/types";
import {
  extractDatePart,
  formatDate,
  formatNumber,
  truncateString,
} from "@/utils";
import { MapSwipeProjectIsActive } from "@/features/user-profile/components/offline-predictions/mapswipe-project-active";
import { PublishedPredictionDetailsInfo } from "./published-prediction-details-info";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { DropdownPlacement } from "@/enums";

type PublishedPredictionsListProps = {
  data: TOfflinePrediction[];
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
  onViewDetails: (prediction: TOfflinePrediction) => void;
  onViewResults: (prediction: TOfflinePrediction) => void;
};
//   const { dropdownRef } = useDropdownMenu();

const getPredictionTitle = (prediction: TOfflinePrediction) =>
  prediction.description;

const getModelUsed = (prediction: TOfflinePrediction) => prediction.model_name;

const columnDefinitions = (
  onViewMapswipe: (prediction: TOfflinePrediction) => void,
): ColumnDef<TOfflinePrediction>[] => [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader title={"ID"} column={column} />,
    cell: ({ row }) => (
      <Badge
        variant="default"
        className="rounded-[4px] bg-primary text-white font-semibold"
      >
        <span className="text-body-3 uppercase">ID: {row.original.id}</span>
      </Badge>
    ),
  },
  {
    header: "Prediction Name",
    accessorFn: (row) => getPredictionTitle(row),
    cell: ({ row }) => {
      const title = getPredictionTitle(row.original);

      return (
        <ToolTip content={title}>
          <span title={title ?? ""} className="block max-w-[200px] truncate">
            {truncateString(title ?? "", 50)}
          </span>
        </ToolTip>
      );
    },
  },
  {
    header: "Features",
    accessorFn: (row) => row.result?.count ?? 0,
    cell: ({ row }) => (
      <span className="flex items-center gap-x-1">
        <MapIcon className="icon shrink-0" />
        {formatNumber(row.original.result?.count ?? 0)}
      </span>
    ),
  },
  {
    header: "Model",
    accessorFn: (row) => getModelUsed(row),
    cell: ({ row }) => {
      const modelUsed = getModelUsed(row.original);

      return (
        <span title={modelUsed} className="block max-w-[200px] truncate">
          {truncateString(modelUsed, 40)}
        </span>
      );
    },
  },
  {
    header: "MapSwipe",
    accessorKey: "mapswipe_id",
    cell: ({ row }) => (
      <MapSwipeProjectIsActive
        MapSwipeId={row.original.mapswipe_id as string}
        onClick={() => onViewMapswipe(row.original)}
      />
    ),
  },
  {
    accessorKey: "published_at",
    header: ({ column }) => (
      <SortableHeader title={"Published"} column={column} />
    ),
    cell: ({ row }) =>
      row.original.published_at
        ? formatDate(extractDatePart(row.original.published_at))
        : "-",
  },
  {
    header: "Info",
    cell: ({ row }) => (
      <PublishedPredictionDetailsInfo
        prediction={row.original}
        placement={DropdownPlacement.BOTTOM_START}
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
        modelUsed={getModelUsed(row.original)}
        createdBy={row.original.user?.username}
        // dropdownRef={dropdownRef}
      />
    ),
  },
];

export const PublishedPredictionsListLayout = ({
  data,
  isPending,
  isError,
  refetch,
  onViewDetails,
}: PublishedPredictionsListProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  if (isPending) {
    return <TableSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-20 gap-y-4">
        <p className="text-grey text-body-2base">
          Error loading published predictions.
        </p>
        <Button className="!w-fit" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col gap-y-4 items-center justify-center py-20">
        <NoTrainingAreaIcon />
        <p className="text-grey text-body-2base">
          No published predictions found.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-auto">
      <DataTable
        data={data}
        columns={columnDefinitions(onViewDetails)}
        sorting={sorting}
        setSorting={setSorting}
      />
    </div>
  );
};
