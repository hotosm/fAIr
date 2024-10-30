import { LayerStackIcon } from "@/components/ui/icons";
import { DropDown } from "@/components/ui/dropdown";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";

const LayerControl = ({
  selectedBasemap,
  setSelectedBasemap,
}: {
  selectedBasemap: string;
  setSelectedBasemap: (basemap: string) => void;
}) => {
  const { dropdownIsOpened, onDropdownHide, onDropdownShow } =
    useDropdownMenu();

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
      handleMenuSelection={(basemap) => setSelectedBasemap(basemap)}
      defaultSelectedItem={selectedBasemap}
      menuItems={[
        {
          value: "OSM",
        },
        {
          value: "Satellite",
        },
      ]}
    />
  );
};

export default LayerControl;
