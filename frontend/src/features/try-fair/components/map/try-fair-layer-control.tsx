import { DropDown } from "@/components/ui/dropdown";
import {
  ChevronDownIcon,
  LayerStackIcon,
  TryFairGoogleSatelliteIcon,
  TryFairImageryIcon,
  TryFairOSMIcon,
  TryFairPredictionToggleIcon,
} from "@/components/ui/icons";
import { ToolTip } from "@/components/ui/tooltip";
import {
  GOOGLE_SATELLITE_BASEMAP_LAYER_ID,
  OSM_BASEMAP_LAYER_ID,
  TMS_LAYER_ID,
} from "@/config";
import { ToolTipPlacement } from "@/enums";
import { cn } from "@/utils";
import { Map } from "maplibre-gl";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type TryFairLayerControlProps = {
  map: Map | null;
  hasActivePrediction: boolean;
  hasTileServiceLayer: boolean;
  predictionLayerIds: string[];
};

type LayerRowProps = {
  label: string;
  active: boolean;
  icon: ReactNode;
  onClick: () => void;
};

const LayerRow = ({ label, active, icon, onClick }: LayerRowProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-full flex px-4 items-center gap-x-2 text-xs transition-opacity",
      active ? "opacity-100" : "opacity-45",
    )}
  >
    {icon}
    <span className="text-dark text-left">{label}</span>
  </button>
);

type SectionProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

const Section = ({ title, open, onToggle, children }: SectionProps) => (
  <div className="flex flex-col gap-y-3 mb-1">
    <button
      type="button"
      className="w-full flex px-4 gap-4 items-center  text-sm font-medium text-dark"
      onClick={onToggle}
    >
      {title}
      <ChevronDownIcon
        className={cn("w-3 h-3 transition-transform", open && "rotate-180")}
      />
    </button>
    {open ? <div className="flex flex-col gap-y-3">{children}</div> : null}
  </div>
);

export const TryFairLayerControl = ({
  map,
  hasActivePrediction,
  hasTileServiceLayer,
  predictionLayerIds,
}: TryFairLayerControlProps) => {
  const [layersVisibility, setLayersVisibility] = useState({
    prediction: true,
    imagery: true,
    osm: true,
    googleSatellite: false,
  });
  const [sectionsOpen, setSectionsOpen] = useState({
    predictions: true,
    imagery: true,
    basemap: true,
  });

  const predictionLabel = "Prediction";
  const predictionSwatchClassName = "bg-[#A147D8]";

  const setMapLayerVisibility = (layerId: string, visible: boolean) => {
    if (!map?.isStyleLoaded()) return;
    if (!map.getLayer(layerId)) return;
    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
  };

  const togglePrediction = () => {
    const nextValue = !layersVisibility.prediction;
    predictionLayerIds.forEach((layerId) => {
      setMapLayerVisibility(layerId, nextValue);
    });
    setLayersVisibility((prev) => ({ ...prev, prediction: nextValue }));
  };

  const toggleImagery = () => {
    const nextValue = !layersVisibility.imagery;
    setMapLayerVisibility(TMS_LAYER_ID, nextValue);
    setLayersVisibility((prev) => ({ ...prev, imagery: nextValue }));
  };

  const toggleBasemap = (layer: "osm" | "googleSatellite") => {
    const nextValue = !layersVisibility[layer];
    const targetLayerId =
      layer === "osm"
        ? OSM_BASEMAP_LAYER_ID
        : GOOGLE_SATELLITE_BASEMAP_LAYER_ID;

    setMapLayerVisibility(targetLayerId, nextValue);
    setLayersVisibility((prev) => ({ ...prev, [layer]: nextValue }));
  };

  useEffect(() => {
    if (!map) return;

    const applyVisibility = () => {
      predictionLayerIds.forEach((layerId) => {
        setMapLayerVisibility(layerId, layersVisibility.prediction);
      });

      if (hasTileServiceLayer) {
        setMapLayerVisibility(TMS_LAYER_ID, layersVisibility.imagery);
      }

      setMapLayerVisibility(OSM_BASEMAP_LAYER_ID, layersVisibility.osm);
      setMapLayerVisibility(
        GOOGLE_SATELLITE_BASEMAP_LAYER_ID,
        layersVisibility.googleSatellite,
      );
    };

    applyVisibility();
    map.on("styledata", applyVisibility);
    return () => {
      map.off("styledata", applyVisibility);
    };
  }, [map, predictionLayerIds, hasTileServiceLayer, layersVisibility]);

  return (
    <ToolTip content="Layer Control" placement={ToolTipPlacement.BOTTOM}>
      <DropDown
        disableCheveronIcon
        distance={10}
        triggerComponent={
          <div className="bg-white p-1.5 border border-gray-border md:border-0 relative rounded-[4px]">
            <LayerStackIcon className="icon-lg text-dark" />
          </div>
        }
      >
        <div className="bg-white w-[210px] rounded-lg py-3 flex flex-col gap-y-4">
          <div className="px-4">

            <p className="text-sm font-medium text-grey">Layers</p>
          </div>

          {hasActivePrediction ? (
            <Section
              title="Predictions"
              open={sectionsOpen.predictions}
              onToggle={() =>
                setSectionsOpen((prev) => ({
                  ...prev,
                  predictions: !prev.predictions,
                }))
              }
            >
              <div
                className={cn(
                  "w-full px-4 flex items-center bg-off-white justify-between rounded-sm py-2  transition-colors"
                
                )}
              >
                <div
                  className={cn(
                    "flex gap-4 items-center gap-x-2 text-sm"
                  )}
                >
                  <span
                    className={cn(
                      "w-3 h-3 rounded-[3px]",
                      predictionSwatchClassName,
                    )}
                  />
                  <span className="text-dark">{predictionLabel}</span>
                </div>
                <button
                  type="button"
                  onClick={togglePrediction}
                  className={cn(
                    "flex items-center justify-center size-6 rounded transition-colors",
                    layersVisibility.prediction
                      ? "border-[#B7B7B7] bg-white text-dark"
                      : "",
                  )}
                  aria-label={
                    layersVisibility.prediction
                      ? "Hide prediction layer"
                      : "Show prediction layer"
                  }
                >
                  <TryFairPredictionToggleIcon className="w-4 h-4" />
                </button>
              </div>
            </Section>
          ) : null}

          {hasTileServiceLayer ? (
            <Section
              title="Imagery"
              open={sectionsOpen.imagery}
              onToggle={() =>
                setSectionsOpen((prev) => ({
                  ...prev,
                  imagery: !prev.imagery,
                }))
              }
            >
              <LayerRow
                label="TMS"
                active={layersVisibility.imagery}
                icon={<TryFairImageryIcon />}
                onClick={toggleImagery}
              />
            </Section>
          ) : null}

          <Section
            title="Basemap"
            open={sectionsOpen.basemap}
            onToggle={() =>
              setSectionsOpen((prev) => ({ ...prev, basemap: !prev.basemap }))
            }
          >
            <LayerRow
              label="OSM"
              active={layersVisibility.osm}
              icon={<TryFairOSMIcon />}
              onClick={() => toggleBasemap("osm")}
            />
            <LayerRow
              label="Google Satellite"
              active={layersVisibility.googleSatellite}
              icon={<TryFairGoogleSatelliteIcon />}
              onClick={() => toggleBasemap("googleSatellite")}
            />
          </Section>
        </div>
      </DropDown>
    </ToolTip>
  );
};
