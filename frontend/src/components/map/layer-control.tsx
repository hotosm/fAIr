import { LayerStackIcon } from "@/components/ui/icons";
import { DropDown } from "@/components/ui/dropdown";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { Map } from "maplibre-gl";
import { useEffect, useState } from "react";
import { CheckboxGroup } from "../ui/form";

type TLayer = { id?: string; mapLayerId?: string; value: string }[];

const LayerControl = ({
  map,
  layers,
  selectedBasemap,
  setSelectedBasemap,
}: {
  selectedBasemap: string;
  setSelectedBasemap: (basemap: string) => void;
  map: Map | null;
  layers: TLayer;
}) => {
  const { dropdownIsOpened, onDropdownHide, onDropdownShow } =
    useDropdownMenu();

  const [layerVisibility, setLayerVisibility] = useState<{
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

  const handleLayerSelection = (newSelectedLayers: string[]) => {
    const updatedVisibility = { ...layerVisibility };

    layers.forEach(({ value }) => {
      updatedVisibility[value] = newSelectedLayers.includes(value);
    });

    setLayerVisibility(updatedVisibility);

    if (map?.isStyleLoaded) {
      layers.forEach(({ value, mapLayerId }) => {
        if (mapLayerId && map.getLayer(mapLayerId)) {
          map.setLayoutProperty(
            mapLayerId,
            "visibility",
            updatedVisibility[value] ? "visible" : "none",
          );
        }
      });
    }
  };

  useEffect(() => {
    if (!map?.isStyleLoaded) return;

    const handleStyleData = () => {
      layers.forEach(({ value, mapLayerId }) => {
        if (mapLayerId && map.getLayer(mapLayerId)) {
          map.setLayoutProperty(
            mapLayerId,
            "visibility",
            layerVisibility[value] ? "visible" : "none",
          );
        }
      });
    };

    map.on("styledata", handleStyleData);

    return () => {
      map.off("styledata", handleStyleData);
    };
  }, [map, layers, layerVisibility]);

  return (
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
        <p className="text-sm">Basemap</p>
        <CheckboxGroup
          defaultSelectedOption={selectedBasemap}
          options={[{ value: "OSM" }, { value: "Satellite" }]}
          // @ts-expect-error bad type definition
          onCheck={(basemap) => setSelectedBasemap(basemap)}
        />
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
  );
};

export default LayerControl;
