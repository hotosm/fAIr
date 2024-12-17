import { SlDrawer } from "@shoelace-style/shoelace/dist/react";
import "./drawer.css";
import { DrawerPlacements } from "@/enums";

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
      onSlAfterHide={() => setOpen(false)}
      noHeader={noHeader}
    >
      {children}
    </SlDrawer>
  );
};

export default Drawer;
