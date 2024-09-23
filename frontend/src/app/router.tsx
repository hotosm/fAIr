import { RouterProvider, createBrowserRouter } from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: '/',
    lazy: async () => {
      const { LandingPageRoute } = await import('@/app/routes/landing')
      return { Component: LandingPageRoute }
    }
  }
])

export const AppRouter = () => {
  return <RouterProvider router={router} />
}
