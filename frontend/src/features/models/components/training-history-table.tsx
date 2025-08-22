import { Badge } from "@/components/ui/badge";
import { CheckIcon } from "@/components/ui/icons";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DropDown } from "@/components/ui/dropdown";
import { ElipsisIcon, InfoIcon } from "@/components/ui/icons";
import { APPLICATION_ROUTES, MODELS_CONTENT } from "@/constants";
import { PAGE_LIMIT, Pagination } from "@/components/shared";
import { SortableHeader } from "@/features/models/components/table-header";
import { TableSkeleton } from "@/features/models/components/skeletons";
import { TBadgeVariants, TTrainingDetails } from "@/types";
import { TrainingDetailsDialog } from "@/features/models/components/dialogs";
import { useAuth } from "@/app/providers/auth-provider";
import { useDialog } from "@/hooks/use-dialog";
import { useState } from "react";
import { useTrainingHistory } from "@/features/models/hooks/use-training";
import {
  useTerminateTraining,
  useUpdateTraining,
} from "@/features/models/api/update-trainings";
import {
  formatDate,
  formatDuration,
  roundNumber,
  showErrorToast,
  showSuccessToast,
  truncateString,
} from "@/utils";
import { Link } from "@/components/ui/link";
import { ModelTrainingStatus } from "@/enums";

type TrainingHistoryTableProps = {
  modelId?: string;
  publishedTrainingId?: number;
  modelOwner?: string;
  tmsUrl?: string;
  showUserTrainingHistory?: boolean;
};

const columnDefinitions = (
  authUsername: string,
  isAuthenticated: boolean,
  handleTrainingModal: (trainingId: number) => void,
  // Same as mutate
  publishTraining: (trainingId: number) => void,
  terminationMutation: (trainingId: number) => void,
  publishedTrainingId?: number,
  showUserTrainingHistory?: boolean,
  modelOwner?: string,
): ColumnDef<TTrainingDetails>[] => [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader title={"ID"} column={column} />,
  },
  {
    header:
      MODELS_CONTENT.models.modelsDetailsCard.trainingHistoryTableHeader
        .epochAndBatchSize,
    accessorFn: (row) => `${row.epochs}/${row.batch_size}`,
    cell: (row) => (
      <span title={row.getValue() as string}>{row.getValue() as string}</span>
    ),
  },
  {
    accessorKey: "started_at",
    accessorFn: (row) =>
      row.started_at !== null ? formatDate(row.started_at) : "-",
    header:
      MODELS_CONTENT.models.modelsDetailsCard.trainingHistoryTableHeader
        .startedAt,
    cell: (row) => {
      return <span>{row.getValue() as string}</span>;
    },
  },
  {
    header:
      MODELS_CONTENT.models.modelsDetailsCard.trainingHistoryTableHeader
        .duration,
    accessorFn: (row) =>
      row.finished_at && row.started_at
        ? formatDuration(new Date(row.started_at), new Date(row.finished_at))
        : "-",
    cell: (row) => (
      <span title={row.getValue() as string}>{row.getValue() as string}</span>
    ),
  },
  ...(showUserTrainingHistory
    ? [
        {
          accessorKey: "model",
          header: ({ column }: { column: any }) => (
            <SortableHeader
              title={
                MODELS_CONTENT.models.modelsDetailsCard
                  .trainingHistoryTableHeader.model
              }
              column={column}
            />
          ),
          cell: ({ row }: { row: any }) => {
            return (
              <span className="hover:underline">
                <Link
                  nativeAnchor={false}
                  disableLinkStyle
                  href={`${APPLICATION_ROUTES.MODELS}/${row.original.model.id}`}
                  title={row.original.model.id}
                >
                  {row.original.model.id}
                </Link>
              </span>
            );
          },
        },
      ]
    : [
        {
          accessorKey: "user.username",
          header:
            MODELS_CONTENT.models.modelsDetailsCard.trainingHistoryTableHeader
              .sumittedBy,
          cell: ({ row }: { row: any }) => {
            return <span>{truncateString(row.original.user.username)}</span>;
          },
        },
      ]),

  {
    accessorKey: "chips_length",
    header:
      MODELS_CONTENT.models.modelsDetailsCard.trainingHistoryTableHeader.dsSize,
    cell: ({ row }) => {
      return <span>{row.getValue("chips_length") ?? 0}</span>;
    },
  },
  {
    accessorKey: "accuracy",
    header: ({ column }) => (
      <SortableHeader
        title={
          MODELS_CONTENT.models.modelsDetailsCard.trainingHistoryTableHeader
            .accuracy
        }
        column={column}
      />
    ),
    cell: ({ row }) => {
      return (
        <span>
          {Number(row.getValue("accuracy")) > 0
            ? roundNumber(row.getValue("accuracy") ?? 0)
            : "-"}
        </span>
      );
    },
  },
  {
    header:
      MODELS_CONTENT.models.modelsDetailsCard.trainingHistoryTableHeader.status,
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
  ...(publishedTrainingId
    ? [
        {
          header:
            MODELS_CONTENT.models.modelsDetailsCard.trainingHistoryTableHeader
              .inUse,

          cell: ({ row }: { row: any }) => {
            return (
              <span>
                {row.getValue("id") === publishedTrainingId ? (
                  <Badge variant="green" rounded>
                    <CheckIcon className="icon" />
                  </Badge>
                ) : null}
              </span>
            );
          },
        },
      ]
    : []),
  ...(modelOwner !== authUsername
    ? [
        {
          header:
            MODELS_CONTENT.models.modelsDetailsCard.trainingHistoryTableHeader
              .info,

          cell: ({ row }: { row: any }) => {
            return (
              <Badge
                variant="default"
                className="rounded-lg px-2"
                onClick={(e) => {
                  // Prevent the row click event from firing
                  e.stopPropagation();
                  handleTrainingModal(Number(row.getValue("id")));
                }}
              >
                <InfoIcon className="icon text-dark font-bold" />
              </Badge>
            );
          },
        },
      ]
    : []),
  ...(modelOwner === authUsername && isAuthenticated
    ? [
        {
          header:
            MODELS_CONTENT.models.modelsDetailsCard.trainingHistoryTableHeader
              .action,

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
                    <ElipsisIcon className="icon" />
                  </Badge>
                }
                className="text-right"
                distance={10}
                menuItems={[
                  {
                    name: "Set as active training dataset",
                    value: "Set as active training dataset",
                    onClick: (e) => {
                      // Prevent the row click event from firing
                      e.stopPropagation();
                      publishTraining(row.getValue("id"));
                    },
                    disabled:
                      row.getValue("status") === ModelTrainingStatus.FAILED ||
                      row.getValue("status") ===
                        ModelTrainingStatus.IN_PROGRESS ||
                      row.getValue("status") === ModelTrainingStatus.SUBMITTED,
                  },
                  {
                    name: "Cancel training",
                    value: "Cancel training",
                    onClick: (e) => {
                      // Prevent the row click event from firing
                      e.stopPropagation();
                      terminationMutation(row.getValue("id"));
                    },
                    disabled:
                      row.getValue("status") === ModelTrainingStatus.FAILED ||
                      row.getValue("status") === ModelTrainingStatus.FINISHED,
                  },
                  {
                    name: "View training details",
                    value: "View training details",
                    onClick: (e) => {
                      // Prevent the row click event from firing
                      e.stopPropagation();
                      handleTrainingModal(row.getValue("id") as number);
                    },
                  },
                ]}
              />
            );
          },
        },
      ]
    : []),
];

