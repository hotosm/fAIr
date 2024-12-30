import { Button } from "@/components/ui/button";
import { Head } from "@/components/seo";
import { SHARED_CONTENT } from "@/constants";
import { ShieldIcon } from "@/components/ui/icons";
import { useAuth } from "@/app/providers/auth-provider";
import { useLogin } from "@/hooks/use-login";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { handleLogin, loading } = useLogin();

  if (!isAuthenticated) {
    return (
      <>
        <Head title="Authentication Required" />
        <section className="min-h-[80vh] flex flex-col mt-20 items-center justify-center gap-y-10">
          <div className="flex flex-col items-center justify-center gap-y-10">
            <div className="bg-gray-disabled w-[97px] h-[97px] flex items-center justify-center rounded-full p-2">
              <ShieldIcon className="w-14 h-14" />
            </div>
            <div className="flex flex-col gap-y-10">
              <h1 className="text-body-1 lg:text-title-1 font-semibold text-dark text-center">
                {SHARED_CONTENT.protectedPage.messageTitle}
              </h1>
              <p className="text-body-2base lg:text-body2 text-dark text-center">
                {SHARED_CONTENT.protectedPage.messageParagraph}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={handleLogin}
            className="max-w-[300px]"
            spinner={loading}
          >
            {loading
              ? SHARED_CONTENT.loginButtonLoading
              : SHARED_CONTENT.protectedPage.ctaButton}
          </Button>
        </section>
      </>
    );
  }
  return children;
};
