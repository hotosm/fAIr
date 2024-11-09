import { GeolocationIcon } from "@/components/ui/icons";
import { useToastNotification } from "@/hooks/use-toast-notification";
import { Map } from "maplibre-gl";
import { useCallback } from "react";
import { ToolTip } from "../ui/tooltip";
import { ToolTipPlacement } from "@/enums";
import { showErrorToast } from "@/utils";

const GeolocationControl = ({ map }: { map: Map | null }) => {
  const toast = useToastNotification();
  const handleGeolocationClick = useCallback(() => {
    if (!map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.flyTo({
            center: [longitude, latitude],
            zoom: 12,
            essential: true,
          });
        },
        (error) => {
          showErrorToast(error, `Error getting location: ${error.message}.`);
        },
      );
    } else {
      toast("Geolocation is not supported by this browser.", "warning");
    }
  }, [map]);

  if (!map) return null;

  return (
    <ToolTip content="Geolocate" placement={ToolTipPlacement.RIGHT}>
      <button
        className="p-2 bg-white flex items-center justify-center"
        onClick={handleGeolocationClick}
      >
        <GeolocationIcon className="map-icon p-0" />
      </button>
    </ToolTip>
  );
};

export default GeolocationControl;
