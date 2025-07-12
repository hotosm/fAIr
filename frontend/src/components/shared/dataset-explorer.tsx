import { DatasetList } from "@/features/datasets/components";
import { useDatasetsQueryParams } from "@/features/datasets/hooks/use-query-params";
import {
  ClearFilters,
  OrderingFilter,
  Pagination,
  SearchFilter,
} from "@/components/shared";
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
    <div className="flex size-full min-h-screen flex-col gap-y-4">
      {!disableInstruction && (
        <HelpText
          content={
            MODELS_CONTENT.modelCreation.trainingDataset.form
              .existingTrainingDatasetSectionDescription
          }
        />
      )}
      <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:items-center md:gap-y-0">
        <div className="flex w-full flex-col gap-4 md:flex-row md:gap-y-0">
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

      <div className="flex w-full flex-col justify-between gap-y-6 md:gap-y-0">
        <p className="text-body-3 font-semibold">{data?.count} datasets</p>
        <div className="flex w-full items-center justify-between md:justify-end md:gap-x-6">
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

      <div
        className={`grid w-full grid-cols-1 ${mapViewIsActive ? "h-screen grid-rows-2" : ""} min-h-screen gap-x-2 gap-y-6 rounded-md lg:grid-cols-2 lg:grid-rows-1  lg:gap-y-0`}
      >
        <div
          className={`scrollable size-full overflow-y-auto p-2 lg:row-start-1 ${mapViewIsActive ? "overflow-y-auto" : "lg:col-span-2"}`}
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
            className="row-start-1 overflow-hidden rounded-md md:border md:border-gray-border"
            id={mapViewElementId}
          >
            {mapDataIsPending ||
            mapDataIsError ||
            mapData.features.length === 0 ? (
              <div className="flex size-full animate-pulse items-center justify-center bg-light-gray">
                <Spinner />
              </div>
            ) : (
              <DatasetsMap
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
