import SlDrawer from "@shoelace-style/shoelace/dist/react/drawer/index.js";
import "./drawer.css";

type DrawerProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  placement: "top" | "bottom" | "end";
  children: React.ReactNode;
  label?: string;
};
const Drawer: React.FC<DrawerProps> = ({
  children,
  open,
  setOpen,
  placement,
  label = "",
}) => {
  return (
    <SlDrawer
      label={label}
      placement={placement}
      open={open}
      onSlAfterHide={() => setOpen(false)}
      noHeader
    >
      {children}
    </SlDrawer>
  );
};

export default Drawer;
