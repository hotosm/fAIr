import { TryFairMapOutputType } from "@/enums";
import { errorMessages } from "@/constants";
import { MapComponent, ZoomControls } from "@/components/map";
import { useEffect, useState } from "react";
import { useMapInstance } from "@/hooks/use-map-instance";
import { showErrorToast } from "@/utils";
import { BBOX } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { TryFairPredictionsLayer } from "@/features/try-fair/components/map/try-fair-prediction-results";


export const MapRequestResultMap = ({
  geojsonUrl,
  imageryUrl,
  outputType,
  bounds,
  gridZoom,
}: {
  geojsonUrl: string;
  imageryUrl: string;
  outputType: TryFairMapOutputType;
  bounds: BBOX | null;
  gridZoom?: number;
}) => {
  const { mapContainerRef, map } = useMapInstance(false, false);
  const [predictions, setPredictions] =
    useState<GeoJSON.FeatureCollection | null>(null);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [imageryLoading, setImageryLoading] = useState(false);

  // Load the result GeoJSON.
  useEffect(() => {
    if (!geojsonUrl) {
      setResultsLoading(false);
      return;
    }
    let cancelled = false;
    setResultsLoading(true);

    fetch(geojsonUrl)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: GeoJSON.FeatureCollection) => {
        if (!cancelled) setPredictions(data);
      })
      .catch(() => {
        if (!cancelled) showErrorToast(undefined, errorMessages.MAP_LOAD_FAILURE);
      })
      .finally(() => {
        if (!cancelled) setResultsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [geojsonUrl]);

  // Center on the result bounds instantly — no fly-in.
  useEffect(() => {
    if (!map || !bounds) return;
    map.resize();
    map.fitBounds([bounds[0], bounds[1], bounds[2], bounds[3]], {
      padding: 20,
      duration: 0,
      animate: false,
      essential: true,
    });
  }, [map, bounds]);

  const isLoading = resultsLoading || imageryLoading;

  return (
    <div className="relative h-full w-full">
      <MapComponent
        hasTileServiceLayer
        basemaps
        zoomControls={false}
        tileServiceURL={imageryUrl}
        onTileServiceLoadingChange={setImageryLoading}
        mapContainerRef={mapContainerRef}
        map={map}
      >
        {map && (
          <div className="absolute top-5 right-3 map-elements-z-index flex flex-col gap-y-4">
            <div className="flex bg-white rounded-[4px] border border-gray-border md:border-0 shadow-sm flex-col gap-y-0">
              <ZoomControls
                map={map}
                rounded={false}
                className="gap-y-0"
                buttonClassName="size-8 p-1.5 bg-white border-0 flex items-center justify-center text-dark rounded-none"
                zoomInClassName="border-b text-dark border-[#E4E4E4] border-t-0 border-x-0 rounded-t-[4px]"
                zoomOutClassName="border-b text-dark border-[#E4E4E4] border-t-0 border-x-0 rounded-none"
                iconClassName="size-4 p-0 text-base leading-none"
              />

            </div>
          </div>
        )}
        <TryFairPredictionsLayer
          map={map}
          predictions={predictions}
          predictionBBox={bounds}
          predictionGridZoom={gridZoom}
          outputType={outputType}
        />
      </MapComponent>

      {isLoading && (
        <div
          className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-white/40"
          aria-live="polite"
          aria-busy="true"
        >
          <Spinner style={{ fontSize: "2.5rem" }} />
        </div>
      )}
    </div>
  );
};
