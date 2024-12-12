import { ButtonWithIcon } from "@/components/ui/button";
import { MapIcon, PenIcon } from "@/components/ui/icons";
import {
  APP_CONTENT,
  APPLICATION_ROUTES,
  formatDate,
  truncateString,
} from "@/utils";
import ModelDetailItem from "@/features/models/components/model-detail-item";
import ModelDetailsSection from "@/features/models/components/model-details-section";
import ChevronDownIcon from "@/components/ui/icons/chevron-down-icon";
import { Divider } from "@/components/ui/divider";
import ModelFeedbacks from "@/features/models/components/model-feedbacks";
import ModelFilesButton from "./model-files-button";
import ModelDetailsUpdateDialog from "./dialogs/model-details-update-dialog";
import { useDialog } from "@/hooks/use-dialog";
import { useAuth } from "@/app/providers/auth-provider";
import { useGetTrainingDataset } from "../hooks/use-dataset";
import { TModelDetails } from "@/types";
import { useNavigate } from "react-router-dom";

const ModelDetailsInfo = ({
  data,
  openModelFilesDialog,
  openTrainingAreaDialog,
}: {
  data: TModelDetails;
  openModelFilesDialog: () => void;
  openTrainingAreaDialog: () => void;
}) => {
  const { isOpened, openDialog, closeDialog } = useDialog();
  const { user, isAuthenticated } = useAuth();
  const {
    isPending,
    data: trainingDataset,
    isError,
  } = useGetTrainingDataset(data.dataset);
  const navigate = useNavigate();

  return (
    <>
      <ModelDetailsUpdateDialog
        isOpened={isOpened}
        closeDialog={closeDialog}
        data={data}
      />
      <ModelDetailsSection title="">
        <div className="flex flex-col gap-y-8">
          <div className="inline-flex flex-col gap-y-4">
            <p className="text-gray text-body-2">
              {APP_CONTENT.models.modelsDetailsCard.modelId} {data?.id}
            </p>
            <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-y-8">
              <div className="flex flex-col gap-y-4">
                <h1
                  className="font-semibold text-dark text-title-2 md:text-large-title text-wrap"
                  title={data?.name}
                >
                  {truncateString(data?.name, 40)}
                </h1>
                <p className="text-body-3 text-gray md:text-body-2 text-wrap max-w-lg md:max-w-xl xl:max-w-4xl">
                  {data?.description ??
                    APP_CONTENT.models.modelsDetailsCard
                      .modelDescriptionNotAvailable}
                </p>
              </div>
              <div className="max-w-fit">
                <ButtonWithIcon
                  label={APP_CONTENT.models.modelsDetailsCard.startMapping}
                  variant="primary"
                  size="medium"

                  prefixIcon={MapIcon}
                  disabled={data?.published_training === null}
                  onClick={() => {
                    navigate(
                      `${APPLICATION_ROUTES.START_MAPPING_BASE}${data.id}`,
                    );
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <button
          disabled={data?.published_training === null}
          className="md:self-end flex items-center gap-x-2 cursor-pointer text-primary text-body-2 md:font-semibold"
          onClick={openTrainingAreaDialog}
        >
          <p>{APP_CONTENT.models.modelsDetailsCard.viewTrainingArea}</p>
          <ChevronDownIcon className="icon -rotate-90" />
        </button>
      </ModelDetailsSection>
      <Divider />
      <ModelDetailsSection title="Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-9">
          <div className="flex flex-col gap-y-4">
            <ModelDetailItem
              label={APP_CONTENT.models.modelsDetailsCard.createdBy}
              value={data?.user.username}
            />
            <ModelDetailItem
              label={APP_CONTENT.models.modelsDetailsCard.createdOn}
              value={formatDate(data?.created_at)}
            />
            <ModelDetailItem
              label={APP_CONTENT.models.modelsDetailsCard.lastModified}
              value={formatDate(data?.last_modified)}
            />
          </div>
          <div className="col-span-1 items-start justify-between flex flex-col gap-y-4">
            <div className="text-dark text-body-2 flex w-full gap-x-1 text-nowrap flex-wrap">
              <span className="text-gray">
                {APP_CONTENT.models.modelsDetailsCard.datasetName}
              </span>
              {isPending ? (
                <p className="h-6 ml-2 w-20 animate-pulse bg-light-gray"></p>
              ) : isError ? (
                <span>Error retrieving dataset info</span>
              ) : (
                <p title={trainingDataset?.name}>
                  {truncateString(trainingDataset?.name, 40)}
                </p>
              )}
            </div>
            <div className="text-dark text-body-2 flex gap-x-1">
              <span className="text-gray">
                {APP_CONTENT.models.modelsDetailsCard.datasetId}
              </span>
              <p>{data?.dataset}</p>
            </div>
            <ModelFilesButton
              openModelFilesDialog={openModelFilesDialog}
              disabled={data?.published_training === null}
            />
          </div>

          <div className="col-span-1 flex flex-col md:items-end md:justify-between gap-y-4">
            <div>
              {isAuthenticated && user.osm_id === data.user.osm_id && (
                <button
                  className="flex items-center gap-x-4"
                  onClick={openDialog}
                >
                  <PenIcon className="icon" />{" "}
                  <span>
                    {" "}
                    {
                      APP_CONTENT.models.modelsDetailsCard.modelUpdate
                        .editButtonText
                    }
                  </span>
                </button>
              )}
            </div>
            <ModelFeedbacks trainingId={data?.published_training} />
          </div>
        </div>
      </ModelDetailsSection>
    </>
  );
};
export default ModelDetailsInfo;
