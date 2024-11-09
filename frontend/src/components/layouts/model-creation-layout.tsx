import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ProgressBar,
  ProgressButtons,
} from "@/features/model-creation/components";
import { Head } from "@/components/seo";
import { APPLICATION_ROUTES } from "@/utils";
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
  ModelCreationFormProvider,
  useModelFormContext,
} from "@/app/providers/model-creation-provider";
import ModelsLayout from "./models-layout";

const pages: {
  id: number;
  title: string;
  icon: React.ElementType;
  path: string;
}[] = [
  {
    id: 1,
    title: "Model Details",
    icon: TagsIcon,
    path: APPLICATION_ROUTES.CREATE_NEW_MODEL,
  },
  {
    id: 2,
    title: "Training Dataset",
    icon: DatabaseIcon,
    path: APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_DATASET,
  },
  {
    id: 3,
    title: "Training Area",
    icon: SquareShadowIcon,
    path: APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_AREA,
  },
  {
    id: 4,
    title: "Training Settings",
    icon: SettingsIcon,
    path: APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_SETTINGS,
  },
  {
    id: 5,
    title: "Submit Model",
    icon: CloudIcon,
    path: APPLICATION_ROUTES.CREATE_NEW_MODEL_SUMMARY,
  },
  {
    id: 6,
    title: "Confirmation",
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
      <ModelCreationFormProvider>
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
      </ModelCreationFormProvider>
    </ModelsLayout>
  );
};

export default ModelCreationLayout;

const ModelCreationRouteValidator = ({ pathname }: { pathname: string }) => {
  const navigate = useNavigate();
  const { formData } = useModelFormContext();

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
      const labeledTrainingAreas = formData.trainingAreas?.features?.filter(
        (aoi) => aoi.properties.label_fetched,
      ).length;
      if (
        !formData.oamTileName ||
        !formData.oamBounds ||
        labeledTrainingAreas === 0
      )
        navigate(APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_AREA);
    } else if (pathname.includes(APPLICATION_ROUTES.CREATE_NEW_MODEL_SUMMARY)) {
      // When a user is in the summary page, they must have zoom levels set from the settings
      // oam tile info retrieved - so the tile name and bounds
      // and training areas with their labels fetched
      const labeledTrainingAreas = formData.trainingAreas?.features?.filter(
        (aoi) => aoi.properties.label_fetched,
      ).length;
      if (
        formData.zoomLevels.length === 0 ||
        labeledTrainingAreas === 0 ||
        !formData.oamTileName ||
        !formData.oamBounds
      )
        navigate(APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_SETTINGS);
    }
  }, [pathname, formData]);

  return null;
};
