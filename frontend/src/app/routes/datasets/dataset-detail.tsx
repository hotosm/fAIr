import { useAuth } from "@/app/providers/auth-provider";
import { ModelExplorer } from "@/components/shared/model-explorer";
import { BackButton, Button, ButtonWithIcon } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Divider } from "@/components/ui/divider";
import { DropDown } from "@/components/ui/dropdown";
import { DatabaseIcon, PenIcon } from "@/components/ui/icons";
import { APPLICATION_ROUTES, DatasetURLParams } from "@/constants";
import { ButtonVariant } from "@/enums";
import { DatasetAreaButton } from "@/features/datasets/components/dataset-area-button";
import { DatasetDetailSkeleton } from "@/features/datasets/components/dataset-detail-skeleton";
import { DatasetEditDialog } from "@/features/datasets/components/dialogs/dataset-details-edit-dialog";
import { DatasetAOIEditDrawer } from "@/features/datasets/components/drawers/dataset-aoi-edit-drawer";
import { DatasetAreaDrawer } from "@/features/datasets/components/drawers/dataset-area-drawer";
import { useGetTrainingDataset } from "@/features/datasets/hooks/use-datasets";
import { useDialog } from "@/hooks/use-dialog";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { formatDate, truncateString } from "@/utils";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export const TrainingDatasetsDetailPage = () => {
  const { id } = useParams();
  const datasetId = id ? parseInt(id, 10) : undefined;
  const { data, isPending, isError, refetch, error } = useGetTrainingDataset(
    datasetId as number,
    !!datasetId,
  );

  const { isAuthenticated, user } = useAuth();
  const { dropdownRef, onDropdownHide } = useDropdownMenu();
  const { isOpened, openDialog, closeDialog } = useDialog();
  const {
    isOpened: isDatasetAreaDrawerOpened,
    openDialog: openDatasetAreaDrawer,
    closeDialog: closeDatasetAreaDrawer,
  } = useDialog();
  const {
    isOpened: AOIEditDrawerIsOpened,
    openDialog: openAOIEditDrawer,
    closeDialog: closeAOIEditDrawer,
  } = useDialog();
  const navigate = useNavigate();
  /**
   * Redirect to 404 page if dataset is not found.
   */
  useEffect(() => {
    if (isError) {
      const status = (error as { status?: number })?.status;
      if (status === 404) {
        navigate(APPLICATION_ROUTES.NOTFOUND, {
          state: { from: APPLICATION_ROUTES.DATASETS },
        });
      }
    }
  }, [isError, error]);

  if (isPending || !data) {
    return <DatasetDetailSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen gap-y-10">
        <p className="inline-flex gap-x-2">
          Error loading dataset <span className="font-bold">{datasetId}.</span>
        </p>
        <Button className="!w-fit" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <DatasetEditDialog
        data={data}
        isOpened={isOpened}
        closeDialog={closeDialog}
      />
      <DatasetAOIEditDrawer
        isOpened={AOIEditDrawerIsOpened}
        closeDialog={closeAOIEditDrawer}
        trainingDataset={data}
      />
      <DatasetAreaDrawer
        isOpened={isDatasetAreaDrawerOpened}
        closeDialog={closeDatasetAreaDrawer}
        trainingDataset={data}
      />

      <BackButton className="my-6" />
      <p className="text-grey text-body-2base">Dataset ID: {data.id}</p>
      <div className="flex flex-col gap-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start my-4 w-full ">
          <div className="flex flex-col gap-y-8 col-span-4 ">
            <h1
              className="font-semibold text-dark text-title-2 md:text-large-title leading-tight"
              title={data.name}
            >
              {truncateString(data.name, 40)}
            </h1>
            <div className="flex flex-col md:flex-row gap-4">
              <p className="text-dark text-body-2 text-nowrap">
                <span className="text-grey">Used by:</span> {data.models_count}{" "}
                {data.models_count > 1 ? "models" : "model"}
              </p>
              <p className="text-dark text-body-2 text-nowrap">
                <span className="text-grey">Created by:</span>{" "}
                {data.user.username}
              </p>
              <p className="text-dark text-body-2">
                <span className="text-grey">Last Modified:</span>{" "}
                {formatDate(data.last_modified)}
              </p>
            </div>
            <div className="flex items-center text-body-2 text-dark">
              <span className="text-grey mr-2">Source Image:</span>
              <CopyButton text={data.source_imagery} />
            </div>
          </div>
          <div className="flex flex-col col-span-1 w-fit  lg:w-full gap-y-8 lg:justify-between h-full lg:items-end">
            <ButtonWithIcon
              label="Use Dataset"
              variant={ButtonVariant.PRIMARY}
              size="medium"
              prefixIcon={DatabaseIcon}
              onClick={() => {
                navigate(
                  `${APPLICATION_ROUTES.CREATE_NEW_MODEL}/?${DatasetURLParams.DATASET_ID}=${data.id}&${DatasetURLParams.DATASET_NAME}=${data.name}&${DatasetURLParams.DATASET_SOURCE_IMAGERY}=${data.source_imagery}`,
                );
              }}
              className="!w-fit"
            />
            <DatasetAreaButton onClick={openDatasetAreaDrawer} disabled={false} />
            {/* Edit Dropdown  */}
            <div className="flex justify-start lg:justify-end items-start">
              {isAuthenticated && user?.osm_id === data.user.osm_id && (
                <DropDown
                  ref={dropdownRef}
                  className="bg-white"
                  triggerComponent={
                    <button className="flex items-center space-x-2 text-nowrap text-body-3 md:text-body-2 hover:text-dark">
                      <PenIcon className="icon" />
                      <span>Edit Dataset</span>
                    </button>
                  }
                  menuItems={[
                    {
                      name: "Edit Details",
                      value: "Edit Details",
                      onClick: () => {
                        openDialog();
                        onDropdownHide();
                      },
                    },
                    {
                      name: "Edit Area of Interest",
                      value: "Edit Area of Interest",
                      onClick: () => {
                        openAOIEditDrawer();
                        onDropdownHide();
                      },
                    },
                  ]}
                ></DropDown>
              )}
            </div>
          </div>
        </div>
        <Divider />
        <div>
          <ModelExplorer
            title="Models Using this Dataset"
            datasetId={data.id}
          />
        </div>
      </div>
    </>
  );
};
