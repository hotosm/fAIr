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
}) => {
  // Prevent the dialog from closing when the user clicks on the overlay
  function handleRequestClose(event: any) {
    if (event.detail.source === "overlay") {
      event.preventDefault();
    }
  }

  const { isLaptop, isSmallViewport } = useScreenSize();

  const size_ = size
    ? size
    : isSmallViewport
      ? SHOELACE_SIZES.EXTRA_LARGE
      : isLaptop
        ? SHOELACE_SIZES.LARGE
        : SHOELACE_SIZES.MEDIUM;

  return (
    <SlDialog
      label={label}
      open={isOpened}
      onSlRequestClose={preventClose ? handleRequestClose : () => null}
      onSlAfterHide={(event: CustomEvent) => {
        if (event.target === event.currentTarget) {
          closeDialog();
        }
      }}
      className={`${labelColor} ${borderRadius}`}
      style={{
        //@ts-expect-error bad type definition

        "--width":
          size_ === SHOELACE_SIZES.SMALL
            ? "25vw"
            : size_ === SHOELACE_SIZES.MEDIUM
              ? "50vw"
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
