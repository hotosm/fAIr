import { TryFairMapOutputType } from "@/enums";
import { errorMessages } from "@/constants";
import { MapComponent, ZoomControls } from "@/components/map";
import { useEffect, useMemo, useState } from "react";
import { useMapInstance } from "@/hooks/use-map-instance";
import { showErrorToast } from "@/utils";
import { BBOX } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { TryFairPredictionsLayer } from "@/features/try-fair/components/map/try-fair-prediction-results";
import { TryFairPolygonLegend } from "@/features/try-fair/components/map/polygon-legend";
import { TryFairPointsLegend } from "@/features/try-fair/components/map/points-legend";

/**
 * Computes a tight [west, south, east, north] bbox from every coordinate in a
 * FeatureCollection. Returns null for empty or geometry-less collections.
 * Used as a fallback when the prediction record carries no bbox or geometry.
 */
const bboxFromFeatureCollection = (
  fc: GeoJSON.FeatureCollection,
): BBOX | null => {
  let west = Infinity,
    south = Infinity,
    east = -Infinity,
    north = -Infinity;

  const visit = (
    coords:
      | number[]
      | number[][]
      | number[][][]
      | number[][][][],
  ) => {
    if (typeof coords[0] === "number") {
      const [lng, lat] = coords as number[];
      if (lng < west) west = lng;
      if (lng > east) east = lng;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
    } else {
      (coords as (number[] | number[][] | number[][][])[]).forEach((c) =>
        visit(c as number[] | number[][] | number[][][]),
      );
    }
  };

  for (const f of fc.features) {
    if (!f.geometry) continue;
    const geom = f.geometry as GeoJSON.Geometry;
    if (geom.type === "GeometryCollection") continue;
    visit(
      (
        geom as
          | GeoJSON.Point
          | GeoJSON.LineString
          | GeoJSON.Polygon
          | GeoJSON.MultiPoint
          | GeoJSON.MultiLineString
          | GeoJSON.MultiPolygon
      ).coordinates as number[] | number[][] | number[][][] | number[][][][],
    );
  }

  if (!isFinite(west)) return null;
  return [west, south, east, north];
};

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
        if (!cancelled)
          showErrorToast(undefined, errorMessages.MAP_LOAD_FAILURE);
      })
      .finally(() => {
        if (!cancelled) setResultsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [geojsonUrl]);

  // Derive a fallback bbox from the loaded predictions so the polygon/points
  // layers still have a usable extent even when prediction.bbox is absent.
  const effectiveBounds: BBOX | null = useMemo(() => {
    if (bounds) return bounds;
    if (!predictions) return null;
    return bboxFromFeatureCollection(predictions);
  }, [bounds, predictions]);

  // Center on the result bounds instantly — no fly-in.
  useEffect(() => {
    if (!map || !effectiveBounds) return;
    map.resize();
    map.fitBounds(
      [effectiveBounds[0], effectiveBounds[1], effectiveBounds[2], effectiveBounds[3]],
      { padding: 20, duration: 0, animate: false, essential: true },
    );
  }, [map, effectiveBounds]);

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
          predictionBBox={effectiveBounds}
          predictionGridZoom={gridZoom}
          outputType={outputType}
        />

        {outputType === TryFairMapOutputType.POINTS ? (
          <TryFairPointsLegend
            totalCount={predictions?.features.length ?? 0}
          />
        ) : outputType === TryFairMapOutputType.POLYGON ? (
          <TryFairPolygonLegend
            totalCount={predictions?.features.length ?? 0}
          />
        ) : null}
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
