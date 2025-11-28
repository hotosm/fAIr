import { useAuth } from "@/app/providers/auth-provider";
import { Head } from "@/components/seo";
import { OrderingFilter, Pagination, SearchFilter } from "@/components/shared";
import { LayoutToggle } from "@/components/shared/layout-toggle";
import { LayoutView } from "@/enums";
import { ProfileSectionHeader } from "@/features/user-profile/components";
import OfflinePredictionsTable from "@/features/user-profile/components/offline-predictions/offline-predictions-table";
import { OfflinePredictionsList } from "@/features/user-profile/components/offline-predictions/offline-predictions-list";
import { useOfflinePredictionsQueryParams } from "@/features/user-profile/hooks/use-predictions";
import { SEARCH_PARAMS } from "@/utils/search-params";
import { useDialog } from "@/hooks/use-dialog";
import { useState } from "react";
import { TOfflinePrediction } from "@/types";
import { PredictionResultDrawer } from "@/features/user-profile/components/predictions-results-drawer";
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
    refetch,
  } = useOfflinePredictionsQueryParams(user.osm_id);
  const { isOpened, openDialog, closeDialog } = useDialog();
  const {
    isOpened: isPredictionResultOpened,
    openDialog: openPredictionResultDialog,
    closeDialog: closePredictionResultDialog,
  } = useDialog();

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
  const handleTrainingLogsModal = (taskId: string) => {
    setActiveTaskId(taskId);
    openDialog();
  };
  const handlePredictionResultModal = (prediction: TOfflinePrediction) => {
    setActivePrediction(prediction);
    openPredictionResultDialog();
  };

  const handleMapSwipeProjectResultMapModal = (pmtiles: string) => {
    console.log(pmtiles, activePrediction);
    openMapSwipeProjectResultMapDialog();
  };

  const handleCreateOrViewMapSwipeProject = (
    prediction: TOfflinePrediction,
  ) => {
    const mapSwipeProjectExists = prediction.mapswipe_id;
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
        />
      )}
      {activePrediction && (
        <MapswipeProjectStatusDialog
          isOpen={isMapSwipeProjectStatusDialogOpened}
          onClose={closeMapSwipeProjectStatusDialog}
          mapSwipeProjectId={activePrediction.mapswipe_id as string}
          handleMapSwipeProjectResultMapModal={
            handleMapSwipeProjectResultMapModal
          }
        />
      )}

      {activePrediction && (
        <MapSwipeProjectResultMapDrawer
          tileServiceUrl={activePrediction.config.source}
          predictionId={activePrediction.id}
          folder={activePrediction.config.folder}
          isOpened={isMapSwipeProjectResultMapOpened}
          closeDialog={() => {
            closeMapSwipeProjectResultMapDialog();
          }}
        />
      )}
      {activePrediction && (
        <PredictionResultDrawer
          tileServiceUrl={activePrediction.config.source}
          predictionId={activePrediction.id}
          folder={activePrediction.config.folder}
          isOpened={isPredictionResultOpened}
          closeDialog={() => {
            // Cleanup to ensure fresh rendering
            setActivePrediction(null);
            closePredictionResultDialog();
          }}
        />
      )}
      {activeTaskId && (
        <TrainingLogsDialog
          taskId={activeTaskId}
          isOpened={isOpened}
          closeDialog={closeDialog}
        />
      )}
      <Head title="Offline Predictions" />
      <div className="space-y-8 h-full">
        {/* Section heading */}
        <div className="w-full gap-y-6 sm:gap-y-0 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <ProfileSectionHeader title={"Predictions"} />
          <SearchFilter
            query={query}
            updateQuery={updateQuery}
            placeholder="Search ..."
            className="w-full max-w-full sm:w-auto"
          />
        </div>
        <div className="flex gap-y-6 flex-col md:flex-row md:gap-y-0 w-full justify-between md:items-center">
          <div className="flex items-center justify-between w-full">
            <p className="text-body-3 font-semibold text-nowrap">
              {data?.count} prediction
              {data?.count && data?.count > 1 ? "s" : ""}
            </p>
            <LayoutToggle
              query={query}
              updateQuery={updateQuery}
              isMobile
              iconSize="icon"
            />
          </div>
          <div className="flex w-full justify-between md:justify-end items-center md:gap-x-4">
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
            <LayoutToggle
              query={query}
              updateQuery={updateQuery}
              iconSize="icon"
            />
          </div>
        </div>
        {query[SEARCH_PARAMS.layout] === LayoutView.LIST ? (
          <OfflinePredictionsTable
            data={data?.results ?? []}
            isError={isError}
            isPending={isPending}
            handleTrainingLogsModal={handleTrainingLogsModal}
            handlePredictionResultModal={handlePredictionResultModal}
            handleCreateOrViewMapSwipeProject={
              handleCreateOrViewMapSwipeProject
            }
          />
        ) : (
          <OfflinePredictionsList
            isPending={isPending}
            data={data?.results ?? []}
            isError={isError}
            refetch={refetch}
            handleTrainingLogsModal={handleTrainingLogsModal}
            handlePredictionResultModal={handlePredictionResultModal}
            handleCreateOrViewMapSwipeProject={
              handleCreateOrViewMapSwipeProject
            }
          />
        )}
      </div>
    </>
  );
};
