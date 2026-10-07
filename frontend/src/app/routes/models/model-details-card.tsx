import ModelEnhancementDialog from "@/features/models/components/dialogs/model-enhancement-dialog";
import { MODELS_CONTENT } from "@/constants";
import { BackButton, ButtonWithIcon } from "@/components/ui/button";
import { Head } from "@/components/seo";
import { Image } from "@/components/ui/image";
import { ModelDetailsSkeleton } from "@/features/models/components/skeletons";
import { ModelFilesDialog } from "@/features/models/components/dialogs";
import { StarStackIcon } from "@/components/ui/icons";
import { TModelDetails } from "@/types";
import { TrainingAreaDrawer } from "@/features/models/components/training-area-drawer";
import { TrainingInProgressImage } from "@/assets/images";
import { useAuth } from "@/app/providers/auth-provider";
import { useDialog } from "@/hooks/use-dialog";
import {
  ModelDetailsSection,
  ModelDetailsProperties,
  ModelDetailsInfo,
  TrainingHistoryTable,
} from "@/features/models/components";
import { useModelsContext } from "@/app/providers/models-provider";
import { ButtonVariant } from "@/enums";

export const ModelDetailsPage = () => {
  const {
    isOpened: isModelFilesDialogOpened,
    closeDialog: closeModelFilesDialog,
    openDialog: openModelFilesDialog,
  } = useDialog();

  const { data, isPending, isError } = useModelsContext();

  const { isAuthenticated } = useAuth();

  const {
    isOpened: isModelEnhancementDialogOpened,
    closeDialog: closeModelEnhancementDialog,
    openDialog: openModelEnhancementDialog,
  } = useDialog();

  const { isOpened, closeDialog, openDialog } = useDialog();

  if (isPending || isError || !data) {
    return <ModelDetailsSkeleton />;
  }

  return (
    <>
      <ModelEnhancementDialog
        isOpened={isModelEnhancementDialogOpened}
        closeDialog={closeModelEnhancementDialog}
        modelId={data?.id}
      />
      <TrainingAreaDrawer
        isOpened={isOpened}
        closeDialog={closeDialog}
        trainingAreaId={data.published_training}
        tmsURL={data?.dataset?.source_imagery}
      />
      <Head title={`${data?.name} Model`} />
      <ModelFilesDialog
        closeDialog={closeModelFilesDialog}
        isOpened={isModelFilesDialogOpened}
        trainingId={data?.published_training}
        datasetId={data?.dataset?.id}
      />
      <BackButton className="mt-6" />
      <div className="my-12 flex flex-col gap-y-20">
        <ModelDetailsInfo
          data={data as TModelDetails}
          openModelFilesDialog={openModelFilesDialog}
          openTrainingAreaDrawer={openDialog}
          trainingDataset={data?.dataset}
        />
        <ModelDetailsSection
          title={MODELS_CONTENT.models.modelsDetailsCard.propertiesSectionTitle}
        >
          {!data?.published_training ? (
            <div className="rounded-xl w-full h-80 border border-gray-border text-center flex flex-col gap-y-6 items-center justify-center text-grey">
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
            />
          )}
        </ModelDetailsSection>
        <div className="flex md:hidden">
          <ButtonWithIcon
            label={MODELS_CONTENT.models.modelsDetailsCard.enhanceModel}
            variant={ButtonVariant.DARK}
            size="medium"
            prefixIcon={StarStackIcon}
            onClick={openModelEnhancementDialog}
            disabled={!isAuthenticated}
          />
        </div>
        {/* mobile */}
        <ModelDetailsSection
          title={
            MODELS_CONTENT.models.modelsDetailsCard.trainingHistorySectionTitle
          }
        >
          <div className="md:flex self-end hidden">
            <ButtonWithIcon
              label={MODELS_CONTENT.models.modelsDetailsCard.enhanceModel}
              variant={ButtonVariant.DARK}
              size="medium"
              prefixIcon={StarStackIcon}
              onClick={openModelEnhancementDialog}
              disabled={!isAuthenticated}
            />
          </div>
          <TrainingHistoryTable
            modelId={data?.id as string}
            publishedTrainingId={data?.published_training as number}
            modelOwner={data?.user?.username as string}
          />
        </ModelDetailsSection>
      </div>
    </>
  );
};
