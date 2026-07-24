import { MapComponent } from "@/components/map";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DeleteIcon, UploadIcon } from "@/components/ui/icons";
import { DrawIcon } from "@/components/ui/icons/draw-icon";
import { PictureIcon } from "@/components/ui/icons/picture-icon";
import { ControlsPosition, SHOELACE_SIZES } from "@/enums";
import {
  AOITab,
  useMapLargeArea,
} from "@/features/try-fair/hooks/use-map-large-area";
import { BBOX, Feature, IconProps } from "@/types";

// ── Tabs ────────────────────────────────────────────────────────────────────────

const TABS: { value: AOITab; label: string; Icon: React.FC<IconProps> }[] = [
  { value: "whole", label: "Map Whole Area", Icon: PictureIcon },
  { value: "draw", label: "Draw Specific Area", Icon: DrawIcon },
  { value: "upload", label: "Upload Area of Interest", Icon: UploadIcon },
];

const MapLargeAreaContent = ({
  tileServerURL,
  imageryBounds,
  onSubmit,
  closeDialog,
}: {
  tileServerURL?: string;
  imageryBounds?: BBOX | null;
  onSubmit: (aoi: Feature) => void;
  closeDialog: () => void;
}) => {
  const {
    mapContainerRef,
    map,
    drawingMode,
    setDrawingMode,
    terraDraw,
    activeTab,
    selectedAOI,
    uploadedFileName,
    fileInputRef,
    handleTabChange,
    handleFileChange,
    handleClearArea,
    handleSubmit,
  } = useMapLargeArea({
    imageryBounds,
    onSubmit,
    closeDialog,
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden file input for native OS file selection */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".geojson,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header Tabs */}
      <div className="flex border border-gray-200 gap-3 justify-between w-full p-1.5 rounded-2xl bg-white">
        {TABS.map(({ value, label, Icon }) => (
          <button
            type="button"
            onClick={() => handleTabChange(value)}
            className={
              activeTab === value
                ? "p-2.5 lg:p-3 gap-2 bg-[#FEECEE] text-gray-900 rounded-xl flex items-center justify-center w-full font-medium transition-colors"
                : "p-2.5 lg:p-3 gap-2 bg-[#EFEFEF] hover:bg-gray-200 text-gray-700 rounded-xl flex items-center justify-center w-full font-medium transition-colors"
            }
            key={value}
          >
            <Icon className="size-5 text-gray-700" />
            <span className="text-xs md:text-sm">{label}</span>
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div className="relative h-[540px] rounded-2xl overflow-hidden w-full z-10 border border-gray-200">
        <MapComponent
          map={map}
          terraDraw={terraDraw}
          setDrawingMode={setDrawingMode}
          drawingMode={drawingMode}
          mapContainerRef={mapContainerRef}
          tileServiceURL={tileServerURL}
          zoomControls={true}
          controlsPosition={ControlsPosition.TOP_LEFT}
        />

        {/* Selected AOI Status Floating Badge (Top Right) */}
        {selectedAOI && (
          <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full px-3.5 py-1.5 shadow-sm flex items-center gap-2 text-xs font-medium text-gray-800">
            <UploadIcon className="w-4 h-4 text-gray-600" />
            <span>
              {activeTab === "upload"
                ? uploadedFileName || "Mapping AOI.geojson"
                : activeTab === "draw"
                  ? "Drawn AOI"
                  : "Whole Imagery AOI"}
            </span>
            <button
              type="button"
              onClick={handleClearArea}
              className="ml-1 text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50"
              title="Clear area"
            >
              <DeleteIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex justify-end pt-1">
        <Button
          className="!w-fit "
          disabled={!selectedAOI}
          onClick={handleSubmit}
          rounded
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export const MapLargeAreaModal = ({
  isOpened,
  closeDialog,
  tileServerURL,
  imageryBounds,
  onSubmit,
}: {
  isOpened: boolean;
  closeDialog: () => void;
  tileServerURL?: string;
  imageryBounds: BBOX | null;
  onSubmit: (aoi: Feature) => void;
}) => {
  return (
    <Dialog
      label="Map Large Area"
      isOpened={isOpened}
      closeDialog={closeDialog}
      size={SHOELACE_SIZES.LARGE}
    >
      {isOpened && (
        <MapLargeAreaContent
          tileServerURL={tileServerURL}
          imageryBounds={imageryBounds}
          onSubmit={onSubmit}
          closeDialog={closeDialog}
        />
      )}
    </Dialog>
  );
};
