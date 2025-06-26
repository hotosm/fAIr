import { AuthenticationModal } from "@/components/auth/auth-modal";
import { Head } from "@/components/seo";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { APPLICATION_ROUTES } from "@/constants";
import { AUTH_PAGE_AND_MODAL_CONTENT } from "@/constants/ui-contents/auth-content";

/**
 * This page is used to verify the email address of the user.
 * It will redirect to the homepage if there is no uid and token in the url.
 */
export const EmailVerificationCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("uid");
    const token = params.get("token");

    /**
     * Redirect any visit to this page back to the homepage,
     * if there is no uid and token in the url.
     */
    if (!uid || !token) {
      navigate(APPLICATION_ROUTES.HOMEPAGE);
    }
  }, []);

  return (
    <>
      <Head
        title={AUTH_PAGE_AND_MODAL_CONTENT.emailVerificationPageTitle}
      ></Head>
      <AuthenticationModal emailVerification isOpen />
    </>
  );
};
