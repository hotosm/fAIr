import { RootLayout } from "@/components/layouts";
import { APPLICATION_ROUTES } from "@/utils";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import { ProtectedPage } from "@/app/routes/protected-route";
import { MainErrorFallback } from "@/components/errors";
import ModelFormsLayout from "@/components/layouts/model-forms-layout";
import ModelsLayout from "@/components/layouts/models-layout";
import { MapProvider } from "./providers/map-provider";

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: APPLICATION_ROUTES.HOMEPAGE,
        lazy: async () => {
          const { LandingPage } = await import("@/app/routes/landing");
          return { Component: LandingPage };
        },
      },
      {
        path: APPLICATION_ROUTES.LEARN,
        lazy: async () => {
          const { LearnPage } = await import("@/app/routes/learn");
          return { Component: LearnPage };
        },
      },
      {
        path: APPLICATION_ROUTES.ABOUT,
        lazy: async () => {
          const { AboutPage } = await import("@/app/routes/about");
          return { Component: AboutPage };
        },
      },
      {
        path: APPLICATION_ROUTES.RESOURCES,
        lazy: async () => {
          const { ResourcesPage } = await import("@/app/routes/resources");
          return { Component: ResourcesPage };
        },
      },
      {
        path: APPLICATION_ROUTES.TRAINING_DATASETS,
        lazy: async () => {
          const { TrainingDatasetsPage } = await import(
            "@/app/routes/training-datasets"
          );
          return { Component: TrainingDatasetsPage };
        },
      },
      {
        element: <ModelsLayout />,
        children: [
          {
            path: APPLICATION_ROUTES.MODEL_DETAILS,
            lazy: async () => {
              const { ModelDetailsPage } = await import(
                "@/app/routes/models/model-details"
              );
              return {
                Component: () => <ModelDetailsPage />,
              };
            },
          },
          {
            path: APPLICATION_ROUTES.MODELS,
            lazy: async () => {
              const { ModelsPage } = await import(
                "@/app/routes/models/models-list"
              );
              return {
                Component: () => <ModelsPage />,
              };
            },
          },
        ],
      },
      {
        element: (
          <ProtectedPage>
            <ModelFormsLayout />
          </ProtectedPage>
        ),
        children: [
          // Creation
          {
            path: APPLICATION_ROUTES.CREATE_NEW_MODEL,
            lazy: async () => {
              const { ModelDetailsFormPage } = await import(
                "@/app/routes/models/model-details-form"
              );
              return {
                Component: () => <ModelDetailsFormPage />,
              };
            },
          },
          {
            path: APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_DATASET,
            lazy: async () => {
              const { ModelTrainingDatasetPage } = await import(
                "@/app/routes/models/training-dataset"
              );
              return {
                Component: () => <ModelTrainingDatasetPage />,
              };
            },
          },
          {
            path: APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_AREA,
            lazy: async () => {
              const { ModelTrainingAreaPage } = await import(
                "@/app/routes/models/training-area"
              );
              return {
                Component: () => <ModelTrainingAreaPage />,
              };
            },
          },
          {
            path: APPLICATION_ROUTES.CREATE_NEW_MODEL_TRAINING_SETTINGS,
            lazy: async () => {
              const { ModelTrainingSettingsPage } = await import(
                "@/app/routes/models/training-settings"
              );
              return {
                Component: () => <ModelTrainingSettingsPage />,
              };
            },
          },
          {
            path: APPLICATION_ROUTES.CREATE_NEW_MODEL_SUMMARY,
            lazy: async () => {
              const { ModelSummaryPage } = await import(
                "@/app/routes/models/summary"
              );
              return {
                Component: () => <ModelSummaryPage />,
              };
            },
          },
          {
            path: APPLICATION_ROUTES.CREATE_NEW_MODEL_CONFIRMATION,
            lazy: async () => {
              const { ModelConfirmationPage } = await import(
                "@/app/routes/models/confirmation"
              );
              return {
                Component: () => <ModelConfirmationPage />,
              };
            },
          },
          //Edit
          {
            path: APPLICATION_ROUTES.EDIT_MODEL_DETAILS,
            lazy: async () => {
              const { ModelDetailsFormPage } = await import(
                "@/app/routes/models/model-details-form"
              );
              return {
                Component: () => <ModelDetailsFormPage />,
              };
            },
          },
          {
            path: APPLICATION_ROUTES.EDIT_MODEL_TRAINING_DATASET,
            lazy: async () => {
              const { ModelTrainingDatasetPage } = await import(
                "@/app/routes/models/training-dataset"
              );
              return {
                Component: () => <ModelTrainingDatasetPage />,
              };
            },
          },
          {
            path: APPLICATION_ROUTES.EDIT_MODEL_TRAINING_AREA,
            lazy: async () => {
              const { ModelTrainingAreaPage } = await import(
                "@/app/routes/models/training-area"
              );
              return {
                Component: () => <ModelTrainingAreaPage />,
              };
            },
          },
          {
            path: APPLICATION_ROUTES.EDIT_MODEL_TRAINING_SETTINGS,
            lazy: async () => {
              const { ModelTrainingSettingsPage } = await import(
                "@/app/routes/models/training-settings"
              );
              return {
                Component: () => <ModelTrainingSettingsPage />,
              };
            },
          },
          {
            path: APPLICATION_ROUTES.EDIT_MODEL_SUMMARY,
            lazy: async () => {
              const { ModelSummaryPage } = await import(
                "@/app/routes/models/summary"
              );
              return {
                Component: () => <ModelSummaryPage />,
              };
            },
          },
          {
            path: APPLICATION_ROUTES.EDIT_MODEL_CONFIRMATION,
            lazy: async () => {
              const { ModelConfirmationPage } = await import(
                "@/app/routes/models/confirmation"
              );
              return {
                Component: () => <ModelConfirmationPage />,
              };
            },
          },
        ],
      },
      {
        path: APPLICATION_ROUTES.TRAINING_DATASETS,
        lazy: async () => {
          const { TrainingDatasetsPage } = await import(
            "@/app/routes/training-datasets"
          );
          return {
            Component: () => (
              <ProtectedPage>
                <TrainingDatasetsPage />
              </ProtectedPage>
            ),
          };
        },
      },
      {
        path: APPLICATION_ROUTES.START_MAPPING,
        lazy: async () => {
          const { StartMappingPage } = await import(
            "@/app/routes/start-mapping"
          );
          return {
            Component: () => (
              <ProtectedPage>
                <MapProvider>
                  <StartMappingPage />
                </MapProvider>
              </ProtectedPage>
            ),
          };
        },
      },
      {
        path: APPLICATION_ROUTES.ACCOUNT_SETTINGS,
        lazy: async () => {
          const { UserAccountSettingsPage } = await import(
            "@/app/routes/account/settings"
          );
          return {
            Component: () => <UserAccountSettingsPage />,
          };
        },
      },
      {
        path: APPLICATION_ROUTES.ACCOUNT_MODELS,
        lazy: async () => {
          const { UserAccountModelsPage } = await import(
            "@/app/routes/account/models"
          );
          return {
            Component: () => <UserAccountModelsPage />,
          };
        },
      },
      {
        path: APPLICATION_ROUTES.NOTFOUND,
        lazy: async () => {
          const { PageNotFound } = await import("@/app/routes/not-found");
          return { Component: PageNotFound };
        },
      },
      {
        path: "*",
        element: (
          <Navigate
            to={APPLICATION_ROUTES.NOTFOUND}
            replace
            state={{ from: window.location.pathname }}
          />
        ),
      },
    ],
    errorElement: <MainErrorFallback />,
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
