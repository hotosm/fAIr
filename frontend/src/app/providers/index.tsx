
import { HelmetProvider } from "react-helmet-async";
import { ToastProvider } from "./toast-provider";
import { AuthProvider } from "./auth-provider";


const ContextProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <HelmetProvider>
      <ToastProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ToastProvider>
    </HelmetProvider>
  )
}

export default ContextProviders