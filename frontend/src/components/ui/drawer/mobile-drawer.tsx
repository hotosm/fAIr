import React, { useState } from "react";
import { cn } from "@/utils";
import { Drawer } from "vaul";

export const MobileDrawer = ({
  open,
  children,
  dialogTitle,
  canClose = false,
  closeDrawer,
  snapPoints = [0.2, 0.5, 0.8],
}: {
  open: boolean;
  children: React.ReactNode;
  dialogTitle: string;
  closeDrawer?: () => void;
  canClose?: boolean;
  startingSnapPoint?: number | string;
  snapPoints?: number[];
}) => {
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);
  const lastSnapPoint = snapPoints[snapPoints.length - 1];

  return (
    <Drawer.Root
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      open={open}
      onClose={closeDrawer}
      repositionInputs={false}
    >
      <Drawer.Overlay className="fixed inset-0 bg-black/40" />
      <Drawer.Portal>
        <Drawer.Content
          data-testid="content"
          className="fixed z-[100000] border border-gray-border flex flex-col bg-white border-b-none py-2 rounded-t-[10px] bottom-0 left-0 right-0 h-full max-h-[97%] mx-[-1px] lg:h-[320px] outline-none"
        >
          {canClose ? (
            <Drawer.Close
              className="w-full flex justify-end app-padding"
              onClick={closeDrawer}
            >
              <span className="text-body-2 text-gray icon-interaction w-fit py-1 px-2.5 rounded-full">
                {" "}
                &#x2715;
              </span>
            </Drawer.Close>
          ) : null}
          <Drawer.Title hidden>{dialogTitle}</Drawer.Title>
          <Drawer.Description hidden>{dialogTitle}</Drawer.Description>
          <div
            aria-hidden
            className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray mb-4"
          />
          <div
            className={cn(
              `flex flex-col max-w-md mx-auto w-full h-full flex-1`,
              {
                "overflow-y-auto": snap === lastSnapPoint,
                "overflow-hidden": snap !== lastSnapPoint,
              },
            )}
          >
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
