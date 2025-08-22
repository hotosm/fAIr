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
  return (
    <>
      {activePrediction && (
        <PredictionResultDrawer
          tileServiceUrl={activePrediction.config.source}
          predictionId={activePrediction.id}
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
      <div className="h-full space-y-8">
        {/* Section heading */}
        <div className="flex w-full flex-col items-start justify-between gap-y-6 sm:flex-row sm:items-center sm:gap-y-0">
          <ProfileSectionHeader title={"Predictions"} />
          <SearchFilter
            query={query}
            updateQuery={updateQuery}
            placeholder="Search ..."
            className="w-full max-w-full sm:w-auto"
          />
        </div>
        <div className="flex w-full flex-col justify-between gap-y-6 md:flex-row md:items-center md:gap-y-0">
          <div className="flex w-full items-center justify-between">
            <p className="text-nowrap text-body-3 font-semibold">
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
          <div className="flex w-full items-center justify-between md:justify-end md:gap-x-4">
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
          />
        ) : (
          <OfflinePredictionsList
            isPending={isPending}
            data={data?.results ?? []}
            isError={isError}
            refetch={refetch}
            handleTrainingLogsModal={handleTrainingLogsModal}
            handlePredictionResultModal={handlePredictionResultModal}
          />
        )}
      </div>
    </>
  );
};
