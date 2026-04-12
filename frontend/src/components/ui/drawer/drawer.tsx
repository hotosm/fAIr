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
  className?: string;
};
const Drawer: React.FC<DrawerProps> = ({
  children,
  open,
  setOpen,
  placement,
  label = "",
  noHeader = true,
  className,
}) => {
  return (
    <SlDrawer
      label={label}
      placement={placement}
      open={open}
      onSlAfterHide={(event: CustomEvent) => {
        if (event.target === event.currentTarget) {
          setOpen(false);
        }
      }}
      noHeader={noHeader}
      className={className}
    >
      {children}
    </SlDrawer>
  );
};

export default Drawer;
