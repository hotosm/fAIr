import { LayerStackIcon } from "@/components/ui/icons";
import { DropDown } from "@/components/ui/dropdown";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { Map } from "maplibre-gl";
import { useEffect, useMemo, useState } from "react";
import { CheckboxGroup } from "@/components/ui/form";
import { ToolTip } from "@/components/ui/tooltip";
import { BASEMAPS, ToolTipPlacement } from "@/enums";
import {
  GOOGLE_SATELLITE_BASEMAP_LAYER_ID,
  OSM_BASEMAP_LAYER_ID,
  TMS_LAYER_ID,
} from "@/utils";
import useScreenSize from "@/hooks/use-screen-size";

type TLayers = { id?: string; subLayers: string[]; value: string }[];
type TBasemaps = { id?: string; subLayer: string; value: string }[];

export const LayerControl = ({
  map,
  layers,
  basemaps = true,
  openAerialMap = false,
}: {
  map: Map | null;
  layers: TLayers;
  basemaps?: boolean;
  openAerialMap?: boolean;
}) => {
  const { dropdownIsOpened, onDropdownHide, onDropdownShow } =
    useDropdownMenu();
  const { isTablet, isMobile } = useScreenSize();

  const layerControlData = useMemo(() => {
    const layers_ = [
      ...layers,
      ...(openAerialMap
        ? [{ value: "TMS Layer", subLayers: [TMS_LAYER_ID] }]
        : []),
    ];
    const baseLayers: TBasemaps = basemaps
      ? [
        { value: BASEMAPS.OSM, subLayer: OSM_BASEMAP_LAYER_ID },
        {
          value: BASEMAPS.GOOGLE_SATELLITE,
          subLayer: GOOGLE_SATELLITE_BASEMAP_LAYER_ID,
        },
      ]
      : [];
    return { layers_, baseLayers };
  }, [layers, openAerialMap, basemaps]);

  const [layerVisibility, setLayerVisibility] = useState<{
    [key: string]: boolean;
  }>({});
  const [basemapVisibility, setBasemapVisibility] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    const initialVisibility = layerControlData.layers_.reduce(
      (acc, { value }) => {
        acc[value] =
          layerVisibility[value] !== undefined ? layerVisibility[value] : true;
        return acc;
      },
      {} as { [key: string]: boolean },
    );

    setLayerVisibility(initialVisibility);
  }, [layerControlData.layers_]);

  useEffect(() => {
    const initialVisibility = layerControlData.baseLayers.reduce(
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
  }, [layerControlData.baseLayers]);

  const handleLayerSelection = (newSelectedLayers: string[]) => {
    const updatedVisibility = { ...layerVisibility };

    layerControlData.layers_.forEach(({ value, subLayers }) => {
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

    layerControlData.baseLayers.forEach(({ value, subLayer }) => {
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
          <div
            className={`bg-white p-2.5 border border-gray-border md:border-0 relative ${isTablet || isMobile ? "rounded-xl" : ""}`}
          >
            <LayerStackIcon className="icon-lg" />
          </div>
        }
        withCheckbox
        distance={10}
      >
        <div
          className={`bg-white px-4 py-2 text-nowrap rounded-md w-full flex flex-col gap-y-4`}
        >
          {layerControlData.baseLayers.length > 0 ? (
            <>
              <p className="text-sm">Basemap</p>
              <CheckboxGroup
                defaultSelectedOption={BASEMAPS.OSM}
                options={layerControlData.baseLayers}
                // @ts-expect-error bad type definition
                onCheck={handleBasemapSelection}
              />
            </>
          ) : null}
          {layerControlData.layers_.length > 0 ? (
            <>
              <p className="text-sm">Layers</p>
              <CheckboxGroup
                defaultSelectedOption={Object.keys(layerVisibility).filter(
                  (layer) => layerVisibility[layer],
                )}
                multiple
                options={layerControlData.layers_}
                // @ts-expect-error bad type definition
                onCheck={handleLayerSelection}
              />
            </>
          ) : null}
        </div>
      </DropDown>
    </ToolTip>
  );
};