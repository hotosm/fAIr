import React, { useRef, useState } from "react";
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

  const handlePressDown = (event: React.PointerEvent) => {
    pressStart.current = { x: event.clientX, y: event.clientY };
  };

  const handlePressUp = (event: React.PointerEvent) => {
    const start = pressStart.current;
    pressStart.current = null;
    if (!start) return;
    const moved = Math.abs(event.clientX - start.x) > 8 || Math.abs(event.clientY - start.y) > 8;
    if (moved) return;
    setSnap((current) => (current === lastSnapPoint ? snapPoints[0] : lastSnapPoint));
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
    >
      {showOverlay ? <Drawer.Overlay className="fixed inset-0 bg-black/40" /> : null}
      <Drawer.Portal>
        <Drawer.Content
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
              <Drawer.Close className="w-full flex justify-end app-padding" onClick={closeDrawer}>
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
              className="mx-auto mb-3 flex w-full cursor-pointer justify-center py-2"
            >
              <Drawer.Handle
                preventCycle
                className="w-12 h-1.5 flex-shrink-0 rounded-full bg-grey"
              />
            </div>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
