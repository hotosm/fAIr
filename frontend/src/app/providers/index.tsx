import { AuthProvider } from '@/app/providers/auth-provider';
import { HelmetProvider } from 'react-helmet-async';

const ContextProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <HelmetProvider>
      <AuthProvider>{children}</AuthProvider>
    </HelmetProvider>
  );
};

export default ContextProviders;
