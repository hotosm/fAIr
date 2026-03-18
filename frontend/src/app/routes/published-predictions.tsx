import { Head } from "@/components/seo";
import { PublishedPredictionsFilters } from "@/features/published-predictions/components/published-predictions-filters";
import { PublishedPredictionsGrid } from "@/features/published-predictions/components/published-predictions-grid";
import { usePublishedPredictions } from "@/features/published-predictions/hooks/use-published-predictions";
import { PredictionResultDrawer } from "@/features/user-profile/components/offline-predictions/predictions-results-drawer";
import { TOfflinePrediction } from "@/types";
import { useState } from "react";
import { useDialog } from "@/hooks/use-dialog";
import PageHeader from "@/features/models/components/header";
import { MapswipeProjectStatusDialog } from "@/features/mapswipe/components/project-status-dialog";
import { usePredictionModelsMeta } from "@/features/published-predictions/hooks/use-prediction-model-meta";

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
    offset,
    setSearch,
    setOrdering,
    setLayout,
    goToNextPage,
    goToPrevPage,
  } = usePublishedPredictions();

  const [activePrediction, setActivePrediction] =
    useState<TOfflinePrediction | null>(null);

  const {
    isOpened: isPredictionResultOpened,
    openDialog: openPredictionResultDialog,
    closeDialog: closePredictionResultDialog,
  } = useDialog();
  const predictions = data?.results ?? [];
  const { modelNamesById, modelOwnersById } =
    usePredictionModelsMeta(predictions);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

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

  return (
    <>
      <Head title="AI Predictions" />

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
          title="AI Predictions"
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
          onLayoutChange={setLayout}
          totalCount={data?.count ?? 0}
          offset={offset}
          hasNextPage={data?.hasNext ?? false}
          hasPrevPage={data?.hasPrev ?? false}
          onNextPage={goToNextPage}
          onPrevPage={goToPrevPage}
          isPlaceholderData={isPlaceholderData}
        />

        {/* Content */}
        <div className="mt-6">
          <PublishedPredictionsGrid
            data={data?.results ?? []}
            isPending={isPending}
            isError={isError}
            modelNamesById={modelNamesById}
            modelOwnersById={modelOwnersById}
            refetch={refetch}
            onViewResults={handleViewResults}
            onViewDetails={handleViewDetails}
          />
        </div>
      </section>
    </>
  );
};
