import { Head } from "@/components/seo";
import { ButtonWithIcon } from "@/components/ui/button";
import { StarStackIcon } from "@/components/ui/icons";
import {
  ModelDetailsSection,
  ModelDetailsProperties,
  ModelDetailsInfo,
  TrainingHistoryTable,
} from "@/features/models/components";
import {
  TrainingAreaDialog,
  ModelFilesDialog,
} from "@/features/models/components/dialogs";
import { ModelDetailsSkeleton } from "@/features/models/components/skeletons";
import { useModelDetails } from "@/features/models/hooks/use-models";
import { useDialog } from "@/hooks/use-dialog";
import { APP_CONTENT, APPLICATION_ROUTES } from "@/utils";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TrainingInProgressImage from "@/assets/images/training_in_prorgress.png";
import { Image } from "@/components/ui/image";
export const ModelDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { isOpened, closeDialog, openDialog } = useDialog();
  const {
    isOpened: isModelFilesDialogOpened,
    closeDialog: closeModelFilesDialog,
    openDialog: openModelFilesDialog,
  } = useDialog();
  const navigate = useNavigate();
  const { data, isPending, isError, error } = useModelDetails(id as string);

  useEffect(() => {
    if (isError) {
      navigate(APPLICATION_ROUTES.NOTFOUND, {
        state: {
          from: window.location.pathname,
          //@ts-expect-error bad type definition
          error: error?.response?.data?.detail,
        },
      });
    }
  }, [isError, error, navigate]);

  if (isPending) {
    return <ModelDetailsSkeleton />;
  }

  return (
    <>
      <Head title={`${data?.name} Model`} />
      <ModelFilesDialog
        closeDialog={closeModelFilesDialog}
        isOpened={isModelFilesDialogOpened}
        trainingId={data?.published_training as number}
        datasetId={data?.dataset as number}
      />
      <TrainingAreaDialog isOpened={isOpened} closeDialog={closeDialog} />
      <div className="my-12 flex flex-col gap-y-20">
        <ModelDetailsInfo
          data={data}
          openModelFilesDialog={openModelFilesDialog}
          openTrainingAreaDialog={openDialog}
        />
        <ModelDetailsSection
          title={APP_CONTENT.models.modelsDetailsCard.propertiesSectionTitle}
        >
          {!data?.published_training ? (
            <div className="rounded-xl w-full h-80 border border-gray-border text-center flex flex-col gap-y-6 items-center justify-center text-gray">
              <Image
                src={TrainingInProgressImage}
                alt="Model training in progress"
              />
              <p className="max-w-lg">
                Model training is not activated yet. Properties will be
                available after a successful and activated training.
              </p>
            </div>
          ) : (
            <ModelDetailsProperties
              trainingId={data?.published_training as number}
              datasetId={data?.dataset}
              baseModel={data.base_model}
            />
          )}
        </ModelDetailsSection>
        <div className="flex md:hidden">
          <ButtonWithIcon
            label={APP_CONTENT.models.modelsDetailsCard.enhanceModel}
            variant="dark"
            size="medium"
            prefixIcon={StarStackIcon}
          />
        </div>
        {/* mobile */}
        <ModelDetailsSection
          title={
            APP_CONTENT.models.modelsDetailsCard.trainingHistorySectionTitle
          }
        >
          <div className="md:flex self-end hidden">
            <ButtonWithIcon
              label={APP_CONTENT.models.modelsDetailsCard.enhanceModel}
              variant="dark"
              size="medium"
              prefixIcon={StarStackIcon}
            />
          </div>
          <TrainingHistoryTable
            modelId={data?.id as string}
            trainingId={data?.published_training as number}
            modelOwner={data?.user.username as string}
            datasetId={data?.dataset as number}
            baseModel={data?.base_model as string}
          />
        </ModelDetailsSection>
      </div>
    </>
  );
};
