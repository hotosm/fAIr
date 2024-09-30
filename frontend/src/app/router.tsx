import { RootLayout } from "@/components/layouts";
import { APPLICATION_ROUTES } from "@/utils";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import { ProtectedPage } from "@/app/routes/protected-route";

const router = createBrowserRouter([
  {
    path: APPLICATION_ROUTES.HOMEPAGE,
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
          const { TrainingDatasetsPage } = await import("@/app/routes/training-datasets");
          return { Component: TrainingDatasetsPage };
        },
      },
      {
        path: APPLICATION_ROUTES.MODELS,
        lazy: async () => {
          const { ModelsPage } = await import("@/app/routes/models");
          return {
            Component: () => (
              <ProtectedPage>
                <ModelsPage />
              </ProtectedPage>
            ),
          };
        },
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
        path: APPLICATION_ROUTES.ACCOUNT_SETTINGS,
        lazy: async () => {
          const { UserAccountSettingsPage } = await import(
            "@/app/routes/account/settings"
          );
          return {
            Component: () => (
              <ProtectedPage>
                <UserAccountSettingsPage />
              </ProtectedPage>
            ),
          };
        },
      },
      {
        path: APPLICATION_ROUTES.ACCOUNT_PROJECTS,
        lazy: async () => {
          const { UserAccountProjectsPage } = await import(
            "@/app/routes/account/projects"
          );
          return {
            Component: () => (
              <ProtectedPage>
                <UserAccountProjectsPage />
              </ProtectedPage>
            ),
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
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
