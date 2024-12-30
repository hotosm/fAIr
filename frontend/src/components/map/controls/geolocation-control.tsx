import { GeolocationIcon } from '@/components/ui/icons';
import { Map } from 'maplibre-gl';
import { showErrorToast, showWarningToast } from '@/utils';
import { TOAST_NOTIFICATIONS } from '@/constants';
import { ToolTip } from '@/components/ui/tooltip';
import { ToolTipPlacement } from '@/enums';
import { useCallback } from 'react';

export const GeolocationControl = ({ map }: { map: Map | null }) => {
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
      showWarningToast(TOAST_NOTIFICATIONS.geolocationNotSupported);
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
