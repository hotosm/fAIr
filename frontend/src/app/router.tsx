import { RootLayout } from '@/components/layouts'
import { APPLICATION_ROUTES } from '@/utils/constants'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'

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
