import React from "react";
import { Popup as SlPopup } from "@hotosm/ui/components/react";

type PopupProps = {
  placement?: "top" | "bottom" | "bottom-start" | "bottom-end";
  distance?: number;
  active: boolean;
  arrow?: boolean;
  skidding?: number;
  children: React.ReactNode;
  anchor?: string | { getBoundingClientRect: () => Record<string, number> };
  flip?: boolean;
};

const Popup: React.FC<PopupProps> = ({
  arrow = false,
  active,
  distance,
  placement,
  skidding,
  children,
  anchor,
  flip = true,
}) => {
  return (
    <SlPopup
      placement={placement}
      active={active}
      distance={distance}
      skidding={skidding}
      arrow={arrow}
      // @ts-expect-error bad type definition
      anchor={anchor}
      flip={flip}
    >
      {children}
    </SlPopup>
  );
};

export default Popup;
