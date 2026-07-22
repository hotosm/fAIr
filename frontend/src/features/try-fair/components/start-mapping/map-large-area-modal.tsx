import { MapComponent } from "@/components/map";
import { Dialog } from "@/components/ui/dialog";
import { MapIcon, LayerStackIcon, UploadIcon } from "@/components/ui/icons";
import { SHOELACE_SIZES } from "@/enums";
import { useModalMap } from "@/features/try-fair/hooks/use-modal-map";
import { BBOX, Feature } from "@/types";

// ── Tabs ────────────────────────────────────────────────────────────────────────

type AOITab = "whole" | "draw" | "upload";

const TABS: { value: AOITab; label: string; Icon: typeof MapIcon }[] = [
  { value: "whole", label: "Whole Imagery", Icon: MapIcon },
  { value: "draw", label: "Draw Specific Area", Icon: LayerStackIcon },
  { value: "upload", label: "Upload Area of Interest", Icon: UploadIcon },
];

const MapLargeAreaContent = ({ tileServerURL }: { tileServerURL?: string }) => {
  const { mapContainerRef, map } = useModalMap();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex border-gray-border gap-4 justify-between w-full border p-2 rounded-lg">
        {TABS.map((tab) => (
          <div
            className="p-3 bg-off-white rounded-lg flex items-center justify-center w-full"
            key={tab.value}
          >
            <p className="text-sm">{tab.label}</p>
          </div>
        ))}
      </div>
      <div className="relative h-[520px] rounded-[18px] overflow-hidden w-full z-10">
        <MapComponent
          map={map}
          mapContainerRef={mapContainerRef}
          tileServiceURL={tileServerURL}
          zoomControls={false}
        />
      </div>
    </div>
  );
};

export const MapLargeAreaModal = ({
  isOpened,
  closeDialog,
  tileServerURL,
  // imageryBounds,
  // onSubmit,
}: {
  isOpened: boolean;
  closeDialog: () => void;
  tileServerURL?: string;
  imageryBounds: BBOX | null;
  onSubmit: (aoi: Feature) => void;
}) => (
  <Dialog
    label="Map Large Area"
    isOpened={isOpened}
    closeDialog={closeDialog}
    size={SHOELACE_SIZES.MEDIUM}
  >
    {/* Mount the content (and its map) only while open. */}
    {isOpened && <MapLargeAreaContent tileServerURL={tileServerURL} />}
  </Dialog>
);
