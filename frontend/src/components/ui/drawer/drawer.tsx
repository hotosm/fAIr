import { DrawerPlacements } from "@/enums";
import { SlDrawer } from "@shoelace-style/shoelace/dist/react";
import "./drawer.css";

type DrawerProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  placement: DrawerPlacements;
  children: React.ReactNode;
  label?: string;
  noHeader?: boolean;
};
const Drawer: React.FC<DrawerProps> = ({
  children,
  open,
  setOpen,
  placement,
  label = "",
  noHeader = true,
}) => {
  return (
    <SlDrawer
      label={label}
      placement={placement}
      open={open}
      onSlAfterHide={(e) => {
        setOpen(false);
        e.stopPropagation();
      }}
      noHeader={noHeader}
    >
      {children}
    </SlDrawer>
  );
};

export default Drawer;
