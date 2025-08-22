import { Button } from "@/components/ui/button";
import { Head } from "@/components/seo";
import { SHARED_CONTENT } from "@/constants";
import { ShieldIcon } from "@/components/ui/icons";
import { useAuth } from "@/app/providers/auth-provider";
import { useLocation, useNavigate } from "react-router-dom";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  if (!isAuthenticated) {
    return (
      <>
        <Head title="Authentication Required" />
        <section className="mt-20 flex min-h-[80vh] flex-col items-center justify-center gap-y-10">
          <div className="flex flex-col items-center justify-center gap-y-10">
            <div className="flex size-[97px] items-center justify-center rounded-full bg-gray-disabled p-2">
              <ShieldIcon className="size-14" />
            </div>
            <div className="flex flex-col gap-y-10">
              <h1 className="text-center text-body-1 font-semibold text-dark lg:text-title-1">
                {SHARED_CONTENT.protectedPage.messageTitle}
              </h1>
              <p className="lg:text-body2 text-center text-body-2base text-dark">
                {SHARED_CONTENT.protectedPage.messageParagraph}
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              /*
               * Set the `backgroundLocation` in location state so that when we open the authentication modal we still see the current page in the background.
               */
              navigate(location, { state: { backgroundLocation: location } });
            }}
            className="max-w-[300px]"
          >
            {SHARED_CONTENT.protectedPage.ctaButton}
          </Button>
        </section>
      </>
    );
  }
  return children;
};
