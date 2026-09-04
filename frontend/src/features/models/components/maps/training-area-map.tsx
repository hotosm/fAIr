import { ControlsPosition } from "@/enums";
import { errorMessages } from "@/constants";
import { MapComponent } from "@/components/map";
import { PMTiles } from "pmtiles";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMapInstance } from "@/hooks/use-map-instance";
import {
  LayerSpecification,
  MapLayerMouseEvent,
  Popup,
  SourceSpecification,
  ExpressionSpecification,
} from "maplibre-gl";
import { AgreementLegend } from "@/features/mapswipe/components/agreement-legend";

import { showErrorToast, addLayers, addSources } from "@/utils";
import {
  MAPSWIPE_AGREEMENT_FILL_COLORS,
  MAPSWIPE_AGREEMENT_OUTLINE_COLORS,
  PREDICTIONS_RESULTS_POINT_FILL_COLOR,
  PREDICTIONS_RESULTS_POINT_OUTLINE_COLOR,
  TRAINING_AREAS_AOI_FILL_COLOR,
  TRAINING_AREAS_AOI_FILL_OPACITY,
  TRAINING_AREAS_AOI_LABELS_FILL_COLOR,
  TRAINING_AREAS_AOI_LABELS_FILL_OPACITY,
  TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR,
  TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH,
  TRAINING_AREAS_AOI_OUTLINE_COLOR,
  TRAINING_AREAS_AOI_OUTLINE_WIDTH,
} from "@/config";

type VectorLayerMeta = LayerSpecification & {
  fields?: Record<string, string>;
};

type Metadata = {
  name?: string;
  type?: string;
  tilestats?: unknown;
  vector_layers: VectorLayerMeta[];
};
// Choropleth fill color for MapSwipe results based on "agreement" property:
// agreement === 1       = green
// agreement === 0       = red
// 0 < agreement < 1     = purple
const buildAgreementColorExpression = (
  defaultColor: string,
  colors: { green: string; red: string; purple: string },
): ExpressionSpecification => [
  "case",
  ["!", ["has", "agreement"]],
  defaultColor,
  ["==", ["get", "agreement"], 1],
  colors.green,
  ["==", ["get", "agreement"], 0],
  colors.red,
  colors.purple,
];

const getLayerConfigs = (layerType: string, isPredictionResult: boolean = false) => {
  const isAoi = layerType === "aois";

  const defaultFillColor = isAoi
    ? TRAINING_AREAS_AOI_FILL_COLOR
    : TRAINING_AREAS_AOI_LABELS_FILL_COLOR;
  const defaultOutlineColor = isAoi
    ? TRAINING_AREAS_AOI_OUTLINE_COLOR
    : TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR;

  return {
    fill: {
      "fill-color": isPredictionResult
        ? buildAgreementColorExpression(defaultFillColor, MAPSWIPE_AGREEMENT_FILL_COLORS)
        : defaultFillColor,
      "fill-opacity": isPredictionResult
        ? 0.6
        : isAoi
          ? TRAINING_AREAS_AOI_FILL_OPACITY
          : TRAINING_AREAS_AOI_LABELS_FILL_OPACITY,
    },
    outline: {
      "line-color": isPredictionResult
        ? buildAgreementColorExpression(defaultOutlineColor, MAPSWIPE_AGREEMENT_OUTLINE_COLORS)
        : defaultOutlineColor,
      "line-width": isAoi
        ? TRAINING_AREAS_AOI_OUTLINE_WIDTH
        : TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH,
    },
    circle: {
      "circle-color": isPredictionResult
        ? buildAgreementColorExpression(
            PREDICTIONS_RESULTS_POINT_FILL_COLOR,
            MAPSWIPE_AGREEMENT_FILL_COLORS,
          )
        : PREDICTIONS_RESULTS_POINT_FILL_COLOR,
      "circle-stroke-color": isPredictionResult
        ? buildAgreementColorExpression(
            PREDICTIONS_RESULTS_POINT_OUTLINE_COLOR,
            MAPSWIPE_AGREEMENT_OUTLINE_COLORS,
          )
        : PREDICTIONS_RESULTS_POINT_OUTLINE_COLOR,
      "circle-stroke-width": 1,
      "circle-radius": 8,
    },
  };
};

type TBounds = [[number, number], [number, number]];

export const TrainingAreaMap = ({
  file,
  trainingAreaId,
  tmsURL,
  visible,
  isPredictionResult = false,
}: {
  file: string;
  trainingAreaId: number;
  tmsURL: string;
  visible: boolean;
  isPredictionResult?: boolean;
}) => {
  const { mapContainerRef, map } = useMapInstance(true);

  const [vectorLayers, setVectorLayers] = useState<LayerSpecification[]>([]);
  const [hasAgreement, setHasAgreement] = useState<boolean>(false);

  const popupRef = useRef<Popup | null>(null);

  const boundsRef = useRef<TBounds>([
    [0, 0],
    [0, 0],
  ]);

  const trainingAreasSourceId = useMemo(
    () =>
      isPredictionResult
        ? `prediction-results-for-${trainingAreaId}`
        : `training-areas-for-${trainingAreaId}`,
    [isPredictionResult, trainingAreaId],
  );

  const mapLayers: LayerSpecification[] = useMemo(
    () =>
      vectorLayers.flatMap((layer) => {
        const { fill, outline, circle } = getLayerConfigs(layer.id, isPredictionResult);

        const layers: LayerSpecification[] = [
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

        if (layer.id.includes("points")) {
          layers.push({
            id: `${layer.id}`,
            type: "circle",
            source: trainingAreasSourceId,
            paint: circle,
            "source-layer": layer.id,
            layout: { visibility: "visible" },
          });
        }

        return layers;
      }),
    [vectorLayers, trainingAreasSourceId, isPredictionResult],
  );

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
    [trainingAreasSourceId, file],
  );

  const layerControlLayers = useMemo(
    () =>
      vectorLayers.map((layer) => ({
        value: `${layer.id}`,
        subLayers: [`${layer.id}_fill`, `${layer.id}_outline`, `${layer.id}`],
      })),
    [vectorLayers],
  );

  const fitToBounds = useCallback(() => {
    if (!map) return;

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
          layers: vectorLayers.flatMap((layer) => [`${layer.id}_fill`, `${layer.id}_outline`]),
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
                                        <td class="text-grey">${key}</td>
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
        if (isPredictionResult) {
          setHasAgreement(layers.some((layer) => layer.fields && "agreement" in layer.fields));
        }
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
      if (!map) return;
      map.off("click", handleMouseClick);
    };
  }, [map, handleMouseClick]);

  useEffect(() => {
    if (!map) return;
    if (!map.getStyle()) return;

    addSources(map, sources);
    addLayers(map, mapLayers);
    return () => {
      if (!map) return;
      if (!map.getStyle()) return;
      mapLayers.forEach((layer) => {
        if (map.getLayer(layer.id)) {
          map.removeLayer(layer.id);
        }
      });
      map.removeSource(trainingAreasSourceId);
    };
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
      hasTileServiceLayer
      layerControl
      tileServiceURL={tmsURL}
      controlsPosition={ControlsPosition.TOP_LEFT}
      basemaps
      layerControlLayers={layerControlLayers}
      fitToBounds
      bounds={boundsRef.current}
      mapContainerRef={mapContainerRef}
      map={map}
      showCurrentZoom
    >
      {isPredictionResult && hasAgreement && <AgreementLegend />}
    </MapComponent>
  );
};
