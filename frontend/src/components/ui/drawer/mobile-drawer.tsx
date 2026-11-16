import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/utils";
import { Drawer } from "vaul";

export const MobileDrawer = ({
  open,
  children,
  dialogTitle,
  canClose = false,
  closeDrawer,
  snapPoints = [0.2, 0.5, 0.8],
  modal = true,
  showOverlay = true,
  handleOnly = false,
}: {
  open: boolean;
  children: React.ReactNode;
  dialogTitle: string;
  closeDrawer?: () => void;
  canClose?: boolean;
  startingSnapPoint?: number | string;
  snapPoints?: (number | string)[];
  modal?: boolean;
  showOverlay?: boolean;
  handleOnly?: boolean;
}) => {
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);
  const lastSnapPoint = snapPoints[snapPoints.length - 1];

  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const gestureStart = useRef<{ x: number; y: number } | null>(null);
  const gestureMoved = useRef(false);

  // The whole sheet is draggable, so a drag can start on a button. Record
  // where every press starts, and swallow the click that ends a drag so the
  // button isn't activated (only real taps reach the sheet's controls).
  const handleGestureDown = (event: React.PointerEvent) => {
    gestureStart.current = { x: event.clientX, y: event.clientY };
    gestureMoved.current = false;
  };
  const handleGestureUp = (event: React.PointerEvent) => {
    const start = gestureStart.current;
    gestureMoved.current = Boolean(
      start &&
      (Math.abs(event.clientX - start.x) > 8 ||
        Math.abs(event.clientY - start.y) > 8),
    );
  };
  const handleClickCapture = (event: React.MouseEvent) => {
    if (!gestureMoved.current) return;
    gestureMoved.current = false;
    event.preventDefault();
    event.stopPropagation();
  };
  const isNonModalSheet = !modal && snapPoints.length > 1;
  const lowestSnapPoint = snapPoints[0];
  const isRaised = snap !== lowestSnapPoint;

  // A raised non-modal sheet (e.g. the try fAIr settings) collapses when the
  // user presses anywhere outside it, such as on the map, so it never stays
  // in the way. Presses inside pop-ups opened from the sheet (dialogs,
  // dropdowns) don't count.
  useEffect(() => {
    if (!isNonModalSheet || !isRaised) return;
    const handleOutsidePress = (event: PointerEvent) => {
      const path = event.composedPath();
      const content = contentRef.current;
      if (content && path.includes(content)) return;
      const insidePopup = path.some(
        (node) =>
          node instanceof Element &&
          node.matches(
            "sl-dialog, sl-drawer, sl-dropdown, sl-popup, [role='dialog'], [role='menu'], [role='listbox']",
          ),
      );
      if (insidePopup) return;
      setSnap(lowestSnapPoint);
    };
    document.addEventListener("pointerdown", handleOutsidePress, true);
    return () =>
      document.removeEventListener("pointerdown", handleOutsidePress, true);
  }, [isNonModalSheet, isRaised, lowestSnapPoint]);

  const handlePressDown = (event: React.PointerEvent) => {
    pressStart.current = { x: event.clientX, y: event.clientY };
    // vaul won't snap the sheet on release while any text is selected.
    window.getSelection()?.removeAllRanges();
  };

  const handlePressUp = (event: React.PointerEvent) => {
    const start = pressStart.current;
    pressStart.current = null;
    if (!start) return;
    const moved =
      Math.abs(event.clientX - start.x) > 8 ||
      Math.abs(event.clientY - start.y) > 8;
    if (moved) return;
    setSnap((current) =>
      current === lastSnapPoint ? snapPoints[0] : lastSnapPoint,
    );
  };

  return (
    <Drawer.Root
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      open={open}
      onClose={closeDrawer}
      repositionInputs={false}
      modal={modal}
      handleOnly={handleOnly}
      // Without a close handler the sheet is permanent (e.g. the try fAIr
      // settings): a hard swipe down must snap back to the lowest point,
      // not dismiss it off screen with no way to bring it back.
      dismissible={Boolean(closeDrawer)}
    >
      {showOverlay ? (
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
      ) : null}
      <Drawer.Portal>
        <Drawer.Content
          ref={contentRef}
          onPointerDownCapture={handleGestureDown}
          onPointerUpCapture={handleGestureUp}
          onClickCapture={handleClickCapture}
          data-testid="content"
          className="fixed z-[10] border border-gray-border flex flex-col bg-white border-b-none py-2 rounded-t-[10px] bottom-0 left-0 right-0  h-full max-h-[97%] mx-[-1px] lg:h-[320px] outline-none"
        >
          <div
            className={cn(
              `flex flex-col max-w-md mx-auto w-full app-padding pb-[calc(env(safe-area-inset-bottom)+1rem)]`,
              {
                "overflow-y-auto": snap === lastSnapPoint,
                "overflow-hidden": snap !== lastSnapPoint,
              },
            )}
          >
            {canClose ? (
              <Drawer.Close
                className="w-full flex justify-end app-padding"
                onClick={closeDrawer}
              >
                <span className="text-body-2 text-grey icon-interaction w-fit py-1 px-2.5 rounded-full">
                  {" "}
                  &#x2715;
                </span>
              </Drawer.Close>
            ) : null}
            <Drawer.Title hidden>{dialogTitle}</Drawer.Title>
            <Drawer.Description hidden>{dialogTitle}</Drawer.Description>
            <div
              role="button"
              tabIndex={0}
              aria-label="Expand or collapse panel"
              onPointerDown={handlePressDown}
              onPointerUp={handlePressUp}
              // select-none: a drag that starts here mustn't select the
              // sheet's text, or vaul skips snapping when the finger lifts.
              className="mx-auto mb-2 w-full cursor-pointer select-none"
            >
              {/* The whole strip is the drag handle, not just the small bar,
                  so the sheet can be swiped up or down with a finger. The !
                  overrides vaul's own tiny-bar handle styles. */}
              <Drawer.Handle
                preventCycle
                className="!flex !h-8 !w-full !items-center !justify-center !rounded-none !bg-transparent !opacity-100 [&>[data-vaul-handle-hitarea]]:flex [&>[data-vaul-handle-hitarea]]:items-center [&>[data-vaul-handle-hitarea]]:justify-center"
              >
                <span className="block h-1.5 w-12 rounded-full bg-grey" />
              </Drawer.Handle>
            </div>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
