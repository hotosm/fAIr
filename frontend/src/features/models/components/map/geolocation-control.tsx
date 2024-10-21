import { useToast } from "@/app/providers/toast-provider";
import { GeolocationIcon } from "@/components/ui/icons";
import { Map } from "maplibre-gl";
import { useCallback } from "react";

const GeolocationControl = ({ map }: { map: Map | null }) => {
  const { notify } = useToast();
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
          notify(`Error getting location: ${error.message}.`, "danger");
        },
      );
    } else {
      notify("Geolocation is not supported by this browser.", "warning");
    }
  }, [map]);

  if (!map) return null;

  return (
    <button
      className="p-2 bg-white flex items-center justify-center"
      onClick={handleGeolocationClick}
    >
      <GeolocationIcon className="w-3.5 h-3.5" />
    </button>
  );
};

export default GeolocationControl;
