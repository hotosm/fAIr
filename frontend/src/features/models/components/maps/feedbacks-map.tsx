import { FeatureCollection } from "@/types";
import {
  FitToBounds,
  LayerControl,
  MapComponent,
  ZoomLevel,
} from "@/components/map";
import { useEffect, useMemo, useRef } from "react";
import { useMapInstance } from "@/hooks/use-map-instance";
import bbox from "@turf/bbox";
import { ControlsPosition } from "@/enums";
import { FeedbacksLayer } from "./feedbacks-layer";
import {
  MODEL_FEEDBACKS_FILL_LAYER_ID,
  MODEL_FEEDBACKS_OUTLINE_LAYER_ID,
  MODEL_FEEDBACKS_SYMBOL_LAYER_ID,
} from "@/config";

type ModelsMapProps = {
  mapData?: FeatureCollection;
  openAerialMapTileJSONURL: string;
};

type TBounds = [[number, number], [number, number]];

export const FeedbacksMap: React.FC<ModelsMapProps> = ({
  mapData,
  openAerialMapTileJSONURL,
}) => {
  const { map, mapContainerRef } = useMapInstance();

  const boundsRef = useRef<TBounds>([
    [0, 0],
    [0, 0],
  ]);

  const someResultsReady = useMemo(() => {
    return mapData?.features && mapData.features.length > 0;
  }, [mapData]);

  useEffect(() => {
    if (someResultsReady) {
      if (mapData) {
        const calculatedBounds = bbox(mapData);
        boundsRef.current = [
          [calculatedBounds[0], calculatedBounds[1]],
          [calculatedBounds[2], calculatedBounds[3]],
        ];
      }
    }
  }, [mapData]);

  useEffect(() => {
    if (map && boundsRef.current) {
      map.fitBounds(boundsRef.current, { padding: 20 });
    }
  }, [map, boundsRef.current]);

  return (
    <div className="h-full w-full">
      <MapComponent
        map={map}
        mapContainerRef={mapContainerRef}
        zoomControls
        openAerialMap
        controlsPosition={ControlsPosition.TOP_LEFT}
        oamTileJSONURL={openAerialMapTileJSONURL}
      >
        <div className="absolute left-3 z-[1] top-28">
          <FitToBounds
            bounds={boundsRef.current}
            map={map}
            rounded={false}
            mobileClassName="p-1.5"
          />
        </div>
        <div className="absolute right-3 z-[1] top-4 flex flex-col md:flex-row gap-3 items-end">
          <ZoomLevel />
          <LayerControl
            basemaps={false}
            layers={[
              ...(mapData && mapData?.features?.length > 0
                ? [
                    {
                      value: "Feedbacks",
                      subLayers: [
                        MODEL_FEEDBACKS_FILL_LAYER_ID,
                        MODEL_FEEDBACKS_OUTLINE_LAYER_ID,
                        MODEL_FEEDBACKS_SYMBOL_LAYER_ID,
                      ],
                    },
                  ]
                : []),
            ]}
            map={map}
            openAerialMap
          />
        </div>
        {map && <FeedbacksLayer map={map} features={mapData?.features} />}
      </MapComponent>
    </div>
  );
};
