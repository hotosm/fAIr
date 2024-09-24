
import { AuthProvider } from './providers/auth-provider'
import { AppRouter } from './router'

export const App = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
