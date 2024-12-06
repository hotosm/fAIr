import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

const ZoomableImage = ({ children }: { children: React.ReactNode }) => {
  return <Zoom>{children}</Zoom>;
};

export default ZoomableImage;
