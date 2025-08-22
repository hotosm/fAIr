import { useAuth } from "@/app/providers/auth-provider";
import { Head } from "@/components/seo";
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
    !!datasetId
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
      <div className="flex h-screen w-full flex-col items-center justify-center gap-y-10">
        <p className="inline-flex gap-x-2">
          Error loading dataset <span className="font-bold">{datasetId}.</span>
        </p>
        <Button className="!w-fit" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }
  const showEditOptions = isAuthenticated && user?.osm_id === data.user.osm_id;
  return (
    <>
      <Head title={`${data.name} Dataset`} />
      {showEditOptions && (
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
        </>
      )}
      <DatasetAreaDrawer
        isOpened={isDatasetAreaDrawerOpened}
        closeDialog={closeDatasetAreaDrawer}
        trainingDataset={data}
      />
      <BackButton className="my-6" />
      <p className="text-body-2base text-grey">Dataset ID: {data.id}</p>
      <div className="flex flex-col gap-y-8">
        <div className="my-4 grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-5 ">
          <div className="col-span-4 flex flex-col gap-y-8 ">
            <h1
              className="text-title-2 font-semibold leading-tight text-dark md:text-large-title"
              title={data.name}
            >
              {truncateString(data.name, 40)}
            </h1>
            <div className="flex flex-col gap-4 md:flex-row">
              <p className="text-nowrap text-body-2 text-dark">
                <span className="text-grey">Used by:</span> {data.models_count}{" "}
                {data.models_count > 1 ? "models" : "model"}
              </p>
              <p className="text-nowrap text-body-2 text-dark">
                <span className="text-grey">Created by:</span>{" "}
                {data.user.username}
              </p>
              <p className="text-body-2 text-dark">
                <span className="text-grey">Last Modified:</span>{" "}
                {formatDate(data.last_modified)}
              </p>
            </div>
            <div className="flex items-center text-body-2 text-dark">
              <span className="mr-2 text-grey">Source Image:</span>
              <CopyButton text={data.source_imagery} />
            </div>
          </div>
          <div className="col-span-1 flex h-full w-fit  flex-col gap-y-8 lg:w-full lg:items-end lg:justify-between">
            <ButtonWithIcon
              label="Use Dataset"
              variant={ButtonVariant.PRIMARY}
              size="medium"
              prefixIcon={DatabaseIcon}
              onClick={() => {
                navigate(
                  `${APPLICATION_ROUTES.CREATE_NEW_MODEL}/?${DatasetURLParams.DATASET_ID}=${data.id}&${DatasetURLParams.DATASET_NAME}=${data.name}&${DatasetURLParams.DATASET_SOURCE_IMAGERY}=${data.source_imagery}`
                );
              }}
              className="!w-fit"
            />
            <DatasetAreaButton
              onClick={openDatasetAreaDrawer}
              disabled={false}
            />
            {/* Edit Dropdown  */}
            <div className="flex items-start justify-start lg:justify-end">
              {showEditOptions && (
                <DropDown
                  ref={dropdownRef}
                  className="bg-white"
                  triggerComponent={
                    <button className="flex items-center space-x-2 text-nowrap text-body-3 hover:text-dark md:text-body-2">
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
            disableStatusFilter
            status={0}
          />
        </div>
      </div>
    </>
  );
};
