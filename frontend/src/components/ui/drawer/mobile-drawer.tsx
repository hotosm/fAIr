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
          className="border-b-none fixed inset-x-0 bottom-0 z-[1] -mx-px flex h-full max-h-[97%] flex-col rounded-t-[10px] border border-gray-border  bg-white py-2 outline-none lg:h-[320px]"
        >
          <div
            className={cn(`flex flex-col max-w-md mx-auto w-full app-padding`, {
              "overflow-y-auto": snap === lastSnapPoint,
              "overflow-hidden": snap !== lastSnapPoint,
            })}
          >
            {canClose ? (
              <Drawer.Close
                className="app-padding flex w-full justify-end"
                onClick={closeDrawer}
              >
                <span className="icon-interaction w-fit rounded-full px-2.5 py-1 text-body-2 text-grey">
                  {" "}
                  &#x2715;
                </span>
              </Drawer.Close>
            ) : null}
            <Drawer.Title hidden>{dialogTitle}</Drawer.Title>
            <Drawer.Description hidden>{dialogTitle}</Drawer.Description>
            <div
              aria-hidden
              className="mx-auto mb-4 h-1.5 w-12 shrink-0 rounded-full bg-grey"
            />
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
