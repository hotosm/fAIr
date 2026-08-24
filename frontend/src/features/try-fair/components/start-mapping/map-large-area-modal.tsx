import { MapComponent } from "@/components/map";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/form";
import { DeleteIcon, InfoIcon, UploadIcon } from "@/components/ui/icons";
import { DrawIcon } from "@/components/ui/icons/draw-icon";
import { PictureIcon } from "@/components/ui/icons/picture-icon";
import { ControlsPosition, DrawingModes, SHOELACE_SIZES } from "@/enums";
import {
  AOITab,
  useMapLargeArea,
} from "@/features/try-fair/hooks/use-map-large-area";
import { BBOX, IconProps } from "@/types";
import { cn } from "@/utils";
import { ToolTip } from "@/components/ui/tooltip";
import { RadioDot } from "@/features/try-fair/components/model-picker/model-picker-badges";

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
  onSubmit: () => void;
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
    isSubmittingMapLargeArea,
    description,
    setDescription,
    handleTabChange,
    handleFileChange,
    handleClearArea,
    handleEnableDrawing,
    handleSubmit,
  } = useMapLargeArea({
    imageryBounds,
    tileServerURL,
    onSubmit,
    closeDialog,
  });

  return (
    <div className="flex flex-col gap-2">
      {/* Dynamic instruction based on active tab */}
      <p className="text-grey text-sm -mt-6">
        {activeTab === "whole"
          ? "The entire imagery extent will be used as your area of interest. Review the highlighted boundary on the map, then provide a description and submit."
          : activeTab === "draw"
            ? "Use the draw tool on the map to outline a custom area of interest. Click points to form a polygon, then close it by clicking the first point."
            : "Upload a GeoJSON file containing your area of interest. The uploaded boundary will be displayed on the map for review before submitting."}
      </p>

      {/* Hidden file input for native OS file selection */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".geojson,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header Tabs */}
      <div className="flex border border-gray-border gap-2 md:flex-row flex-col justify-between w-full p-1.5 rounded-lg bg-white">
        {TABS.map(({ value, label, Icon }) => (
          <button
            type="button"
            onClick={() => handleTabChange(value)}
            className={cn(
              "p-2 lg:p-3 gap-2 text-dark rounded-lg flex items-center justify-between w-full transition-colors",
              activeTab === value
                ? "bg-secondary border-[#D63F4080] border"
                : "bg-off-white",
            )}
            key={value}
          >
            <div className="flex items-center gap-2">
              <Icon className="size-5 text-dark" />
              <span className="text-xs md:text-sm">{label}</span>
            </div>
            <RadioDot selected={activeTab === value} />
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div className="relative h-[450px] md:h-[540px] rounded-lg overflow-hidden w-full z-10 border border-gray-border">
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
          <div className="absolute top-4 right-4 z-20 bg-white/95  border border-border-gray rounded-full px-3.5 py-1.5 shadow-sm flex items-center gap-2 text-xs  text-grey">
            {activeTab === "whole" ? (
              <PictureIcon className="w-4 h-4 text-dark" />
            ) : activeTab === "draw" ? (
              <DrawIcon className="w-4 h-4 text-dark" />
            ) : (
              <UploadIcon className="w-4 h-4 text-dark" />
            )}
            <span>
              {activeTab === "upload"
                ? uploadedFileName || "Mapping AOI.geojson"
                : activeTab === "draw"
                  ? "Drawn AOI"
                  : "Whole Imagery AOI"}
            </span>
            {activeTab !== "whole" && (
              <ToolTip
                content={activeTab === "draw" ? "Delete drawn polygon" : "Delete uploaded aread of interest"}
              >


                <button
                  type="button"
                  onClick={handleClearArea}
                  className="ml-1 text-primary hover:text-primary transition-colors p-1 rounded-full"
                  title="Clear area"
                >
                  <DeleteIcon className="w-4 h-4" />
                </button>
              </ToolTip>
            )}
          </div>
        )}

        {/* Floating draw toggle button – only visible in draw mode */}
        {map && activeTab === "draw" && (
          <div className="absolute left-3 map-elements-z-index top-[24%] md:top-[20%]">
            <ToolTip
              content={
                drawingMode === DrawingModes.POLYGON
                  ? "Drawing active – click the first point to close"
                  : "Click to draw a new area"
              }
              placement={undefined}
            >
              <button
                type="button"
                onClick={() => {
                  if (drawingMode === DrawingModes.POLYGON) return;
                  handleEnableDrawing();
                }}
                aria-label="Enable drawing mode"
                className={cn(
                  "size-[38px] p-2  border flex items-center justify-center transition-colors",
                  drawingMode === DrawingModes.POLYGON
                    ? "bg-primary text-white border-primary cursor-default"
                    : "bg-white text-dark   cursor-pointer",
                )}
              >
                <DrawIcon className="size-4" />
              </button>
            </ToolTip>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Input
            value={description}
            handleInput={(e) => setDescription(e.target.value)}
            placeholder="Provide a description"
            size={SHOELACE_SIZES.MEDIUM}
            className="w-full"
            showBorder
          />
          <ToolTip content="Provide a description for your prediction request">
            <button
              type="button"
              className="text-dark hover:text-primary transition-colors p-1 shrink-0"
              aria-label="Request description info"
            >
              <InfoIcon className="size-5 text-dark" />
            </button>
          </ToolTip>
        </div>

        <Button
          className="!w-fit shrink-0"
          fontSize="14px"
          size="medium"
          disabled={
            !selectedAOI || !description.trim() || isSubmittingMapLargeArea
          }
          spinner={isSubmittingMapLargeArea}
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
  onSubmit: () => void;
}) => {
  return (
    <Dialog
      label="Map Large Area"
      isOpened={isOpened}
      closeDialog={closeDialog}
      size={SHOELACE_SIZES.MEDIUM}
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
