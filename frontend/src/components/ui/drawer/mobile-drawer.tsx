import { cn } from "@/utils";
import React, { useState } from "react";
import { Drawer } from "vaul";

const snapPoints = ["150px", "355px", 1];

export const MobileDrawer = ({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) => {
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);

  return (
    <Drawer.Root
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      open={open}
    >
      <Drawer.Overlay className="fixed inset-0 bg-black/40" />
      <Drawer.Portal>
        <Drawer.Content
          data-testid="content"
          className="fixed z-[100000] flex flex-col bg-white border-b-none py-2 rounded-t-[10px] bottom-0 left-0 right-0 h-full max-h-[97%] mx-[-1px]"
        >
          <div
            aria-hidden
            className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray mb-4"
          />
          <div
            className={cn("flex flex-col max-w-md mx-auto w-full ", {
              "overflow-y-auto": snap === 1,
              "overflow-hidden": snap !== 1,
            })}
          >
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
