import { DatasetList } from "@/features/datasets/components";
import { useDatasetsQueryParams } from "@/features/datasets/hooks/use-query-params";
import { ClearFilters, OrderingFilter, Pagination, SearchFilter } from "@/components/shared";
import { FeatureCollection, TTrainingDataset } from "@/types";
import { MODELS_CONTENT } from "@/constants";
import { HelpText } from "@/components/ui/form";
import ShowMapToggle from "@/components/shared/show-map-toggle";
import { Spinner } from "@/components/ui/spinner";
import { useEffect } from "react";
import { useScrollToElement } from "@/hooks/use-scroll-to-element";
import { DatasetsMap } from "@/features/datasets/components/datasets-map";
import { useDatasetsMapData } from "@/features/datasets/hooks/use-datasets";

export const DatasetExplorer = ({
  disableSelectedDatasetText,
  selectedTrainingDatasetId,
  onDatasetSelect,
  disableInstruction,
  navigateOnClick,
}: {
  disableSelectedDatasetText?: boolean;
  selectedTrainingDatasetId?: number;
  onDatasetSelect?: (dataset: TTrainingDataset) => void;
  disableInstruction?: boolean;
  navigateOnClick?: boolean;
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
    clearAllFilters,
  } = useDatasetsQueryParams();

  const {
    data: mapData,
    isPending: mapDataIsPending,
    isError: mapDataIsError,
  } = useDatasetsMapData();

  const mapViewElementId = "dataset-map-view";
  const { scrollToElement } = useScrollToElement(mapViewElementId);
  /**
   *  Mapview toggling interaction.
   */
  useEffect(() => {
    if (mapViewIsActive) {
      scrollToElement();
    }
  }, [mapViewIsActive]);

  return (
    <div className="flex flex-col gap-y-4 h-full w-full min-h-screen">
      {!disableInstruction && (
        <HelpText
          content={
            MODELS_CONTENT.modelCreation.trainingDataset.form
              .existingTrainingDatasetSectionDescription
          }
        />
      )}
      <div className="flex flex-col md:flex-row gap-4 md:gap-y-0 w-full justify-between md:items-center">
        <div className="flex flex-col md:flex-row gap-x-4 gap-y-4 md:gap-y-0 w-full">
          <SearchFilter
            query={query}
            updateQuery={updateQuery}
            placeholder="Search datasets by name or id..."
            className="w-full max-w-xl"
          />
          <ClearFilters query={query} clearAllFilters={clearAllFilters} />
        </div>
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
            <span className="text-primary">{selectedTrainingDatasetId || "None"}.</span>
          </p>
        )}
      </div>

      <div
        className={`w-full grid grid-cols-1 ${mapViewIsActive ? "grid-rows-2 h-screen" : ""} lg:grid-rows-1 lg:grid-cols-2 rounded-md gap-x-2 gap-y-6 lg:gap-y-0  min-h-screen`}
      >
        <div
          className={`w-full overflow-y-auto h-full scrollable p-2 lg:row-start-1 ${mapViewIsActive ? "overflow-y-auto" : "lg:col-span-2"}`}
        >
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
            navigateOnClick={navigateOnClick}
          />
        </div>
        {mapViewIsActive && (
          <div
            className="row-start-1 md:border md:border-gray-border overflow-hidden rounded-md"
            id={mapViewElementId}
          >
            {mapDataIsPending || mapDataIsError || mapData.features.length === 0 ? (
              <div className="w-full h-full animate-pulse bg-light-gray flex items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <DatasetsMap mapResults={mapData as FeatureCollection} updateQuery={updateQuery} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
