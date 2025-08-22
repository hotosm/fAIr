import useDebounce from "@/hooks/use-debounce";
import { ControlsPosition } from "@/enums";
import { Map } from "maplibre-gl";
import { PaginatedTrainingArea } from "@/types";
import { MapComponent } from "@/components/map";
import { RefObject, useCallback, useEffect, useState } from "react";
import { useGetTrainingDatasetLabels } from "@/features/model-creation/hooks/use-training-areas";
import {
  MAP_STYLES_PREFIX,
  MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS,
} from "@/config";

import {
  TrainingAreasLayers,
  TrainingAreasLabelsLayers,
} from "@/features/model-creation/components/map-layers";
import { useMapStore } from "@/store/map-store";

// Debounce delay in milliseconds.
const DEBOUNCE_DELAY: number = 300;

export const DatasetAreaMap = ({
  tileServiceURL,
  data,
  trainingDatasetId,
  map,
  mapContainerRef,
  trainingAreaIsPending,
}: {
  tileServiceURL: string;
  data?: PaginatedTrainingArea;
  trainingDatasetId: number;
  map: Map | null;
  mapContainerRef: RefObject<HTMLDivElement | null> | null;
  trainingAreaIsPending: boolean;
}) => {
  // Training Areas
  const trainingAreasOutlineLayerId = `${MAP_STYLES_PREFIX}-dataset-area-${trainingDatasetId}-training-area-layer`;
  const trainingAreasFillLayerId = `${MAP_STYLES_PREFIX}-dataset-area-${trainingDatasetId}-training-area-fill-layer`;
  const trainingAreasSourceId = `${MAP_STYLES_PREFIX}-dataset-area-${trainingDatasetId}-training-area-source`;
  // Trainings Labels
  const trainingAreasLabelsSourceId = `${MAP_STYLES_PREFIX}-dataset-area-${trainingDatasetId}-training-labels-source`;
  const trainingAreasLabelsFillLayerId = `${MAP_STYLES_PREFIX}-dataset-area-${trainingDatasetId}-training-labels-fill-layer`;
  const trainingAreasLabelsOutlineLayerId = `${MAP_STYLES_PREFIX}-dataset-area-${trainingDatasetId}-training-labels-outline-layer`;

  const [bbox, setBbox] = useState<string>("");
  const currentZoom = useMapStore((state) => state.zoom);

  const debouncedBbox = useDebounce(bbox, DEBOUNCE_DELAY);

  const debouncedZoom = useDebounce(currentZoom.toString(), DEBOUNCE_DELAY);

  const { data: labels, isPending: trainingAreasLabelsIsPending } =
    useGetTrainingDatasetLabels(
      trainingDatasetId,
      debouncedBbox,
      Number(debouncedZoom)
    );

  const updateBbox = useCallback(() => {
    if (!map) return;
    const bounds = map.getBounds();
    const newBbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
    setBbox(newBbox);
  }, [map]);

  useEffect(() => {
    if (!map) return;
    map.on("moveend", updateBbox);
    return () => {
      map.off("moveend", updateBbox);
    };
  }, [map]);

  return (
    <MapComponent
      tileServiceURL={tileServiceURL}
      controlsPosition={ControlsPosition.TOP_LEFT}
      showCurrentZoom
      layerControl
      showTileBoundaries
      basemaps
      map={map}
      mapContainerRef={mapContainerRef}
      layerControlLayers={[
        ...(labels && labels?.features.length > 0
          ? [
              {
                value: "Training Labels",
                subLayers: [
                  trainingAreasLabelsFillLayerId,
                  trainingAreasLabelsOutlineLayerId,
                ],
              },
            ]
          : []),
        ...(data?.results?.features?.length
          ? [
              {
                value: "Training Areas",
                subLayers: [
                  trainingAreasOutlineLayerId,
                  trainingAreasFillLayerId,
                ],
              },
            ]
          : []),
      ]}
    >
      {!trainingAreaIsPending && (
        <TrainingAreasLayers
          map={map}
          features={data?.results.features}
          trainingAreasFillLayerId={trainingAreasFillLayerId}
          trainingAreasOutlineLayerId={trainingAreasOutlineLayerId}
          trainingAreasSourceId={trainingAreasSourceId}
        />
      )}

      {!trainingAreasLabelsIsPending &&
      currentZoom >= MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS ? (
        <TrainingAreasLabelsLayers
          map={map}
          features={labels?.features}
          trainingAreasLabelsFillLayerId={trainingAreasLabelsFillLayerId}
          trainingAreasLabelsOutlineLayerId={trainingAreasLabelsOutlineLayerId}
          trainingAreasLabelsSourceId={trainingAreasLabelsSourceId}
        />
      ) : null}
    </MapComponent>
  );
};
