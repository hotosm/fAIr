import { MapProvider } from "@/app/providers/map-provider";
import { Outlet } from "react-router-dom";

const ModelsLayout = ({ children }: { children?: React.ReactNode }) => {
  return <MapProvider>{children ? children : <Outlet />}</MapProvider>;
};

export default ModelsLayout;
