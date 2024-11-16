import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ProgressBar,
  ProgressButtons,
} from "@/features/model-creation/components";
import { Head } from "@/components/seo";
import { APPLICATION_ROUTES, MODEL_CREATION_CONTENT } from "@/utils";
import { useEffect, useState } from "react";
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
import ModelsLayout from "./models-layout";

const pages: {
  id: number;
  title: string;
  icon: React.ElementType;
  path: string;
}[] = [
  {
    id: 1,
    title: MODEL_CREATION_CONTENT.progressStepper.modelDetails,
    icon: TagsIcon,
    path: APPLICATION_ROUTES.CREATE_NEW_MODEL,
  },
  {
    id: 2,
    title: MODEL_CREATION_CONTENT.progressStepper.trainingDataset,
    icon: DatabaseIcon,
    path: APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_DATASET,
  },
  {
    id: 3,
    title: MODEL_CREATION_CONTENT.progressStepper.trainingArea,
    icon: SquareShadowIcon,
    path: APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_AREA,
  },
  {
    id: 4,
    title: MODEL_CREATION_CONTENT.progressStepper.trainingSettings,
    icon: SettingsIcon,
    path: APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_SETTINGS,
  },
  {
    id: 5,
    title: MODEL_CREATION_CONTENT.progressStepper.submitModel,
    icon: CloudIcon,
    path: APPLICATION_ROUTES.CREATE_NEW_MODEL_SUMMARY,
  },
  {
    id: 6,
    title: MODEL_CREATION_CONTENT.progressStepper.confirmation,
    icon: StarIcon,
    path: APPLICATION_ROUTES.CREATE_NEW_MODEL_CONFIRMATION,
  },
];

const ModelCreationLayout = () => {
  const { pathname } = useLocation();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  useEffect(() => {
    const pageIndex = pages.findIndex((page) => page.path === pathname);
    if (pageIndex !== -1) {
      setCurrentPageIndex(pageIndex);
    }
  }, [pathname]);

  return (
    <ModelsLayout>
      <ModelsProvider>
        <ModelCreationRouteValidator pathname={pathname} />
        <Head title="Create New Model" />
        <div className="min-h-screen grid grid-cols-12 grid-rows-[auto_1fr_auto] gap-y-8 w-full justify-center my-8">
          <div className="col-span-12 lg:col-start-2 lg:col-span-10 w-full ">
            <ProgressBar
              currentPath={pathname}
              currentPageIndex={currentPageIndex}
              pages={pages}
            />
          </div>
          <Outlet />
          {pathname !== APPLICATION_ROUTES.CREATE_NEW_MODEL_CONFIRMATION && (
            <ProgressButtons
              pages={pages}
              currentPageIndex={currentPageIndex}
              currentPath={pathname}
            />
          )}
        </div>
      </ModelsProvider>
    </ModelsLayout>
  );
};

export default ModelCreationLayout;

const ModelCreationRouteValidator = ({ pathname }: { pathname: string }) => {
  const navigate = useNavigate();
  const { formData, hasLabeledTrainingAreas } = useModelsContext();

  useEffect(() => {
    if (!pathname || !formData) return;

    if (
      pathname.includes(APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_DATASET)
    ) {
      // When a user is in the training dataset page, they must have filled the model details page
      if (!formData.modelName && !formData.modelDescription)
        navigate(APPLICATION_ROUTES.CREATE_NEW_MODEL);
    } else if (
      pathname.includes(APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_AREA)
    ) {
      // When a user is in the training area, they must have completed the training dataset form
      if (!formData.selectedTrainingDatasetId || !formData.tmsURL)
        navigate(APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_DATASET);
    } else if (
      pathname.includes(APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_SETTINGS)
    ) {
      // When a user is in the training settings, they must have completed the training area, the tms bounds should be available too
      //  !formData.trainingAreas.features.filter(aoi=>aoi.properties.label_fetched).length>0
      if (
        !formData.oamTileName ||
        !formData.oamBounds ||
        !hasLabeledTrainingAreas
      )
        navigate(APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_AREA);
    } else if (pathname.includes(APPLICATION_ROUTES.CREATE_NEW_MODEL_SUMMARY)) {
      // When a user is in the summary page, they must have zoom levels set from the settings
      // oam tile info retrieved - so the tile name and bounds
      // and training areas with their labels fetched
      if (
        formData.zoomLevels.length === 0 ||
        !hasLabeledTrainingAreas ||
        !formData.oamTileName ||
        !formData.oamBounds
      )
        navigate(APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_SETTINGS);
    }
  }, [pathname, formData]);

  return null;
};
