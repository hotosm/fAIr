import { useEffect, useId, useMemo, useState } from "react";
import { cn, extractDatePart } from "@/utils";
import { Spinner } from "@/components/ui/spinner";
import { OAMImageryItem } from "@/features/try-fair/api/hot-imagery";
import { ExpandIcon } from "@/components/ui/icons/expand-icon";
import { ChevronDownIcon, CloseIcon } from "@/components/ui/icons";
import { Input, Select } from "@/components/ui/form";
import { INPUT_TYPES, SHOELACE_SELECT_SIZES, SHOELACE_SIZES } from "@/enums";
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
import { EmptyGridIcon } from "@/components/ui/icons/empty-grid-icon";

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
 * Imagery results beside the desktop map, or in a collapsible mobile sheet.
 */
export const OAMImageryPanel = ({
  expanded = false,
  cellSelected,
  images,
  loading,
  selectedItem,
  onSelect,
  onClose,
  handleApplyOAMItem,
}: {
  expanded?: boolean;
  cellSelected: boolean;
  images: OAMImageryItem[];
  loading: boolean;
  selectedItem: OAMImageryItem | null;
  onSelect: (item: OAMImageryItem | null) => void;
  handleApplyOAMItem: () => void;
  /** Close the images panel (clears the selected grid cell). */
  onClose: () => void;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const contentId = useId();
  const [nameFilter, setNameFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<DatePreset>("");
  const [resolutionFilter, setResolutionFilter] =
    useState<ResolutionPreset>("");

  useEffect(() => {
    setIsCollapsed(false);
  }, [cellSelected, images]);

  const filtered = useMemo(() => {
    const query = nameFilter.trim().toLowerCase();
    return images.filter(
      (i) =>
        withinDate(i.acquiredAt, dateFilter) &&
        withinResolution(i.gsd, resolutionFilter) &&
        (query === "" ||
          i.title.toLowerCase().includes(query) ||
          i.provider.toLowerCase().includes(query)),
    );
  }, [images, nameFilter, dateFilter, resolutionFilter]);

  if (!cellSelected) return null;

  return (
    <aside
      aria-label="Imagery results"
      className={cn(
        expanded
          ? "imagery-results"
          : "absolute top-4 bottom-4 left-4 z-10 w-[200px] md:w-[350px] bg-white rounded-lg shadow-lg flex flex-col overflow-hidden",
        expanded && isCollapsed && "imagery-results--collapsed",
      )}
    >
      <div className="px-4 py-3 flex items-center gap-2 shrink-0">
        <h3 className="text-dark font-semibold text-sm flex-1">
          {loading
            ? "Loading images…"
            : `${filtered.length} image${filtered.length === 1 ? "" : "s"} in this area`}
        </h3>
        {loading && <Spinner style={{ fontSize: "14px" }} />}
        {expanded && (
          <button
            type="button"
            aria-label={
              isCollapsed
                ? "Expand imagery results"
                : "Collapse imagery results"
            }
            aria-expanded={!isCollapsed}
            aria-controls={contentId}
            onClick={() => setIsCollapsed((value) => !value)}
            className="lg:hidden flex items-center justify-center size-8 text-grey hover:text-dark"
          >
            <ChevronDownIcon
              className={cn("size-4", isCollapsed && "rotate-180")}
            />
          </button>
        )}
        <button
          type="button"
          aria-label="Close imagery results"
          onClick={onClose}
          className="flex items-center justify-center size-8 text-grey hover:text-dark shrink-0"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      <div
        id={contentId}
        className={
          expanded
            ? "imagery-results__content"
            : "flex flex-col flex-1 min-h-0 overflow-hidden"
        }
      >
        <div className="px-3 pb-2">
          <Input
            type={INPUT_TYPES.TEXT}
            value={nameFilter}
            handleInput={(e) => setNameFilter(e.target.value)}
            placeholder="Search by name"
            size={SHOELACE_SIZES.SMALL}
            clearable
            showBorder
          />
        </div>

        <div
          className={cn(
            "px-3 pb-2 flex items-center gap-2 shrink-0",
            !expanded && "md:flex-row flex-col",
          )}
        >
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

        <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 scrollable">
          {!loading && filtered.length === 0 ? (
            <ImageriesEmptyState
              content={
                images.length === 0
                  ? "No imagery available in this area."
                  : "No imagery matches the selected filters."
              }
            />
          ) : (
            <div
              className={cn(
                "grid gap-2",
                expanded ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2",
              )}
            >
              {filtered.map((item) => (
                <ImageryCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  onSelect={(clicked) => {
                    const next =
                      selectedItem?.id === clicked.id ? null : clicked;
                    onSelect(next);
                    if (expanded && next) setIsCollapsed(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div
        className={cn(
          "p-3 border-t border-gray-border bg-white flex items-center gap-3 shrink-0",
          expanded ? "justify-between" : "justify-end",
        )}
      >
        {expanded && (
          <p className="text-xs text-grey truncate" title={selectedItem?.title}>
            {selectedItem?.title ?? "Select an image to preview"}
          </p>
        )}
        <ToolTip content={!selectedItem ? "Select an image first" : undefined}>
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
    </aside>
  );
};

const ImageriesEmptyState = ({ content }: { content: string }) => {
  return (
    <div className="h-full flex justify-center gap-3 flex-col items-center border rounded-md border-gray-border ">
      <EmptyGridIcon />
      <h3 className="text-xs text-grey">{content}</h3>
    </div>
  );
};
