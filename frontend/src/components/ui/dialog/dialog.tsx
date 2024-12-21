import { SlDialog } from "@shoelace-style/shoelace/dist/react";
import "./dialog.css";
import { SHOELACE_SIZES } from "@/enums";
import useScreenSize from "@/hooks/use-screen-size";

type DialogProps = {
  label: string;
  isOpened: boolean;
  closeDialog: () => void;
  children: React.ReactNode;
  preventClose?: boolean;
  labelColor?: "default" | "primary";
};
const Dialog: React.FC<DialogProps> = ({
  isOpened,
  closeDialog,
  label,
  children,
  preventClose,
  labelColor = "default",
}) => {
  // Prevent the dialog from closing when the user clicks on the overlay
  function handleRequestClose(event: any) {
    if (event.detail.source === "overlay") {
      event.preventDefault();
    }
  }
  const { isMobile, isTablet, isLaptop } = useScreenSize();

  const size =
    isMobile || isTablet
      ? SHOELACE_SIZES.EXTRA_LARGE
      : isLaptop
        ? SHOELACE_SIZES.LARGE
        : SHOELACE_SIZES.MEDIUM;

  return (
    <SlDialog
      label={label}
      open={isOpened}
      onSlRequestClose={preventClose ? handleRequestClose : () => null}
      onSlAfterHide={(e) => {
        e.stopPropagation();
        e.preventDefault();
        closeDialog();
      }}
      className={labelColor}
      style={{
        //@ts-expect-error bad type definition
        "--width":
          //@ts-expect-error bad type definition
          size === SHOELACE_SIZES.SMALL
            ? "25vw"
            : size === SHOELACE_SIZES.MEDIUM
              ? "50vw"
              : size === SHOELACE_SIZES.EXTRA_LARGE
                ? "100vw"
                : "75vw",
      }}
    >
      {children}
    </SlDialog>
  );
};

export default Dialog;
