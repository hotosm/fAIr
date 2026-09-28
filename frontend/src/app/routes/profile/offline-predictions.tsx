import { useAuth } from "@/app/providers/auth-provider";
import { Head } from "@/components/seo";
import { APPLICATION_ROUTES } from "@/constants/routes";
import { useNavigate } from "react-router-dom";
import { MapRequestsTable } from "@/features/user-profile/components/overview/map-requests-table";
import { MapRequestsHeader } from "@/features/user-profile/components/map-requests/map-requests-header";
import { MapRequestsFilters } from "@/features/user-profile/components/map-requests/map-requests-filters";
import { MapRequestsToolbar } from "@/features/user-profile/components/map-requests/map-requests-toolbar";
import { MapRequestsActionsMenu } from "@/features/user-profile/components/map-requests/map-requests-actions-menu";
import { useOfflinePredictionsQueryParams } from "@/features/user-profile/hooks/use-predictions";
import { TNewOfflinePrediction } from "@/types";

export const UserProfileOfflinePredictionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const viewResult = (prediction: TNewOfflinePrediction) =>
    navigate(
      APPLICATION_ROUTES.MAP_REQUEST_RESULT.replace(":id", String(prediction.id)),
      { state: { prediction } },
    );

  const {
    data,
    isError,
    isPending,
    isPlaceholderData,
    query,
    updateQuery,
  } = useOfflinePredictionsQueryParams(user.osm_id);


 
  



  return (
    <>
      {/* {activePrediction && (
        <CreateMapswipeProjectDialog
          isOpened={isMapSwipeProjectCreationDialogOpened}
          closeDialog={closeMapSwipeProjectCreationDialog}
          predictionResult={activePrediction}
          openProjectStatus={handleCreateOrViewMapSwipeProject}
        />
      )} */}
      {/* {activePrediction && (
        <MapswipeProjectStatusDialog
          isOpen={isMapSwipeProjectStatusDialogOpened}
          onClose={closeMapSwipeProjectStatusDialog}
          mapSwipeProjectId={activePrediction.mapswipe_project_id as string}
          handleMapSwipeProjectResultMapModal={
            handleMapSwipeProjectResultMapModal
          }
        />
      )} */}

      {/* {activePrediction && MapSwipeResultsPmtiles && (
        <MapSwipeProjectResultMapDrawer
          tileServiceUrl={activePrediction.image_uri}
          predictionId={activePrediction.id}
          isOpened={isMapSwipeProjectResultMapOpened}
          closeDialog={handleCloseMapSwipeProjectResultMapModal}
          pmtilesUrl={MapSwipeResultsPmtiles}
        />
      )}
     */}
    
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
          onViewResult={viewResult}
          renderRowMenu={(prediction) => (
            <MapRequestsActionsMenu
              prediction={prediction}
            />
          )}
        />
      </div>
    </>
  );
};
