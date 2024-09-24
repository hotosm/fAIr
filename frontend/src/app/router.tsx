import { RootLayout } from '@/components/layouts'
import { APPLICATION_ROUTES } from '@/utils'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ProtectedPage } from './routes/protected-route'

const router = createBrowserRouter([
  {
    path: APPLICATION_ROUTES.HOMEPAGE,
    element: <RootLayout />,
    children: [
      {
        path: APPLICATION_ROUTES.HOMEPAGE,
        lazy: async () => {
          const { LandingPage } = await import('@/app/routes/landing')
          return { Component: LandingPage }
        }
      },
      {
        path: APPLICATION_ROUTES.MODELS,
        lazy: async () => {
          const { ModelsPage } = await import('@/app/routes/models')
          return {
            Component: () => (
              <ProtectedPage>
                <ModelsPage />
              </ProtectedPage>
            )
          }
        }
      },
      {
        path: APPLICATION_ROUTES.TRAINING_DATASETS,
        lazy: async () => {
          const { TrainingDatasetsPage } = await import('@/app/routes/training-datasets')
          return {
            Component: () => (
              <ProtectedPage>
                <TrainingDatasetsPage />
              </ProtectedPage>
            )
          }
        }
      },
      {
        path: APPLICATION_ROUTES.NOTFOUND,
        lazy: async () => {
          const { PageNotFound } = await import('@/app/routes/not-found')
          return { Component: PageNotFound }
        }
      },
      {
        path: '*',
        element: <Navigate to={APPLICATION_ROUTES.NOTFOUND} replace state={{ from: window.location.pathname }} />
      },
    ]
  },

])

export const AppRouter = () => {
  return <RouterProvider router={router} />
}
