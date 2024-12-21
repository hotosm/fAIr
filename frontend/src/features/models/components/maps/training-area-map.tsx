import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { MapComponent } from "@/components/map";
import { ControlsPosition } from "@/enums";
import { PMTiles } from "pmtiles";
import {
  LayerSpecification,
  MapLayerMouseEvent,
  Popup,
  SourceSpecification,
} from "maplibre-gl";

import {
  extractTileJSONURL,
  showErrorToast,
  TRAINING_AREAS_AOI_FILL_COLOR,
  TRAINING_AREAS_AOI_FILL_OPACITY,
  TRAINING_AREAS_AOI_LABELS_FILL_COLOR,
  TRAINING_AREAS_AOI_LABELS_FILL_OPACITY,
  TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR,
  TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH,
  TRAINING_AREAS_AOI_OUTLINE_COLOR,
  TRAINING_AREAS_AOI_OUTLINE_WIDTH,
} from "@/utils";

import { errorMessages } from "@/constants";
import { addLayers, addSources } from "@/utils/map-utils";
import { useMapInstance } from "@/hooks/use-map-instance";

type Metadata = {
  name?: string;
  type?: string;
  tilestats?: unknown;
  vector_layers: LayerSpecification[];
};

const getLayerConfigs = (layerType: string) => {
  const isAoi = layerType === "aois";
  return {
    fill: {
      "fill-color": isAoi
        ? TRAINING_AREAS_AOI_FILL_COLOR
        : TRAINING_AREAS_AOI_LABELS_FILL_COLOR,
      "fill-opacity": isAoi
        ? TRAINING_AREAS_AOI_FILL_OPACITY
        : TRAINING_AREAS_AOI_LABELS_FILL_OPACITY,
    },
    outline: {
      "line-color": isAoi
        ? TRAINING_AREAS_AOI_OUTLINE_COLOR
        : TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR,
      "line-width": isAoi
        ? TRAINING_AREAS_AOI_OUTLINE_WIDTH
        : TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH,
    },
  };
};

type TBounds = [[number, number], [number, number]];

export const TrainingAreaMap = ({
  file,
  trainingAreaId,
  tmsURL,
  visible,
}: {
  file: string;
  trainingAreaId: number;
  tmsURL: string;
  visible: boolean;
}) => {
  const { mapContainerRef, map, currentZoom } = useMapInstance();

  const [vectorLayers, setVectorLayers] = useState<LayerSpecification[]>([]);

  const popupRef = useRef<Popup | null>(null);

  const boundsRef = useRef<TBounds>([
    [0, 0],
    [0, 0],
  ]);

  const tileJSONURL = extractTileJSONURL(tmsURL);

  const trainingAreasSourceId = useMemo(
    () => `training-areas-for-${trainingAreaId}`,
    [trainingAreaId],
  );

  const mapLayers: LayerSpecification[] = useMemo(() => {
    return vectorLayers.flatMap((layer) => {
      const { fill, outline } = getLayerConfigs(layer.id);
      return [
        {
          id: `${layer.id}_fill`,
          type: "fill",
          source: trainingAreasSourceId,
          paint: fill,
          "source-layer": layer.id,
          layout: { visibility: "visible" },
        },
        {
          id: `${layer.id}_outline`,
          type: "line",
          source: trainingAreasSourceId,
          paint: outline,
          "source-layer": layer.id,
          layout: { visibility: "visible" },
        },
      ];
    });
  }, [vectorLayers, trainingAreasSourceId]);

  const sources = useMemo(
    () => [
      {
        id: trainingAreasSourceId,
        spec: {
          type: "vector",
          url: `pmtiles://${file}`,
        } as SourceSpecification,
      },
    ],
    [file, trainingAreasSourceId],
  );

  const layerControlLayers = useMemo(
    () =>
      vectorLayers.map((layer) => ({
        value: `Training ${layer.id}`,
        subLayers: [`${layer.id}_fill`, `${layer.id}_outline`],
      })),
    [vectorLayers],
  );

  const fitToBounds = useCallback(() => {
    if (
      map &&
      boundsRef.current[0][0] !== boundsRef.current[1][0] &&
      boundsRef.current[0][1] !== boundsRef.current[1][1]
    ) {
      map.fitBounds(boundsRef.current, { padding: 10 });
    }
  }, [map]);

  const handleMouseClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!map) return;

      const { lngLat, point } = e;
      const [x, y] = [point.x, point.y];
      const radius = 2;

      const queriedFeatures = map.queryRenderedFeatures(
        [
          [x - radius, y - radius],
          [x + radius, y + radius],
        ],
        {
          layers: vectorLayers.flatMap((layer) => [
            `${layer.id}_fill`,
            `${layer.id}_outline`,
          ]),
        },
      );

      const clickedFeatures = queriedFeatures.filter(
        (feature) => feature.source === trainingAreasSourceId,
      );

      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }

      if (clickedFeatures.length) {
        const feature = clickedFeatures[0];
        // @ts-expect-error bad type definition
        const sourceLayer = feature.layer["source-layer"];
        const html = `
                    <div class="p-4 w-full overflow-auto">
                        <span><strong>${sourceLayer}</strong></span>
                        <table>
                            <tbody>
                                ${Object.entries(feature.properties)
                                  .map(
                                    ([key, value]) => `
                                    <tr>
                                        <td class="text-gray">${key}</td>
                                        <td class="font-semibold text-dark">${typeof value === "boolean" ? JSON.stringify(value) : value}</td>
                                    </tr>
                                `,
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    </div>
                `;

        const popup = new Popup({ closeButton: false, closeOnClick: true })
          .setLngLat(lngLat)
          .setHTML(html)
          .addTo(map);
        popupRef.current = popup;
      }
    },
    [map, trainingAreasSourceId, vectorLayers],
  );

  useEffect(() => {
    if (map && visible) {
      map.resize();
      fitToBounds();
    }
  }, [map, visible, fitToBounds]);

  useEffect(() => {
    if (!map || !visible) return;

    map.getCanvas().style.cursor = "pointer";

    const loadPMTilesLayers = async () => {
      try {
        const pmtilesFile = new PMTiles(file);
        const header = await pmtilesFile.getHeader();
        const bounds = [
          [header.minLon, header.minLat],
          [header.maxLon, header.maxLat],
        ];
        boundsRef.current = bounds as TBounds;

        fitToBounds();

        const metadata = (await pmtilesFile.getMetadata()) as Metadata;
        const layers = metadata.vector_layers;
        setVectorLayers(layers);
      } catch (error) {
        console.error("Error loading PMTiles:", error);
        showErrorToast(errorMessages.MAP_LOAD_FAILURE);
      }
    };
    loadPMTilesLayers();
  }, [map, file, trainingAreasSourceId, visible, fitToBounds]);

  useEffect(() => {
    if (!map) return;
    map.on("click", handleMouseClick);
    return () => {
      map.off("click", handleMouseClick);
    };
  }, [map, handleMouseClick]);

  useEffect(() => {
    if (!map) return;
    addSources(map, sources);
    addLayers(map, mapLayers);
  }, [map, mapLayers]);

  useEffect(() => {
    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    };
  }, []);

  return (
    <MapComponent
      layerControl
      openAerialMap
      oamTileJSONURL={tileJSONURL}
      controlsPosition={ControlsPosition.TOP_LEFT}
      basemaps
      layerControlLayers={layerControlLayers}
      fitToBounds
      bounds={boundsRef.current}
      mapContainerRef={mapContainerRef}
      map={map}
      currentZoom={currentZoom}
    />
  );
};
