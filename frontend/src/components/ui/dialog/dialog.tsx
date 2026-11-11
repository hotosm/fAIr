import useScreenSize from "@/hooks/use-screen-size";
import { SHOELACE_SIZES } from "@/enums";
import { SlDialog } from "@shoelace-style/shoelace/dist/react";
import { setAnimation } from "@shoelace-style/shoelace/dist/utilities/animation-registry.js";
import { useEffect, useRef } from "react";
import "./dialog.css";

/** Slide up from the bottom edge, like a native sheet. */
const SHEET_SHOW = {
  keyframes: [
    { transform: "translateY(100%)" },
    { transform: "translateY(0)" },
  ],
  options: { duration: 250, easing: "ease-out" },
};
const SHEET_HIDE = {
  keyframes: [
    { transform: "translateY(0)" },
    { transform: "translateY(100%)" },
  ],
  options: { duration: 200, easing: "ease-in" },
};

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
  /**
   * How the dialog appears on phones: a bottom sheet (default) or a small
   * card in the middle of the screen, e.g. for short confirmations.
   */
  mobileLayout?: "sheet" | "centered";
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
  mobileLayout = "sheet",
}) => {
  // Prevent the dialog from closing when the user clicks on the overlay
  function handleRequestClose(event: any) {
    if (event.detail.source === "overlay") {
      event.preventDefault();
    }
  }

  const { isLaptop, isSmallViewport } = useScreenSize();
  const isSheet = isSmallViewport && mobileLayout === "sheet";

  const dialogRef = useRef<React.ComponentRef<typeof SlDialog>>(null);
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    // null restores Shoelace's default zoom animation.
    setAnimation(el, "dialog.show", isSheet ? SHEET_SHOW : null);
    setAnimation(el, "dialog.hide", isSheet ? SHEET_HIDE : null);
  }, [isSheet]);

  const size_ = isSheet
    ? SHOELACE_SIZES.EXTRA_LARGE
    : isSmallViewport
      ? SHOELACE_SIZES.SMALL
      : size
        ? size
        : isLaptop
          ? SHOELACE_SIZES.LARGE
          : SHOELACE_SIZES.MEDIUM;

  return (
    <SlDialog
      ref={dialogRef}
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
      className={`sl-dialog ${labelColor} ${borderRadius} ${noPadding ? " no-padding" : ""} ${isSheet ? "bottom-sheet" : ""} ${className}`}
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
