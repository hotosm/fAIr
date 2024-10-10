
import { MaximizeIcon } from "@/components/ui/icons";
import { Map } from "maplibre-gl";


const LayoutControl = ({ map }: { map: Map | null }) => {

    // update the layout in the parent component?

    if (!map) return null;

    return (
        <button className="p-2 bg-white flex items-center justify-center">
            <MaximizeIcon className="w-3.5 h-3.5" />
        </button>
    );
};

export default LayoutControl;
