import { HANKO_URL, FRONTEND_URL, BASE_API_URL } from "@/config";

export const HankoAuthComponent = ({
  displayBar,
  redirectAfterLogin,
}: {
  displayBar?: boolean;
  redirectAfterLogin: string;
}) => (
  <hotosm-auth
    hanko-url={HANKO_URL}
    base-path={HANKO_URL}
    redirect-after-login={redirectAfterLogin}
    redirect-after-logout={FRONTEND_URL}
    mapping-check-url={`${BASE_API_URL}auth/status/`}
    onboarding-url={`${BASE_API_URL}auth/onboarding/`}
    app-id="fair"
    button-variant="filled"
    button-color="danger"
    display={displayBar ? "bar" : "default"}
  />
);