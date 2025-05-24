import { BackButton } from "@/components/ui/button";
import { Head } from "@/components/seo";
import { MODELS_CONTENT, MODELS_ROUTES } from "@/constants";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ProgressBar,
  ProgressButtons,
} from "@/features/model-creation/components";
import {
  CloudIcon,
  DatabaseIcon,
  SettingsIcon,
  SquareShadowIcon,
  StarIcon,
  TagsIcon,
} from "@/components/ui/icons";
import {
  ModelsProvider,
  useModelsContext,
} from "@/app/providers/models-provider";
import { APP_TOUR_IDS } from "@/constants/site-tour";
import { AppTourProvider } from "@/app/providers/tour-provider";
import { TrainingAreaTourDialog } from "@/features/model-creation/components/dialogs/training-area-tour-dialog";

const pages: {
  id: number;
  title: string;
  icon: React.ElementType;
  path: string;
}[] = [
  {
    id: 1,
    title: MODELS_CONTENT.modelCreation.progressStepper.modelDetails,
    icon: TagsIcon,
    path: MODELS_ROUTES.DETAILS,
  },
  {
    id: 2,
    title: MODELS_CONTENT.modelCreation.progressStepper.trainingDataset,
    icon: DatabaseIcon,
    path: MODELS_ROUTES.TRAINING_DATASET,
  },
  {
    id: 3,
    title: MODELS_CONTENT.modelCreation.progressStepper.trainingArea,
    icon: SquareShadowIcon,
    path: MODELS_ROUTES.TRAINING_AREA,
  },
  {
    id: 4,
    title: MODELS_CONTENT.modelCreation.progressStepper.trainingSettings,
    icon: SettingsIcon,
    path: MODELS_ROUTES.TRAINING_SETTINGS,
  },
  {
    id: 5,
    title: MODELS_CONTENT.modelCreation.progressStepper.submitModel,
    icon: CloudIcon,
    path: MODELS_ROUTES.MODEL_SUMMARY,
  },
  {
    id: 6,
    title: MODELS_CONTENT.modelCreation.progressStepper.confirmation,
    icon: StarIcon,
    path: MODELS_ROUTES.CONFIRMATION,
  },
];

export const ModelFormsLayout = () => {
  const { pathname } = useLocation();
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  useEffect(() => {
    const pageIndex = pages.findIndex((page) => pathname.includes(page.path));
    if (pageIndex !== -1) {
      setCurrentPageIndex(pageIndex);
    }
  }, [pathname]);

  return (
    <AppTourProvider>
      <ModelsProvider>
        <ModelFormRouteValidator
          pathname={pathname}
          currentPageIndex={currentPageIndex}
        />
        <TrainingAreaTourDialog />
        <Head title="Create New Model" />
        <div className="flex flex-col gap-y-2 my-6 w-full min-h-screen h-full">
          <BackButton />
          <div className="min-h-screen grid grid-cols-12 grid-rows-[auto_1fr_auto] gap-y-8 w-full justify-center my-2">
            <div
              className="col-span-12 xl:col-start-2 xl:col-span-10 w-full"
              id={APP_TOUR_IDS.STEP_HEADING}
            >
              <ProgressBar
                currentPath={pathname}
                currentPageIndex={currentPageIndex}
                pages={pages}
              />
            </div>

            <div
              className={`col-span-12 mb-48  bg-white rounded-xl shadow-sm p-6 border border-gray-border ${pathname.includes(MODELS_ROUTES.TRAINING_AREA) || pathname.includes(MODELS_ROUTES.TRAINING_DATASET) ? "" : " xl:col-start-2 xl:col-span-10 2xl:col-start-4 2xl:col-span-6"}`}
            >
              <Outlet />
            </div>

            {!pathname.includes(MODELS_ROUTES.CONFIRMATION) && (
              <div
                id={APP_TOUR_IDS.PROGRESS_BUTTONS}
                className="fixed left-0 right-0 mx-auto bottom-0 h-16 md:h-20  bg-white w-full app-padding border-t border-light-gray z-[10000] py-2 md:py-4"
              >
                <ProgressButtons
                  pages={pages}
                  currentPageIndex={currentPageIndex}
                  currentPath={pathname}
                />
              </div>
            )}
          </div>{" "}
        </div>
      </ModelsProvider>
    </AppTourProvider>
  );
};

const ModelFormRouteValidator = ({
  pathname,
  currentPageIndex,
}: {
  pathname: string;
  currentPageIndex: number;
}) => {
  const navigate = useNavigate();
  const {
    formData,
    hasLabeledTrainingAreas,
    getFullPath,
    validateEditMode,
    isEditMode,
  } = useModelsContext();

  useEffect(() => {
    if (isEditMode && !validateEditMode) return;
    if (!pathname || !formData || !currentPageIndex) return;
    const prevRoute = getFullPath(pages[currentPageIndex - 1].path);
    if (pathname.includes(MODELS_ROUTES.TRAINING_DATASET)) {
      // When a user is in the training dataset page, they must have filled the model details page form.
      if (!formData.modelName && !formData.modelDescription)
        navigate(prevRoute);
    } else if (pathname.includes(MODELS_ROUTES.TRAINING_AREA)) {
      // When a user is in the training area, they must have completed the training dataset form
      if (!formData.selectedTrainingDatasetId || !formData.tmsURL)
        navigate(prevRoute);
    } else if (pathname.includes(MODELS_ROUTES.TRAINING_SETTINGS)) {
      // When a user is in the training settings, they must have completed the training area, the tms bounds should be available too

      if (
        !formData.datasetName ||
        !formData.oamBounds ||
        !hasLabeledTrainingAreas
      )
        navigate(prevRoute);
    } else if (pathname.includes(MODELS_ROUTES.MODEL_SUMMARY)) {
      // When a user is in the summary page, they must have zoom levels set from the settings
      // oam tile info retrieved - so the tile name and bounds
      // and training areas with their labels fetched
      if (
        formData.zoomLevels.length === 0 ||
        !hasLabeledTrainingAreas ||
        !formData.datasetName ||
        !formData.oamBounds
      )
        navigate(prevRoute);
    }
  }, [pathname, formData, currentPageIndex, validateEditMode]);

  return null;
};
