import { Button } from "@/components/ui/button";
import { ToolTip } from "@/components/ui/tooltip";
import { SHARED_CONTENT } from "@/constants";
import { ButtonVariant } from "@/enums";

export const LoginButton = ({
  isTryFairPage,
  onClick,
}: {
  isTryFairPage: boolean;
  onClick: () => void;
}) => (
  <ToolTip
    content={
      isTryFairPage
        ? "Sign in to access full mapping tools and features"
        : undefined
    }
  >
    <Button
      rounded={isTryFairPage}
      size={isTryFairPage ? "medium" : "large"}
      variant={isTryFairPage ? ButtonVariant.TERTIARY : ButtonVariant.PRIMARY}
      onClick={onClick}
    >
      {isTryFairPage
        ? SHARED_CONTENT.homepage.ctaSecondaryButton
        : SHARED_CONTENT.navbar.loginButton}
    </Button>
  </ToolTip>
);
