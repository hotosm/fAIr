import { DropDown } from "@/components/ui/dropdown";
import {
  ChevronDownIcon,
  LayerStackIcon,
  TryFairGoogleSatelliteIcon,
  TryFairImageryIcon,
  TryFairOSMIcon,
  TryFairPredictionToggleIcon,
  EyeClosedIcon,
} from "@/components/ui/icons";
import { ToolTip } from "@/components/ui/tooltip";
import { GOOGLE_SATELLITE_BASEMAP_LAYER_ID, OSM_BASEMAP_LAYER_ID, TMS_LAYER_ID } from "@/config";
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
  className?: string;
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
      // active ? "opacity-100" : "opacity-45",
    )}
  >
    <div className={cn("transition-opacity", active ? "opacity-100" : "opacity-45")}>{icon}</div>
    <span className="text-dark text-left">{label}</span>
  </button>
);

type LayerToggleRowProps = {
  label: string;
  visible: boolean;
  swatchClassName?: string;
  icon?: ReactNode;
  onClick: () => void;
};

const LayerToggleRow = ({
  label,
  visible,
  swatchClassName,
  icon,
  onClick,
}: LayerToggleRowProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-full px-4 flex items-center bg-off-white justify-between rounded-sm py-2 transition-colors",
    )}
  >
    <div className={cn("flex gap-4 items-center gap-x-2 text-xs")}>
      {icon ?? <span className={cn("w-3 h-3 rounded-[3px]", swatchClassName)} />}
      <span className="text-dark">{label}</span>
    </div>
    <div
      className={cn(
        "flex items-center justify-center size-6 rounded transition-colors",
        visible ? " bg-white text-dark" : "",
      )}
      aria-label={visible ? `Hide ${label} layer` : `Show ${label} layer`}
    >
      {visible ? (
        <TryFairPredictionToggleIcon className="size-4" />
      ) : (
        <EyeClosedIcon className="size-4" />
      )}
    </div>
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
      <ChevronDownIcon className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
    </button>
    {open ? <div className="flex flex-col gap-y-3">{children}</div> : null}
  </div>
);

export const TryFairLayerControl = ({
  map,
  hasActivePrediction,
  hasTileServiceLayer,
  predictionLayerIds,
  className,
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
    if (!map) return;
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
    setMapLayerVisibility(OSM_BASEMAP_LAYER_ID, layer === "osm");
    setMapLayerVisibility(GOOGLE_SATELLITE_BASEMAP_LAYER_ID, layer === "googleSatellite");
    setLayersVisibility((prev) => ({
      ...prev,
      osm: layer === "osm",
      googleSatellite: layer === "googleSatellite",
    }));
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
      setMapLayerVisibility(GOOGLE_SATELLITE_BASEMAP_LAYER_ID, layersVisibility.googleSatellite);
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
          <div
            className={cn(
              "size-8 p-0 bg-white rounded-[4px] border-0 relative flex items-center justify-center text-dark cursor-pointer",
              className,
            )}
          >
            <LayerStackIcon className="size-5" />
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
              <LayerToggleRow
                label={predictionLabel}
                visible={layersVisibility.prediction}
                swatchClassName={predictionSwatchClassName}
                onClick={togglePrediction}
              />
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
              <LayerToggleRow
                label="OpenAerialMap"
                visible={layersVisibility.imagery}
                icon={<TryFairImageryIcon />}
                onClick={toggleImagery}
              />
            </Section>
          ) : null}

          <Section
            title="Basemap"
            open={sectionsOpen.basemap}
            onToggle={() => setSectionsOpen((prev) => ({ ...prev, basemap: !prev.basemap }))}
          >
            <LayerRow
              label="OpenstreetMap"
              active={layersVisibility.osm}
              icon={layersVisibility.osm ? <TryFairOSMIcon /> : <TryFairGoogleSatelliteIcon />}
              onClick={() => toggleBasemap("osm")}
            />
            <LayerRow
              label="Google Satellite"
              active={layersVisibility.googleSatellite}
              icon={
                layersVisibility.googleSatellite ? (
                  <TryFairOSMIcon />
                ) : (
                  <TryFairGoogleSatelliteIcon />
                )
              }
              onClick={() => toggleBasemap("googleSatellite")}
            />
          </Section>
        </div>
      </DropDown>
    </ToolTip>
  );
};
