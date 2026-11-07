import { DrawerPlacements } from "@/enums";
import { SlDrawer } from "@shoelace-style/shoelace/dist/react";
import "./drawer.css";

type DrawerProps = {
  id?: string;
  contained?: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  placement: DrawerPlacements;
  children: React.ReactNode;
  label?: string;
  noHeader?: boolean;
  className?: string;
};
const Drawer: React.FC<DrawerProps> = ({
  id,
  contained = false,
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
      id={id}
      contained={contained}
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
