import useScreenSize from "@/hooks/use-screen-size";
import { SHOELACE_SIZES } from "@/enums";
import { SlDialog } from "@shoelace-style/shoelace/dist/react";
import "./dialog.css";

type DialogProps = {
  label?: string;
  isOpened: boolean;
  closeDialog: () => void;
  children: React.ReactNode;
  preventClose?: boolean;
  labelColor?: "default" | "primary";
  borderRadius?: "rounded";
  size?: SHOELACE_SIZES;
  noHeader?: boolean;
  noPadding?: boolean;
  preventEscapeClose?: boolean;
  className?: string;
};
const Dialog: React.FC<DialogProps> = ({
  isOpened,
  closeDialog,
  label = "",
  children,
  preventClose,
  labelColor = "default",
  borderRadius,
  size,
  noHeader = false,
  noPadding = false,
  preventEscapeClose,
  className = "",
}) => {
  // Prevent the dialog from closing when the user clicks on the overlay
  function handleRequestClose(event: any) {
    if (event.detail.source === "overlay") {
      event.preventDefault();
    }
  }

  const { isLaptop, isSmallViewport } = useScreenSize();

  const size_ = isSmallViewport
    ? SHOELACE_SIZES.EXTRA_LARGE
    : size
      ? size
      : isLaptop
        ? SHOELACE_SIZES.LARGE
        : SHOELACE_SIZES.MEDIUM;

  return (
    <SlDialog
      label={label}
      noHeader={noHeader}
      open={isOpened}
      onKeyDownCapture={(event) => {
        if (event.keyCode === 27 && preventEscapeClose) {
          event.preventDefault();
        }
      }}
      onSlRequestClose={preventClose ? handleRequestClose : () => null}
      onSlAfterHide={(event: CustomEvent) => {
        if (event.target === event.currentTarget) {
          closeDialog();
        }
      }}
      className={`sl-dialog ${labelColor} ${borderRadius} ${noPadding ? " no-padding" : ""} ${className}`}
      style={{
        //@ts-expect-error bad type definition

        "--width":
          size_ === SHOELACE_SIZES.SMALL
            ? "clamp(320px, 25vw, 25vw)"
            : size_ === SHOELACE_SIZES.MEDIUM
              ? "clamp(400px, 50vw, 50vw)"
              : size_ === SHOELACE_SIZES.MEDIUM_LARGE
                ? "clamp(380px, 40vw, 40vw)"
                : size_ === SHOELACE_SIZES.EXTRA_LARGE
                  ? "100vw"
                  : "75vw",
      }}
    >
      {children}
    </SlDialog>
  );
};

export default Dialog;
