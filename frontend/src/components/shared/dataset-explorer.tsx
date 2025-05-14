import { DatasetList } from "@/features/datasets/components";
import { useDatasetsQueryParams } from "@/features/datasets/hooks/use-query-params";
import { OrderingFilter, Pagination, SearchFilter } from "@/components/shared";
import { TTrainingDataset } from "@/types";
import { MODELS_CONTENT } from "@/constants";
import { HelpText } from "@/components/ui/form";

export const DatasetExplorer = ({
  disableSelectedDatasetText,
  selectedTrainingDatasetId,
  onDatasetSelect,
  disableInstruction,
}: {
  disableSelectedDatasetText?: boolean;
  selectedTrainingDatasetId?: number;
  onDatasetSelect?: (dataset: TTrainingDataset) => void;
  disableInstruction?: boolean;
}) => {
  const {
    data,
    isError,
    isPending,
    isPlaceholderData,
    refetch,
    query,
    updateQuery,
  } = useDatasetsQueryParams();

  return (
    <div className="flex flex-col gap-y-10">
      {!disableInstruction && (
        <HelpText
          content={
            MODELS_CONTENT.modelCreation.trainingDataset.form
              .existingTrainingDatasetSectionDescription
          }
        />
      )}

      <SearchFilter
        query={query}
        updateQuery={updateQuery}
        placeholder="Search datasets..."
        className="w-full max-w-xl"
      />
      <div className="flex flex-col gap-y-6 md:gap-y-0 w-full justify-between">
        <p className="text-body-3 font-semibold">{data?.count} datasets</p>
        <div className="flex w-full justify-between md:justify-end items-center md:gap-x-1">
          <OrderingFilter
            query={query}
            updateQuery={updateQuery}
            disabled={isError || isPending}
            className="inline-flex"
          />
          <div>
            <Pagination
              totalLength={data?.count as number}
              hasNextPage={data?.hasNext as boolean}
              hasPrevPage={data?.hasPrev as boolean}
              disableNextPage={!data?.hasNext || isPlaceholderData}
              disablePrevPage={!data?.hasPrev}
              query={query}
              updateQuery={updateQuery}
              isPlaceholderData={isPlaceholderData}
              scrollToTopOnPageSwitch
            />
          </div>
        </div>
        {!disableSelectedDatasetText && (
          <p className="text-body-3 font-semibold">
            Selected dataset Id:{" "}
            <span className="text-primary">
              {selectedTrainingDatasetId || "None"}.
            </span>
          </p>
        )}
      </div>
      {/* Dataset List */}
      <DatasetList
        isError={isError}
        datasets={data?.results as TTrainingDataset[]}
        isPending={isPending}
        refetch={refetch}
        showUsername
        selectedDatasetId={
          selectedTrainingDatasetId
            ? Number(selectedTrainingDatasetId)
            : selectedTrainingDatasetId
        }
        onDatasetSelect={(dataset) => {
          onDatasetSelect?.(dataset);
        }}
      />
    </div>
  );
};
