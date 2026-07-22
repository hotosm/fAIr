import { MapComponent } from "@/components/map";
import { Dialog } from "@/components/ui/dialog";
import { MapIcon, UploadIcon } from "@/components/ui/icons";
import { DrawIcon } from "@/components/ui/icons/draw-icon";
import { PictureIcon } from "@/components/ui/icons/picture-icon";
import { SHOELACE_SIZES } from "@/enums";
import { useModalMap } from "@/features/try-fair/hooks/use-modal-map";
import { BBOX, Feature } from "@/types";
import { useState } from "react";

// ── Tabs ────────────────────────────────────────────────────────────────────────

type AOITab = "whole" | "draw" | "upload";

const TABS: { value: AOITab; label: string; Icon: typeof MapIcon }[] = [
  { value: "whole", label: "Whole Imagery", Icon: PictureIcon },
  { value: "draw", label: "Draw Specific Area", Icon: DrawIcon },
  { value: "upload", label: "Upload Area of Interest", Icon: UploadIcon },
];

const MapLargeAreaContent = ({ tileServerURL }: { tileServerURL?: string }) => {
  const { mapContainerRef, map } = useModalMap();
  const [activeTab, setActiveTab] = useState<string>("draw")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex border-gray-border gap-4 justify-between w-full border p-2 rounded-md">
        {TABS.map(({ value, label, Icon }) => (
          <button
          onClick={() => setActiveTab(value)}
            className={
              activeTab === value ?
              "p-3 gap-2 bg-secondary rounded-lg flex items-center justify-center w-full"
              :

              "p-3 gap-2 bg-off-white rounded-lg flex items-center justify-center w-full"
            }
            key={value}
          >
            <Icon className="size-5" />
            <p className="text-sm">{label}</p>
          </button>
        ))}
      </div>
      <div className="relative h-[520px] rounded-[18px] overflow-hidden w-full z-10">
        <MapComponent
          map={map}
          mapContainerRef={mapContainerRef}
          tileServiceURL={tileServerURL}
          zoomControls={true}
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
