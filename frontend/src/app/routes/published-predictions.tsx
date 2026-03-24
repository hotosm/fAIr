import { Head } from "@/components/seo";
import { PublishedPredictionsFilters } from "@/features/published-predictions/components/published-predictions-filters";
import { PublishedPredictionsGrid } from "@/features/published-predictions/components/published-predictions-grid";
import { usePublishedPredictions } from "@/features/published-predictions/hooks/use-published-predictions";
import { PredictionResultDrawer } from "@/features/user-profile/components/offline-predictions/predictions-results-drawer";
import { FeatureCollection, TOfflinePrediction } from "@/types";
import { useEffect, useState } from "react";
import { useDialog } from "@/hooks/use-dialog";
import PageHeader from "@/features/models/components/header";
import { MapswipeProjectStatusDialog } from "@/features/mapswipe/components/project-status-dialog";
import {
  useScrollToElement,
  useScrollToTop,
} from "@/hooks/use-scroll-to-element";
import { LayoutView } from "@/enums";
import { PublishedPredictionsListLayout } from "@/features/published-predictions/components/published-predictions-table";
import { Spinner } from "@/components/ui/spinner";
import { PublishedPredictionsMap } from "@/features/published-predictions/components/published-predictions-map";

export const PublishedPredictionsPage = () => {
  const {
    data,
    isPending,
    isError,
    isPlaceholderData,
    refetch,
    search,
    ordering,
    layout,
    query,
    offset,
    setMapView,
    setSearch,
    setOrdering,
    setLayout,
    mapViewIsActive,
    mapData,
    isMapDataPending,
    isMapDataError,
    goToNextPage,
    goToPrevPage,
    setPredictionId,
    clearAllFilters,
  } = usePublishedPredictions();

  const [activePrediction, setActivePrediction] =
    useState<TOfflinePrediction | null>(null);

  const {
    isOpened: isPredictionResultOpened,
    openDialog: openPredictionResultDialog,
    closeDialog: closePredictionResultDialog,
  } = useDialog();

  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState<boolean>(false);
  const mapViewElementId = "published-predictions-map-view";
  const { scrollToElement } = useScrollToElement(mapViewElementId);
  const { scrollToTop } = useScrollToTop();

  const isListView = layout === LayoutView.LIST;

  const handleViewResults = (prediction: TOfflinePrediction) => {
    setActivePrediction(prediction);
    openPredictionResultDialog();
  };

  const handleViewDetails = (prediction: TOfflinePrediction) => {
    setActivePrediction(prediction);
    setIsDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailDialogOpen(false);
    setActivePrediction(null);
  };

  useEffect(() => {
    if (mapViewIsActive) {
      scrollToElement();
    } else {
      scrollToTop();
    }
  }, [mapViewIsActive, scrollToElement, scrollToTop]);

  const renderContent = () => {
    if (mapViewIsActive) {
      return (
        <div className="w-full grid grid-cols-1 grid-rows-2 lg:grid-rows-1 lg:grid-cols-2 md:border rounded-md lg:p-2 md:border-gray-border gap-x-2 mt-6 gap-y-6 lg:gap-y-0 h-screen">
          <div className="w-full overflow-y-auto lg:row-start-1">
            <PublishedPredictionsGrid
              data={data?.results ?? []}
              isPending={isPending}
              isError={isError}
              refetch={refetch}
              isMapView={mapViewIsActive}
              onViewResults={handleViewResults}
              onViewDetails={handleViewDetails}
            />
          </div>
          <div className="row-start-1" id={mapViewElementId}>
            {isMapDataPending ||
            isMapDataError ||
            !mapData ||
            mapData.features.length === 0 ? (
              <div className="w-full h-full animate-pulse bg-light-gray flex items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <PublishedPredictionsMap
                mapResults={mapData as FeatureCollection}
                setPredictionId={setPredictionId}
              />
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="mt-6">
        {isListView ? (
          <PublishedPredictionsListLayout
            data={data?.results ?? []}
            isPending={isPending}
            isError={isError}
            refetch={refetch}
            onViewResults={handleViewResults}
            onViewDetails={handleViewDetails}
          />
        ) : (
          <PublishedPredictionsGrid
            data={data?.results ?? []}
            isPending={isPending}
            isError={isError}
            refetch={refetch}
            onViewResults={handleViewResults}
            onViewDetails={handleViewDetails}
          />
        )}
      </div>
    );
  };
  return (
    <>
      <Head title="Public AI Predictions" />

      {/* Prediction result drawer (reused from existing feature) */}
      {activePrediction && (
        <PredictionResultDrawer
          tileServiceUrl={activePrediction.config.source}
          predictionId={activePrediction.id}
          folder={activePrediction.config.folder}
          isOpened={isPredictionResultOpened}
          closeDialog={() => {
            setActivePrediction(null);
            closePredictionResultDialog();
          }}
        />
      )}

      {/* Detail dialog */}
      {activePrediction && (
        <MapswipeProjectStatusDialog
          isOpen={isDetailDialogOpen}
          onClose={handleCloseDetail}
          mapSwipeProjectId={activePrediction.mapswipe_id ?? ""}
          handleMapSwipeProjectResultMapModal={(pmtiles: string) => {
            // Can be expanded to open a PM tiles viewer if requested
            window.open(pmtiles, "_blank");
          }}
        />
      )}

      <section className="my-10 min-h-screen">
        {/* Page header */}
        <PageHeader
          title="Public AI Predictions"
          description={
            "This is a list of published predictions that has been produced by community users and made public. Any user can public predictions by using Prediction Request feature under and published from their profile."
          }
          disableCreateButton
          isTrainingDataset
        />

        {/* Filters */}
        <PublishedPredictionsFilters
          search={search}
          onSearchChange={setSearch}
          ordering={ordering}
          onOrderingChange={setOrdering}
          layout={layout}
          onMapViewChange={setMapView}
          mapViewIsActive={mapViewIsActive}
          clearAllFilters={clearAllFilters}
          onLayoutChange={setLayout}
          query={query}
          totalCount={data?.count ?? 0}
          offset={offset}
          hasNextPage={data?.hasNext ?? false}
          hasPrevPage={data?.hasPrev ?? false}
          onNextPage={goToNextPage}
          onPrevPage={goToPrevPage}
          isPlaceholderData={isPlaceholderData}
        />

        {/* Content */}
        <div className="mt-6">{renderContent()}</div>
      </section>
    </>
  );
};