const TrainingHistoryTable: React.FC<TrainingHistoryTableProps> = ({
  publishedTrainingId,
  modelId,
  modelOwner,
  showUserTrainingHistory = false,
}) => {
  const [offset, setOffset] = useState<number>(0);
  const { user, isAuthenticated } = useAuth();

  const { data, isPending, isPlaceholderData, refetch } = useTrainingHistory(
    offset,
    PAGE_LIMIT,
    "-id",
    showUserTrainingHistory ? undefined : modelId,
    showUserTrainingHistory ? user.osm_id : undefined,
    !!modelId || showUserTrainingHistory,
    10000,
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const [activeTrainingId, setActiveTrainingId] = useState<number | undefined>(
    publishedTrainingId,
  );

  const { isOpened, openDialog, closeDialog } = useDialog();

  const { mutate } = useUpdateTraining({
    mutationConfig: {
      onSuccess: (res) => {
        showSuccessToast(res.data);
      },
      onError: (err) => {
        showErrorToast(err);
      },
    },
    modelId: Number(modelId),
  });

  const { mutate: terminationMutation } = useTerminateTraining({
    mutationConfig: {
      onSuccess: () => {
        showSuccessToast("Training has been cancelled successfully.");
        refetch();
      },
      onError: (err) => {
        showErrorToast(err);
      },
    },
    modelId: Number(modelId),
  });

  const handleTrainingModal = (trainingId: number) => {
    setActiveTrainingId(trainingId);
    openDialog();
  };

  if (isPending) return <TableSkeleton />;

  return (
    <>
      {activeTrainingId && (
        <TrainingDetailsDialog
          isOpened={isOpened}
          closeDialog={closeDialog}
          trainingId={activeTrainingId}
        />
      )}

      <div className="h-full">
        <div className="w-full items-center text-body-3 flex justify-between my-4">
          <p className="text-nowrap">
            {data?.count}{" "}
            {
              MODELS_CONTENT.models.modelsDetailsCard.trainingHistoryTableHeader
                .trainingHistoryCount
            }
          </p>
          <div className="self-end">
            <Pagination
              totalLength={data?.count}
              hasNextPage={data?.hasNext}
              hasPrevPage={data?.hasPrev}
              disableNextPage={!data?.hasNext || isPlaceholderData}
              disablePrevPage={!data?.hasPrev}
              pageLimit={PAGE_LIMIT}
              isPlaceholderData={isPlaceholderData}
              setOffset={setOffset}
              offset={offset}
              centerOnMobile={false}
            />
          </div>
        </div>
        <div className="max-w-full overflow-auto">
          <DataTable
            data={data?.results as TTrainingDetails[]}
            columns={columnDefinitions(
              user?.username,
              isAuthenticated,
              handleTrainingModal,
              mutate,
              terminationMutation,
              publishedTrainingId,
              showUserTrainingHistory,
              showUserTrainingHistory ? user?.username : modelOwner,
            )}
            sorting={sorting}
            setSorting={setSorting}
            onRowClick={(d) => handleTrainingModal(d.id)}
          />
        </div>
      </div>
    </>
  );
};

export default TrainingHistoryTable;
