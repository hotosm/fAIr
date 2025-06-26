import { AuthenticationModal } from "@/components/auth/auth-modal";
import { Head } from "@/components/seo";
import { AUTH_PAGE_AND_MODAL_CONTENT } from "@/constants/ui-contents/auth-content";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/auth-provider";
import { APPLICATION_ROUTES } from "@/constants";

export const AuthenticationCallbackPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    /**
     * Redirect any visit to this page back to the homepage,
     * if there is no code and state in the url, or if the user is authenticated already.
     */
    if (isAuthenticated || !code || !state) {
      navigate(APPLICATION_ROUTES.HOMEPAGE);
    }
  }, [isAuthenticated]);

  return (
    <>
      <Head title={AUTH_PAGE_AND_MODAL_CONTENT.pageTitle}></Head>
      <AuthenticationModal callbackPage isOpen />
    </>
  );
};
