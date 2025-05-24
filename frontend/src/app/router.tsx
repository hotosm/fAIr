import { APPLICATION_ROUTES } from "@/constants";
import { MainErrorFallback } from "@/components/errors";
import {
  ModelFormsLayout,
  RootLayout,
  UserProfileLayout,
} from "@/components/layouts";
import { ProtectedRoute } from "@/components/shared";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import { ModelsProvider } from "@/app/providers/models-provider";

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
       * Models details, list and feedbacks route starts.
       */
      {
        path: APPLICATION_ROUTES.MODEL_DETAILS,
        lazy: async () => {
          const { ModelDetailsPage } = await import(
            "@/app/routes/models/model-details-card"
          );
          return {
            Component: () => (
              <ModelsProvider>
                <ModelDetailsPage />
              </ModelsProvider>
            ),
          };
        },
      },

      {
        path: APPLICATION_ROUTES.MODEL_FEEDBACKS,
        lazy: async () => {
          const { ModelFeedbacksPage } = await import(
            "@/app/routes/models/feedbacks"
          );
          return {
            Component: () => (
              <ModelsProvider>
                <ModelFeedbacksPage />
              </ModelsProvider>
            ),
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
      /**
       *  Models details, list and feedbacks route ends.
       */
      {
        element: (
          <ProtectedRoute>
            <ModelFormsLayout />
          </ProtectedRoute>
        ),
        children: [
          /**
           * Model creation routes.
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
           * Model creation routes ends.
           */

          /**
           * Model edit routes starts.
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
       * Model edit routes ends.
       */
      /**
       *  Datasets details route starts.
       */
      {
        path: APPLICATION_ROUTES.DATASET_DETAILS,
        lazy: async () => {
          const { TrainingDatasetsDetailPage } = await import(
            "@/app/routes/datasets/dataset-details"
          );
          return {
            Component: () => <TrainingDatasetsDetailPage />,
          };
        },
      },

      /**
       * Datasets details route ends.
       */

      /**
       * Start mapping route starts.
       */
      {
        path: APPLICATION_ROUTES.START_MAPPING,
        lazy: async () => {
          const { StartMappingPage } = await import(
            "@/app/routes/start-mapping"
          );
          return {
            Component: () => (
              <ProtectedRoute>
                <StartMappingPage />
              </ProtectedRoute>
            ),
          };
        },
      },
      /**
       * Start mapping route ends.
       */

      /**
       * User account routes start.
       */
      {
        element: (
          <ProtectedRoute>
            <UserProfileLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: APPLICATION_ROUTES.PROFILE_BASE,
            lazy: async () => {
              const { UserProfileOverviewPage } = await import(
                "@/app/routes/profile/overview"
              );
              return {
                Component: () => <UserProfileOverviewPage />,
              };
            },
          },
          {
            path: APPLICATION_ROUTES.PROFILE_SETTINGS,
            lazy: async () => {
              const { UserProfileSettingsPage } = await import(
                "@/app/routes/profile/settings"
              );
              return {
                Component: () => <UserProfileSettingsPage />,
              };
            },
          },
          {
            path: APPLICATION_ROUTES.PROFILE_MODELS,
            lazy: async () => {
              const { UserModelsPage } = await import(
                "@/app/routes/profile/models"
              );
              return {
                Component: () => <UserModelsPage />,
              };
            },
          },
          {
            path: APPLICATION_ROUTES.PROFILE_DATASETS,
            lazy: async () => {
              const { UserProfileDatasetsPage } = await import(
                "@/app/routes/profile/datasets"
              );
              return {
                Component: () => <UserProfileDatasetsPage />,
              };
            },
          },
        ],
      },
      /**
       * User account routes ends.
       */

      /**
       * Auth route starts.
       */
      {
        path: APPLICATION_ROUTES.AUTH_CALLBACK,
        lazy: async () => {
          const { AuthenticationCallbackPage } = await import(
            "@/app/routes/authenticate"
          );
          return { Component: AuthenticationCallbackPage };
        },
      },
      /**
       * Auth route ends.
       */

      /**
       * Email verification route starts.
       */
      {
        path: APPLICATION_ROUTES.EMAIL_VERIFICATION_CALLBACK,
        lazy: async () => {
          const { EmailVerificationCallbackPage } = await import(
            "@/app/routes/verify-email"
          );
          return { Component: EmailVerificationCallbackPage };
        },
      },
      /**
       * Email verification route ends.
       */

      /**
       * 404 route.
       */
      {
        path: APPLICATION_ROUTES.NOTFOUND,
        lazy: async () => {
          const { PageNotFound } = await import("@/app/routes/not-found");
          return { Component: PageNotFound };
        },
      },
      /**
       * Catch all route -> 404.
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
