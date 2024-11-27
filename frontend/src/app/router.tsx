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
      /**
       * Landing page route starts
       */
      {
        path: APPLICATION_ROUTES.HOMEPAGE,
        lazy: async () => {
          const { LandingPage } = await import("@/app/routes/landing");
          return { Component: LandingPage };
        },
      },
      /**
       * Landing page route ends
       */
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
      /**
       * Training dataset route starts
       */
      {
        path: APPLICATION_ROUTES.TRAINING_DATASETS,
        lazy: async () => {
          const { TrainingDatasetsPage } = await import(
            "@/app/routes/training-datasets"
          );
          return { Component: TrainingDatasetsPage };
        },
      },
      /**
       * Training dataset route ends
       */
      /**
       * Models details & list route starts
       */
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
      /**
       * Models details & list route ends
       */
      {
        element: (
          <ProtectedPage>
            <ModelFormsLayout />
          </ProtectedPage>
        ),
        children: [
          /**
           * Model creation routes
           */
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
          /**
           * Model creation routes ends
           */

          /**
           * Model edit routes starts
           */
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
      /**
       * Model edit routes ends
       */
      /**
       * Training dataset route starts
       */
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

      /**
       * Training dataset route ends
       */

      /**
       * Start mapping route starts
       */
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
      /**
       * Start mapping route ends
       */

      /**
       * User account routes start
       */
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
      /**
       * User account routes ends
       */

      /**
       * 404 route
       */
      {
        path: APPLICATION_ROUTES.NOTFOUND,
        lazy: async () => {
          const { PageNotFound } = await import("@/app/routes/not-found");
          return { Component: PageNotFound };
        },
      },
      /**
       * Catch all route -> 404
       */
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
