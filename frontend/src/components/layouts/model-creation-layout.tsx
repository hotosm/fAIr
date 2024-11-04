import { Outlet, useLocation } from "react-router-dom";
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
import { ModelCreationFormProvider } from "@/app/providers/model-creation-provider";
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

  // Validation logic
  // useEffect(() => {

  //   // When a user is in the training dataset page, they must have filled the model details page
  //   // When a user is in the training area, they must have completed the training dataset form
  //   // When a user is in the training settings, they must have completed the training area. i.e selected labels etc
  //   // When a user is in the submit model, they must have some training settings.
  //   // when a user is in the confirmation page, they must have a model id in the url
  //   // disable next button, disable prev button - pass as props to progress buttons component.
  //   // console.log(pathname, currentPageIndex, formData);
  // }, [pathname, currentPageIndex]);

  return (
    <ModelsLayout>
      <ModelCreationFormProvider>
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
