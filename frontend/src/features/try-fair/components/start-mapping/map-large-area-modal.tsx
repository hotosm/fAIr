import { MAP_LARGE_AREA_MAX_SIZE_SQKM } from "@/config";
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
import "./map-large-area-modal.css";
import { RadioDot } from "@/features/try-fair/components/model-picker/model-picker-badges";

// ── Tabs ────────────────────────────────────────────────────────────────────────

const TABS: { value: AOITab; label: string; Icon: React.FC<IconProps> }[] = [
  { value: "draw", label: "Draw Specific Area", Icon: DrawIcon },
  { value: "whole", label: "Map Whole Area", Icon: PictureIcon },
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
    isWholeAreaDisabled,
  } = useMapLargeArea({
    imageryBounds,
    tileServerURL,
    onSubmit,
    closeDialog,
  });

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* Dynamic instruction based on active tab */}
      <p className="text-grey text-sm">
        {activeTab === "whole"
          ? "The entire imagery extent will be used as your area of interest. Review the highlighted boundary on the map, then provide a description and submit."
          : activeTab === "draw"
            ? "Use the draw tool on the map to outline a custom area of interest. Click to add points, then double-click to finish drawing."
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
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] border border-gray-border gap-2 w-full p-1.5 rounded-lg bg-white">
        {TABS.map(({ value, label, Icon }) => {
          const disabled = value === "whole" && isWholeAreaDisabled;
          const tabButton = (
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleTabChange(value)}
              className={cn(
                "h-full w-full p-3 gap-2 text-dark rounded-lg flex items-center justify-between min-w-0 transition-colors",
                activeTab === value
                  ? "bg-secondary border-[#D63F4080] border"
                  : "bg-off-white",
                disabled && "opacity-40 cursor-not-allowed",
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Icon className="size-4 shrink-0 text-dark" />
                <span className="text-xs leading-tight">{label}</span>
              </div>
              <RadioDot selected={activeTab === value} />
            </button>
          );

          return disabled ? (
            <ToolTip
              key={value}
              content={`The imagery is larger than the ${MAP_LARGE_AREA_MAX_SIZE_SQKM.toLocaleString()} km² limit. Draw or upload a smaller area instead.`}
            >
              {tabButton}
            </ToolTip>
          ) : (
            <div key={value} className="min-w-0">
              {tabButton}
            </div>
          );
        })}
      </div>

      {/* Map Container */}
      <div className="map-area-preview relative shrink-0 rounded-lg overflow-hidden w-full z-10 border border-gray-border">
        <MapComponent
          map={map}
          terraDraw={terraDraw}
          setDrawingMode={setDrawingMode}
          drawingMode={drawingMode}
          mapContainerRef={mapContainerRef}
          tileServiceURL={tileServerURL}
          zoomControls={true}
          controlsPosition={ControlsPosition.TOP_LEFT}
          extraControls={
            activeTab === "draw" ? (
              <ToolTip
                content={
                  drawingMode === DrawingModes.POLYGON
                    ? "Drawing active – double-click to finish"
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
            ) : undefined
          }
        />

        {/* Selected AOI Status Floating Badge (Top Right) */}
        {selectedAOI && (
          <div className="absolute top-4 right-4 max-w-[calc(100%-5rem)] z-20 bg-white/95  border border-border-gray rounded-full px-3.5 py-1.5 shadow-sm flex items-center gap-2 text-xs  text-grey">
            {activeTab === "whole" ? (
              <PictureIcon className="w-4 h-4 shrink-0 text-dark" />
            ) : activeTab === "draw" ? (
              <DrawIcon className="w-4 h-4 shrink-0 text-dark" />
            ) : (
              <UploadIcon className="w-4 h-4 shrink-0 text-dark" />
            )}
            <span
              className="min-w-0 truncate"
              title={uploadedFileName || undefined}
            >
              {activeTab === "upload"
                ? uploadedFileName || "Mapping AOI.geojson"
                : activeTab === "draw"
                  ? "Drawn AOI"
                  : "Whole Imagery AOI"}
            </span>
            {activeTab !== "whole" && (
              <ToolTip
                content={
                  activeTab === "draw"
                    ? "Delete drawn polygon"
                    : "Delete uploaded aread of interest"
                }
              >
                <button
                  type="button"
                  onClick={handleClearArea}
                  className="ml-1 shrink-0 text-primary hover:text-primary transition-colors p-1 rounded-full"
                  title="Clear area"
                >
                  <DeleteIcon className="w-4 h-4" />
                </button>
              </ToolTip>
            )}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex flex-col gap-1">
        {/* Label row */}
        <div className="flex items-center gap-1.5">
          <label className="text-dark text-sm font-semibold">
            Map Request Name
          </label>
          <ToolTip content="Enter map request name for your prediction request">
            <button
              type="button"
              className="text-grey hover:text-primary transition-colors"
              aria-label="Request name info"
            >
              <InfoIcon className="size-4" />
            </button>
          </ToolTip>
        </div>
        {/* Input */}
        <Input
          value={description}
          handleInput={(e) => {
            if (e.target.value.length <= 50) setDescription(e.target.value);
          }}
          placeholder="Enter map request name"
          size={SHOELACE_SIZES.MEDIUM}
          className="w-full"
          showBorder
          maxLength={50}
        />
        <div className="flex items-center justify-between">
          <p className="text-grey text-xs">{description.length}/50</p>
          <Button
            className="!w-fit shrink-0"
            fontSize="13px"
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
      label="Map an area"
      className="map-area-dialog"
      isOpened={isOpened}
      preventClose
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
