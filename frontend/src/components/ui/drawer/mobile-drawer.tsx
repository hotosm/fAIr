import { cn } from "@/utils";
import React, { useState } from "react";
import { Drawer } from "vaul";

export const MobileDrawer = ({
  open,
  children,
  dialogTitle,
  canClose = false,
  closeDrawer,
  startingSnapPoint = "150px",
}: {
  open: boolean;
  children: React.ReactNode;
  dialogTitle: string;
  closeDrawer?: () => void;
  canClose?: boolean;
  startingSnapPoint?: number | string;
}) => {
  const snapPoints = [startingSnapPoint, "355px", 0.8];

  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);

  return (
    <Drawer.Root
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      open={open}
      onClose={closeDrawer}
    >
      <Drawer.Overlay className="fixed inset-0 bg-black/40" />
      <Drawer.Portal>
        <Drawer.Content
          data-testid="content"
          className="fixed z-[100000] border border-gray-border flex flex-col bg-white border-b-none py-2 rounded-t-[10px] bottom-0 left-0 right-0 h-full max-h-[97%] mx-[-1px]"
        >
          {canClose ? (
            <Drawer.Close
              className="flex w-full justify-end text-body-2 app-padding"
              onClick={closeDrawer}
            >
              &#x2715;
            </Drawer.Close>
          ) : null}
          <Drawer.Title
            hidden
            className="text-center py-2 text-body-3 font-semibold"
          >
            {dialogTitle}
          </Drawer.Title>
          <Drawer.Description hidden>{dialogTitle}</Drawer.Description>
          <div
            aria-hidden
            className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray mb-4"
          />
          <div
            className={cn(
              "flex flex-col max-w-md mx-auto w-full max-h-[70vh] my-4",
              {
                "overflow-y-auto": snap === 0.8,
                "overflow-hidden": snap !== 0.8,
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
