import { useAuth } from "@/app/providers/auth-provider";
import { Head } from "@/components/seo";
import { MapRequestsTable } from "@/features/user-profile/components/overview/map-requests-table";
import { MapRequestsHeader } from "@/features/user-profile/components/map-requests/map-requests-header";
import { MapRequestsFilters } from "@/features/user-profile/components/map-requests/map-requests-filters";
import { MapRequestsToolbar } from "@/features/user-profile/components/map-requests/map-requests-toolbar";
import { MapRequestsActionsMenu } from "@/features/user-profile/components/map-requests/map-requests-actions-menu";
import { useOfflinePredictionsQueryParams } from "@/features/user-profile/hooks/use-predictions";
import { useDialog } from "@/hooks/use-dialog";
import { useState } from "react";
import { TOfflinePrediction } from "@/types";
import { TrainingLogsDialog } from "@/features/user-profile/components/training-logs-dialog";
import { CreateMapswipeProjectDialog } from "@/features/mapswipe/components/project-creation-dialog";
import { MapswipeProjectStatusDialog } from "@/features/mapswipe/components/project-status-dialog";
import { MapSwipeProjectResultMapDrawer } from "@/features/mapswipe/components/project-results-map";

export const UserProfileOfflinePredictionsPage = () => {
  const { user } = useAuth();
  const {
    data,
    isError,
    isPending,
    isPlaceholderData,
    query,
    updateQuery,
  } = useOfflinePredictionsQueryParams(user.osm_id);
  const { isOpened, openDialog, closeDialog } = useDialog();


  const {
    isOpened: isMapSwipeProjectResultMapOpened,
    openDialog: openMapSwipeProjectResultMapDialog,
    closeDialog: closeMapSwipeProjectResultMapDialog,
  } = useDialog();

  const {
    isOpened: isMapSwipeProjectCreationDialogOpened,
    openDialog: openMapSwipeProjectCreationDialog,
    closeDialog: closeMapSwipeProjectCreationDialog,
  } = useDialog();

  const {
    isOpened: isMapSwipeProjectStatusDialogOpened,
    openDialog: openMapSwipeProjectStatusDialog,
    closeDialog: closeMapSwipeProjectStatusDialog,
  } = useDialog();

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activePrediction, setActivePrediction] =
    useState<TOfflinePrediction | null>(null);

  const [MapSwipeResultsPmtiles, setMapSwipeResultsPmtiles] = useState<
    string | null
  >(null);
 
  const handlePredictionResultModal = (prediction: TOfflinePrediction) => {
    setActivePrediction(prediction);
  //  Set go to results page here
  };

  const handleMapSwipeProjectResultMapModal = (pmtiles: string) => {
    setMapSwipeResultsPmtiles(pmtiles);
    closeMapSwipeProjectStatusDialog();
    openMapSwipeProjectResultMapDialog();
  };

  const handleCloseMapSwipeProjectResultMapModal = () => {
    closeMapSwipeProjectResultMapDialog();
    openMapSwipeProjectStatusDialog();
    setMapSwipeResultsPmtiles(null);
  };
  const handleCreateOrViewMapSwipeProject = (
    prediction: TOfflinePrediction,
  ) => {
    const mapSwipeProjectExists = prediction.mapswipe_project_id;
    if (!mapSwipeProjectExists) {
      openMapSwipeProjectCreationDialog();
    } else {
      openMapSwipeProjectStatusDialog();
    }
    setActivePrediction(prediction);
  };
  return (
    <>
      {activePrediction && (
        <CreateMapswipeProjectDialog
          isOpened={isMapSwipeProjectCreationDialogOpened}
          closeDialog={closeMapSwipeProjectCreationDialog}
          predictionResult={activePrediction}
          openProjectStatus={handleCreateOrViewMapSwipeProject}
        />
      )}
      {activePrediction && (
        <MapswipeProjectStatusDialog
          isOpen={isMapSwipeProjectStatusDialogOpened}
          onClose={closeMapSwipeProjectStatusDialog}
          mapSwipeProjectId={activePrediction.mapswipe_project_id as string}
          handleMapSwipeProjectResultMapModal={
            handleMapSwipeProjectResultMapModal
          }
        />
      )}

      {activePrediction && MapSwipeResultsPmtiles && (
        <MapSwipeProjectResultMapDrawer
          tileServiceUrl={activePrediction.image_uri}
          predictionId={activePrediction.id}
          isOpened={isMapSwipeProjectResultMapOpened}
          closeDialog={handleCloseMapSwipeProjectResultMapModal}
          pmtilesUrl={MapSwipeResultsPmtiles}
        />
      )}
    
      {activeTaskId && (
        <TrainingLogsDialog
          taskId={activeTaskId}
          isOpened={isOpened}
          closeDialog={closeDialog}
        />
      )}
      <Head title="Map Requests" />
      <div className="space-y-6 h-full">
        <MapRequestsHeader />

        <MapRequestsFilters query={query} updateQuery={updateQuery} />

        <MapRequestsToolbar
          count={data?.count ?? 0}
          query={query}
          updateQuery={updateQuery}
          hasNextPage={Boolean(data?.hasNext) && !isPlaceholderData}
          hasPrevPage={Boolean(data?.hasPrev)}
          disabled={isError || isPending}
        />

        <MapRequestsTable
          requests={data?.results ?? []}
          isError={isError}
          isPending={isPending}
          onViewResult={handlePredictionResultModal}
          renderRowMenu={(prediction) => (
            <MapRequestsActionsMenu
              prediction={prediction}
              onCreateMapswipe={handleCreateOrViewMapSwipeProject}
            />
          )}
        />
      </div>
    </>
  );
};
