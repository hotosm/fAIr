import { LayerStackIcon } from "@/components/ui/icons";
import { DropDown } from "@/components/ui/dropdown";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { Map } from "maplibre-gl";
import { useEffect, useState } from "react";
import { CheckboxGroup } from "../ui/form";
import { ToolTip } from "../ui/tooltip";
import { BASEMAPS, ToolTipPlacement } from "@/enums";

type TLayers = { id?: string; subLayers: string[]; value: string }[];
type TBasemaps = { id?: string; subLayer: string; value: string }[];

export const LayerControl = ({
  map,
  layers,
  basemaps,
}: {
  map: Map | null;
  layers: TLayers;
  basemaps: TBasemaps;
}) => {
  const { dropdownIsOpened, onDropdownHide, onDropdownShow } =
    useDropdownMenu();

  const [layerVisibility, setLayerVisibility] = useState<{
    [key: string]: boolean;
  }>({});
  const [basemapVisibility, setBasemapVisibility] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    const initialVisibility = layers.reduce(
      (acc, { value }) => {
        acc[value] =
          layerVisibility[value] !== undefined ? layerVisibility[value] : true;
        return acc;
      },
      {} as { [key: string]: boolean },
    );

    setLayerVisibility(initialVisibility);
  }, [layers]);

  useEffect(() => {
    const initialVisibility = basemaps.reduce(
      (acc, { value }) => {
        acc[value] =
          basemapVisibility[value] !== undefined
            ? basemapVisibility[value]
            : true;
        return acc;
      },
      {} as { [key: string]: boolean },
    );

    setBasemapVisibility(initialVisibility);
  }, [basemaps]);

  const handleLayerSelection = (newSelectedLayers: string[]) => {
    const updatedVisibility = { ...layerVisibility };

    layers.forEach(({ value, subLayers }) => {
      updatedVisibility[value] = newSelectedLayers.includes(value);

      if (map?.isStyleLoaded) {
        // Loop through each map layer ID and update visibility
        subLayers?.forEach((mapLayerId) => {
          if (map.getLayer(mapLayerId)) {
            map.setLayoutProperty(
              mapLayerId,
              "visibility",
              updatedVisibility[value] ? "visible" : "none",
            );
          }
        });
      }
    });

    setLayerVisibility(updatedVisibility);
  };

  const handleBasemapSelection = (newSelectedBasemap: string[]) => {
    const updatedVisibility = { ...basemapVisibility };

    basemaps.forEach(({ value, subLayer }) => {
      updatedVisibility[value] = newSelectedBasemap.includes(value);
      if (map?.isStyleLoaded) {
        if (map.getLayer(subLayer)) {
          map.setLayoutProperty(
            subLayer,
            "visibility",
            updatedVisibility[value] ? "visible" : "none",
          );
        }
      }
    });

    setBasemapVisibility(updatedVisibility);
  };

  return (
    <ToolTip content="Layer Control" placement={ToolTipPlacement.BOTTOM}>
      <DropDown
        dropdownIsOpened={dropdownIsOpened}
        onDropdownHide={onDropdownHide}
        onDropdownShow={onDropdownShow}
        disableCheveronIcon
        triggerComponent={
          <div className="bg-white p-2 relative">
            <LayerStackIcon className="icon-lg" />
          </div>
        }
        withCheckbox
        distance={10}
      >
        <div className="bg-white px-4 py-2 text-nowrap rounded-md w-full flex flex-col gap-y-4">
          {basemaps.length > 0 && (
            <>
              <p className="text-sm">Basemap</p>
              <CheckboxGroup
                defaultSelectedOption={BASEMAPS.OSM}
                options={basemaps}
                // @ts-expect-error bad type definition
                onCheck={handleBasemapSelection}
              />
            </>
          )}
          {layers.length > 0 && (
            <>
              <p className="text-sm">Layers</p>
              <CheckboxGroup
                defaultSelectedOption={Object.keys(layerVisibility).filter(
                  (layer) => layerVisibility[layer],
                )}
                multiple
                options={layers}
                // @ts-expect-error bad type definition
                onCheck={handleLayerSelection}
              />
            </>
          )}
        </div>
      </DropDown>
    </ToolTip>
  );
};
