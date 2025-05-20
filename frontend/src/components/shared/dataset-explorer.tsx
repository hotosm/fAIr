import { DatasetList } from "@/features/datasets/components";
import { useDatasetsQueryParams } from "@/features/datasets/hooks/use-query-params";
import { OrderingFilter, Pagination, SearchFilter } from "@/components/shared";
import { FeatureCollection, TTrainingDataset } from "@/types";
import { MODELS_CONTENT } from "@/constants";
import { HelpText } from "@/components/ui/form";
import ShowMapToggle from "@/components/shared/show-map-toggle";
import { useModelsMapData } from "@/features/models/hooks/use-models";
import { Spinner } from "@/components/ui/spinner";
import { ModelsMap } from "@/features/models/components";

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
    mapViewIsActive,
  } = useDatasetsQueryParams();
  const {
    data: mapData,
    isPending: modelsMapDataIsPending,
    isError: modelsMapDataIsError,
  } = useModelsMapData();

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
      <div className="flex flex-col md:flex-row gap-y-4 md:gap-y-0 w-full justify-between md:items-center">
        <SearchFilter
          query={query}
          updateQuery={updateQuery}
          placeholder="Search datasets..."
          className="w-full max-w-xl"
        />
        <ShowMapToggle query={query} updateQuery={updateQuery} />
      </div>

      <div className="flex flex-col gap-y-6 md:gap-y-0 w-full justify-between">
        <p className="text-body-3 font-semibold">{data?.count} datasets</p>
        <div className="flex w-full justify-between md:justify-end items-center md:gap-x-6">
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

      <div className="w-full grid grid-cols-1 grid-rows-2 lg:grid-rows-1 lg:grid-cols-2 rounded-md lg:p-2 gap-x-2 mt-10 gap-y-6 lg:gap-y-0 h-screen">
        <div className={`w-full overflow-y-auto scrollable lg:row-start-1 ${mapViewIsActive ? "" : "lg:col-span-2"}`}>
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
        {mapViewIsActive && (
          <div className="row-start-1 p-2 md:border md:border-gray-border rounded-md ">
            {modelsMapDataIsPending ||
              modelsMapDataIsError ||
              mapData.features.length === 0 ? (
              <div className="w-full h-full animate-pulse bg-light-gray flex items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <ModelsMap
                mapResults={mapData as FeatureCollection}
                updateQuery={updateQuery}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
