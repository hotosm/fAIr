import { Badge } from "@/components/ui/badge";
import { CheckIcon } from "@/components/ui/icons";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DropDown } from "@/components/ui/dropdown";
import { ElipsisIcon, InfoIcon } from "@/components/ui/icons";
import { MODELS_CONTENT } from "@/constants";
import { PAGE_LIMIT, Pagination } from "@/components/shared";
import { SortableHeader } from "@/features/models/components/table-header";
import { TableSkeleton } from "@/features/models/components/skeletons";
import { TBadgeVariants, TTrainingDetails } from "@/types";
import { TrainingDetailsDialog } from "@/features/models/components/dialogs";
import { useAuth } from "@/app/providers/auth-provider";
import { useDialog } from "@/hooks/use-dialog";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { useState } from "react";
import { useToastNotification } from "@/hooks/use-toast-notification";
import { useTrainingHistory } from "@/features/models/hooks/use-training";
import { useUpdateTraining } from "@/features/models/api/update-trainings";
import {
  formatDate,
  formatDuration,
  roundNumber,
  showErrorToast,
  truncateString,
} from "@/utils";

type TrainingHistoryTableProps = {
  modelId: string;
  trainingId: number;
  modelOwner: string;
  datasetId: number;
  baseModel: string;
  tmsUrl: string;
};

const columnDefinitions = (
  trainingId: number,
  modelOwner: string,
  authUsername: string,
  isAuthenticated: boolean,
  handleTrainingModal: (trainingId: number) => void,
  publishTraining: (trainingId: number) => void,
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
  {
    accessorKey: "user.username",
    header:
      MODELS_CONTENT.models.modelsDetailsCard.trainingHistoryTableHeader
        .sumittedBy,
    cell: ({ row }) => {
      return <span>{truncateString(row.original.user.username)}</span>;
    },
  },
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
  {
    header:
      MODELS_CONTENT.models.modelsDetailsCard.trainingHistoryTableHeader.inUse,

    cell: ({ row }) => {
      return (
        <span>
          {row.getValue("id") === trainingId ? (
            <Badge variant="green" rounded>
              <CheckIcon className="icon" />
            </Badge>
          ) : null}
        </span>
      );
    },
  },
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
                onClick={() => handleTrainingModal(Number(row.getValue("id")))}
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
            const { dropdownIsOpened, onDropdownHide, onDropdownShow } =
              useDropdownMenu();
            return (
              <>
                <DropDown
                  disableCheveronIcon
                  dropdownIsOpened={dropdownIsOpened}
                  onDropdownHide={onDropdownHide}
                  onDropdownShow={onDropdownShow}
                  triggerComponent={
                    <Badge
                      variant="default"
                      onClick={() => null}
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
                      onClick: () => publishTraining(row.getValue("id")),
                      disabled:
                        row.getValue("status") === "FAILED" ||
                        row.getValue("status") === "SUBMITTED",
                    },
                    {
                      name: "View training details",
                      value: "View training details",
                      onClick: () =>
                        handleTrainingModal(row.getValue("id") as number),
                    },
                  ]}
                ></DropDown>
              </>
            );
          },
        },
      ]
    : []),
];

const TrainingHistoryTable: React.FC<TrainingHistoryTableProps> = ({
  trainingId,
  modelId,
  modelOwner,
  datasetId,
  baseModel,
  tmsUrl,
}) => {
  const [offset, setOffset] = useState(0);
  const { data, isPending, isPlaceholderData } = useTrainingHistory(
    modelId,
    offset,
    PAGE_LIMIT,
    "-id",
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const { user, isAuthenticated } = useAuth();
  const { isOpened, openDialog, closeDialog } = useDialog();
  const toast = useToastNotification();
  const { mutate } = useUpdateTraining({
    mutationConfig: {
      onSuccess: (res) => {
        toast(res.data, "success");
      },
      onError: (err) => {
        showErrorToast(err);
      },
    },
    modelId: Number(modelId),
  });

  const [activeTrainingId, setActiveTrainingId] = useState<number>(trainingId);

  const handleTrainingModal = (trainingId: number) => {
    setActiveTrainingId(trainingId);
    openDialog();
  };

  if (isPending) return <TableSkeleton />;

  return (
    <>
      <TrainingDetailsDialog
        isOpened={isOpened}
        closeDialog={closeDialog}
        trainingId={activeTrainingId}
        datasetId={datasetId}
        baseModel={baseModel}
        tmsUrl={tmsUrl}
      />
      <div className="h-full">
        <div className="w-full items-center text-body-3 flex justify-between my-4">
          <p className="text-nowrap">
            {" "}
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
        <DataTable
          data={data?.results as TTrainingDetails[]}
          columns={columnDefinitions(
            trainingId,
            modelOwner,
            user?.username,
            isAuthenticated,
            handleTrainingModal,
            mutate,
          )}
          sorting={sorting}
          setSorting={setSorting}
        />
      </div>
    </>
  );
};

export default TrainingHistoryTable;
