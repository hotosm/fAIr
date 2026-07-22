import { useMemo, useState } from "react";
import { cn, extractDatePart } from "@/utils";
import { Spinner } from "@/components/ui/spinner";
import { OAMImageryItem } from "@/features/try-fair/api/hot-imagery";
import { ExpandIcon } from "@/components/ui/icons/expand-icon";
import { CloseIcon } from "@/components/ui/icons";
import { Select } from "@/components/ui/form";
import { SHOELACE_SELECT_SIZES } from "@/enums";
import {
  DatePreset,
  ResolutionPreset,
} from "@/features/try-fair/types/imagery-types";
import {
  IMAGERY_DATE_OPTIONS,
  IMAGERY_RESOLUTION_PRESETS,
  withinDate,
  withinResolution,
} from "@/features/try-fair/utils/common";
import { Button } from "@/components/ui/button";
import { ToolTip } from "@/components/ui/tooltip";

const formatGsd = (gsd: number | null): string => {
  if (gsd == null) return "N/A";
  return gsd < 1 ? `${Math.round(gsd * 100)} cm` : `${gsd.toFixed(1)} m`;
};

const formatDate = (iso: string | null): string =>
  iso ? extractDatePart(iso) : "Unknown date";

const FilterSelect = <V extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: V;
  options: { label: string; value: V }[];
  onChange: (v: V) => void;
  label: string;
}) => {
  const mappedOptions = useMemo(
    () => options.map((o) => ({ name: o.label, value: o.value })),
    [options],
  );

  return (
    <Select
      options={mappedOptions}
      defaultValue={value}
      handleChange={(val) => onChange(val as V)}
      size={SHOELACE_SELECT_SIZES.SMALL}
      className={cn(
        "flex-grow",
        value &&
          "[&::part(combobox)]:border-primary [&::part(display-input)]:text-primary",
      )}
      placeholder={label}
    />
  );
};
const ImageryCard = ({
  item,
  isSelected,
  onSelect,
}: {
  item: OAMImageryItem;
  isSelected: boolean;
  onSelect: (item: OAMImageryItem) => void;
}) => (
  <button
    type="button"
    onClick={() => onSelect(item)}
    className={cn(
      "text-left bg-frosted-blue min-h-[150px] rounded-lg p-2  transition-colors flex flex-col gap-1.5",
      isSelected ? "border-primary border" : "",
    )}
  >
    <div>
      <p
        className="text-dark text-xs font-medium truncate w-full"
        title={item.title}
      >
        {item.title}
      </p>
      <p className="text-grey text-xs">
        {formatDate(item.acquiredAt)} / {formatGsd(item.gsd)}
      </p>
      <p className="text-grey text-xs truncate" title={item.provider}>
        {item.provider}
      </p>
    </div>
    <div className="relative">
      {item.thumbnailUrl ? (
        <img
          src={item.thumbnailUrl}
          alt={item.title}
          loading="lazy"
          className="w-full h-24 object-cover"
        />
      ) : (
        <div className="w-full h-24  flex items-center justify-center text-grey text-xs">
          No preview
        </div>
      )}
      <span className="mt-2 p-1 bg-white w-fit rounded  flex items-start ">
        <ExpandIcon className="size-4 text-dark" />
      </span>
    </div>
  </button>
);

/**
 * OpenAerialMap overlays for the imagery/location dialog: a centered location
 * search box and — once a density grid cell is selected — the panel of images
 * within that cell. The density grid itself is the OamImageryMap underneath;
 * this component only renders the panels layered over it.
 */
export const OAMImageryPanel = ({
  cellSelected,
  images,
  loading,
  selectedItem,
  onSelect,
  onClose,
  handleApplyOAMItem
}: {
  cellSelected: boolean;
  images: OAMImageryItem[];
  loading: boolean;
  selectedItem: OAMImageryItem | null;
  onSelect: (item: OAMImageryItem | null) => void;
  handleApplyOAMItem: () => void;
  /** Close the images panel (clears the selected grid cell). */
  onClose: () => void;
}) => {
  const [dateFilter, setDateFilter] = useState<DatePreset>("");
  const [resolutionFilter, setResolutionFilter] =
    useState<ResolutionPreset>("");

  const filtered = useMemo(
    () =>
      images.filter(
        (i) =>
          withinDate(i.acquiredAt, dateFilter) &&
          withinResolution(i.gsd, resolutionFilter),
      ),
    [images, dateFilter, resolutionFilter],
  );

  if (!cellSelected) return null;

  return (
    <>
      <div className="absolute top-4 bottom-4 left-4 z-10 w-[350px] bg-white rounded-lg shadow-lg flex flex-col overflow-hidden">
        <div className="px-3 pt-3 pb-2 flex items-center gap-2">
          <p className="text-dark font-bold text-sm flex-1">
            {loading
              ? "Loading images…"
              : `${filtered.length} image${filtered.length === 1 ? "" : "s"} in this area`}
          </p>
          {loading && <Spinner style={{ fontSize: "14px" }} />}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-grey hover:text-dark shrink-0"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 pb-2 flex items-center gap-2">
          <FilterSelect
            label="Filter by date"
            value={dateFilter}
            options={IMAGERY_DATE_OPTIONS}
            onChange={setDateFilter}
          />
          <FilterSelect
            label="Filter by resolution"
            value={resolutionFilter}
            options={IMAGERY_RESOLUTION_PRESETS}
            onChange={setResolutionFilter}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 scrollable">
          {!loading && filtered.length === 0 ? (
            <p className="text-grey text-xs p-2">
              {images.length === 0
                ? "No imagery available in this area."
                : "No imagery matches the selected filters."}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map((item) => (
                <ImageryCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  onSelect={(clicked) =>
                    onSelect(selectedItem?.id === clicked.id ? null : clicked)
                  }
                />
              ))}
            </div>
          )}
        </div>
          <div className="absolute bottom-4 right-4 z-20">
                  <ToolTip
                    content={
                      !selectedItem ? "Select an image first" : undefined
                    }
                  >
                    <Button
                      size="medium"
                      rounded
                      disabled={!selectedItem}
                      onClick={handleApplyOAMItem}
                    >
                      Use this image
                    </Button>
                  </ToolTip>
                </div>
      </div>
     
    </>
  );
};
