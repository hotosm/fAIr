import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/app/providers/auth-provider";

const ContextProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <HelmetProvider>
      <AuthProvider>{children}</AuthProvider>
    </HelmetProvider>
  );
};

export default ContextProviders;
