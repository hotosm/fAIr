import SlDialog from "@shoelace-style/shoelace/dist/react/dialog/index.js";
import "./dialog.css";
import { SHOELACE_SIZES } from "@/enums";

type DialogProps = {
  label: string;
  isOpened: boolean;
  closeDialog: () => void;
  children: React.ReactNode;
  size?: SHOELACE_SIZES;
  preventClose?: boolean;
  labelColor?: 'default' | "primary"
};
const Dialog: React.FC<DialogProps> = ({
  isOpened,
  closeDialog,
  label,
  children,
  size = "medium",
  preventClose,
  labelColor = "default"
}) => {
  // Prevent the dialog from closing when the user clicks on the overlay
  function handleRequestClose(event: any) {
    if (event.detail.source === "overlay") {
      event.preventDefault();
    }
  }

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
          size === "small"
            ? "25vw"
            : size === "medium"
              ? "50vw"
              : size === "extra-large"
                ? "100vw"
                : "75vw",
      }}
    >
      {children}
    </SlDialog>
  );
};

export default Dialog;
