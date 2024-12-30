import ModelEnhancementDialog from '@/features/models/components/dialogs/model-enhancement-dialog';
import { BackButton, ButtonWithIcon } from '@/components/ui/button';
import { handleErrorNavigation } from '@/utils';
import { Head } from '@/components/seo';
import { Image } from '@/components/ui/image';
import { ModelDetailsSkeleton } from '@/features/models/components/skeletons';
import { ModelFilesDialog } from '@/features/models/components/dialogs';
import { MODELS_CONTENT } from '@/constants';
import { StarStackIcon } from '@/components/ui/icons';
import { TModelDetails, TTrainingDataset } from '@/types';
import { TrainingAreaDrawer } from '@/features/models/components/training-area-drawer';
import { TrainingInProgressImage } from '@/assets/images';
import { useAuth } from '@/app/providers/auth-provider';
import { useDialog } from '@/hooks/use-dialog';
import { useEffect } from 'react';
import { useGetTrainingDataset } from '@/features/models/hooks/use-dataset';
import { useModelDetails } from '@/features/models/hooks/use-models';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ModelDetailsSection,
  ModelDetailsProperties,
  ModelDetailsInfo,
  TrainingHistoryTable,
} from "@/features/models/components";

export const ModelDetailsPage = () => {
  const { id } = useParams<{ id: string }>();

  const {
    isOpened: isModelFilesDialogOpened,
    closeDialog: closeModelFilesDialog,
    openDialog: openModelFilesDialog,
  } = useDialog();

  const navigate = useNavigate();

  const { data, isPending, isError, error } = useModelDetails(
    id as string,
    !!id,
    10000,
  );
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isError && error) {
      handleErrorNavigation(error, navigate);
    }
  }, [isError, error, navigate]);

  const {
    isOpened: isModelEnhancementDialogOpened,
    closeDialog: closeModelEnhancementDialog,
    openDialog: openModelEnhancementDialog,
  } = useDialog();

  const {
    isPending: isTrainingDatasetPending,
    data: trainingDataset,
    isError: isTrainingDatasetError,
  } = useGetTrainingDataset(data?.dataset, !!data);

  const { isOpened, closeDialog, openDialog } = useDialog();

  if (
    isPending ||
    isError ||
    isTrainingDatasetPending ||
    isTrainingDatasetError
  ) {
    return <ModelDetailsSkeleton />;
  }

  return (
    <>
      <ModelEnhancementDialog
        isOpened={isModelEnhancementDialogOpened}
        closeDialog={closeModelEnhancementDialog}
        modelId={data?.id as string}
      />
      <TrainingAreaDrawer
        isOpened={isOpened}
        closeDialog={closeDialog}
        trainingAreaId={data?.published_training as number}
        tmsURL={trainingDataset?.source_imagery as string}
      />
      <Head title={`${data?.name} Model`} />
      <ModelFilesDialog
        closeDialog={closeModelFilesDialog}
        isOpened={isModelFilesDialogOpened}
        trainingId={data?.published_training as number}
        datasetId={data?.dataset as number}
      />

      <BackButton className="mt-6" />
      <div className="my-12 flex flex-col gap-y-20">
        <ModelDetailsInfo
          data={data as TModelDetails}
          openModelFilesDialog={openModelFilesDialog}
          openTrainingAreaDrawer={openDialog}
          isError={isTrainingDatasetError}
          isPending={isTrainingDatasetPending}
          trainingDataset={trainingDataset as TTrainingDataset}
        />
        <ModelDetailsSection
          title={MODELS_CONTENT.models.modelsDetailsCard.propertiesSectionTitle}
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
            label={MODELS_CONTENT.models.modelsDetailsCard.enhanceModel}
            variant="dark"
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
              variant="dark"
              size="medium"
              prefixIcon={StarStackIcon}
              onClick={openModelEnhancementDialog}
              disabled={!isAuthenticated}
            />
          </div>
          <TrainingHistoryTable
            modelId={data?.id as string}
            trainingId={data?.published_training as number}
            modelOwner={data?.user.username as string}
            datasetId={data?.dataset as number}
            baseModel={data?.base_model as string}
            tmsUrl={trainingDataset.source_imagery}
          />
        </ModelDetailsSection>
      </div>
    </>
  );
};
