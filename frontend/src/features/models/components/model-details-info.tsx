import { ButtonWithIcon } from "@/components/ui/button";
import { MapIcon, PenIcon } from "@/components/ui/icons";
import { APP_CONTENT, formatDate, truncateString } from "@/utils";
import ModelDetailItem from "@/features/models/components/model-detail-item";
import ModelDetailsSection from "@/features/models/components/model-details-section";
import ChevronDownIcon from "@/components/ui/icons/chevron-down-icon";
import { Divider } from "@/components/ui/divider";
import ModelFeedbacks from "@/features/models/components/model-feedbacks";
import ModelFilesButton from "./model-files-button";
import ModelDetailsUpdateDialog from "./dialogs/model-details-update-dialog";
import { useDialog } from "@/hooks/use-dialog";
import { useAuth } from "@/app/providers/auth-provider";

const ModelDetailsInfo = ({
  data,
  openModelFilesDialog,
  openTrainingAreaDialog,
}: {
  data: any;
  openModelFilesDialog: () => void;
  openTrainingAreaDialog: () => void;
}) => {
  const { isOpened, openDialog, closeDialog } = useDialog();
  const { user, isAuthenticated } = useAuth();

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
                  capitalizeText={false}
                  prefixIcon={MapIcon}
                  disabled={data?.published_training === null}
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
              value={formatDate(data?.created_at as string)}
            />
            <ModelDetailItem
              label={APP_CONTENT.models.modelsDetailsCard.lastModified}
              value={formatDate(data?.last_modified as string)}
            />
          </div>
          <div className="col-span-1 items-start justify-between flex flex-col gap-y-4">
            <p className="text-dark text-body-2 ">
              <span className="text-gray">
                {APP_CONTENT.models.modelsDetailsCard.trainingId}{" "}
              </span>
              Training_{data?.published_training}
            </p>
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
            <ModelFeedbacks trainingId={data?.published_training as number} />
          </div>
        </div>
      </ModelDetailsSection>
    </>
  );
};
export default ModelDetailsInfo;
