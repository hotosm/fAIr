import { OSMLogo } from "@/assets/images";
import { NavLogo } from "@/components/layouts";
import { MadeWithLove } from "@/components/shared";
import { Dialog } from "@/components/ui/dialog";
import { Image } from "@/components/ui/image";
import { useDialog } from "@/hooks/use-dialog";
import { useLogin } from "@/hooks/use-login";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AUTH_PAGE_AND_MODAL_CONTENT } from "@/constants/ui-contents/auth-content";
import { Spinner } from "@/components/ui/spinner";

export const AuthenticationModal = ({
  callbackPage = false,
  isOpen = false,
  emailVerification = false,
}: {
  callbackPage?: boolean;
  isOpen?: boolean;
  emailVerification?: boolean;
}) => {
  const { closeDialog } = useDialog();
  const navigate = useNavigate();
  const { handleLogin, loading } = useLogin();

  const handleOnClose = () => {
    closeDialog();
    navigate(-1);
  };

  return (
    <Dialog isOpened={isOpen} closeDialog={handleOnClose} label="">
      <div className="flex flex-col items-center justify-center gap-y-20 px-2 md:px-4">
        <NavLogo />
        <div className="flex flex-col gap-y-2 text-center">
          <h1 className="text-body-2 font-semibold md:text-title-2 xl:text-title-1">
            {AUTH_PAGE_AND_MODAL_CONTENT.title}
          </h1>
          <p className="text-body-3  xl:text-body-2">
            {callbackPage
              ? AUTH_PAGE_AND_MODAL_CONTENT.authInProgressText
              : emailVerification
                ? AUTH_PAGE_AND_MODAL_CONTENT.emailVerificationInProgressText
                : AUTH_PAGE_AND_MODAL_CONTENT.instruction}
          </p>
        </div>
        {callbackPage || emailVerification ? (
          <Spinner />
        ) : (
          <Button
            onClick={handleLogin}
            uppercase={false}
            className="!w-fit"
            disabled={loading}
          >
            <Image
              src={OSMLogo}
              className="size-6"
              alt={AUTH_PAGE_AND_MODAL_CONTENT.buttonText}
            />
            {AUTH_PAGE_AND_MODAL_CONTENT.buttonText}
          </Button>
        )}
        <MadeWithLove />
      </div>
    </Dialog>
  );
};
