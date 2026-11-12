import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { cn, extractDatePart } from "@/utils";
import { Spinner } from "@/components/ui/spinner";
import { OAMImageryItem } from "@/features/try-fair/api/hot-imagery";
import { ExpandIcon } from "@/components/ui/icons/expand-icon";
import {
  ArrowBackIcon,
  ChevronDownIcon,
  CloseIcon,
} from "@/components/ui/icons";
import useScreenSize from "@/hooks/use-screen-size";
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
const previewLayoutId = (item: OAMImageryItem) => `oam-preview-${item.id}`;
const PREVIEW_TRANSITION = {
  type: "tween",
  duration: 0.3,
  ease: "easeOut",
} as const;

const ImageryCard = ({
  item,
  isSelected,
  isExpanded,
  isPreviewSource,
  onSelect,
  onExpand,
  onPrepareExpand,
}: {
  item: OAMImageryItem;
  isSelected: boolean;
  /** Its image is open in the preview, so it's shown there instead. */
  isExpanded: boolean;
  /**
   * Last card opened in the preview: only its image shares a layout with
   * the preview (others would animate on every layout change).
   */
  isPreviewSource: boolean;
  onSelect: (item: OAMImageryItem) => void;
  onExpand: (item: OAMImageryItem) => void;
  /** Called just before an expand (press or focus), to set up the animation. */
  onPrepareExpand: (item: OAMImageryItem) => void;
}) => (
  // The card selects the image; the expand button (laid over the card's
  // bottom-left corner, as buttons can't nest) opens a large preview.
  <div className="relative">
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        "w-full text-left bg-frosted-blue min-h-[150px] rounded-lg p-2  transition-colors flex flex-col gap-1.5",
        isSelected ? "border-primary border" : "",
      )}
    >
      <div className="w-full">
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
      <div className="relative w-full">
        {item.thumbnailUrl && isExpanded ? (
          <div className="w-full h-24" />
        ) : item.thumbnailUrl ? (
          // Shares its layoutId with the preview, so it grows into it.
          <motion.img
            layoutId={isPreviewSource ? previewLayoutId(item) : undefined}
            transition={PREVIEW_TRANSITION}
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
        {/* Room for the expand button below. */}
        <span aria-hidden className="mt-2 block size-6" />
      </div>
    </button>
    {item.thumbnailUrl && (
      <button
        type="button"
        onPointerDown={() => onPrepareExpand(item)}
        onFocus={() => onPrepareExpand(item)}
        onClick={() => onExpand(item)}
        aria-label={`Expand image ${item.title}`}
        title="Expand image"
        className="absolute bottom-2 left-2 flex items-start rounded bg-white p-1 hover:bg-off-white"
      >
        <ExpandIcon className="size-4 text-dark" />
      </button>
    )}
  </div>
);

/**
 * The image of an imagery card, enlarged in the middle of the imagery
 * selector. The image grows out of its card (shared layout animation).
 */
const ImageryPreview = ({
  item,
  container,
  onClose,
}: {
  item: OAMImageryItem;
  /** Element to centre over; the whole screen when not given. */
  container?: HTMLElement | null;
  onClose: () => void;
}) => {
  // Escape closes the preview only, not the imagery dialog underneath.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className={cn(
        "inset-0 z-50 flex items-center justify-center bg-black/40 p-4",
        container ? "absolute rounded-lg" : "fixed",
      )}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative flex w-full max-w-[560px] flex-col items-center rounded-xl bg-white p-6 pt-12 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close image preview"
          className="absolute right-3 top-3 rounded-md p-1 text-dark hover:bg-off-white"
        >
          <CloseIcon className="size-5" />
        </button>
        <motion.img
          layoutId={previewLayoutId(item)}
          transition={PREVIEW_TRANSITION}
          src={item.thumbnailUrl ?? ""}
          alt={item.title}
          className="max-h-[55dvh] w-full object-contain"
        />
      </div>
    </motion.div>,
    container ?? document.body,
  );
};

/**
 * Imagery results for the selected grid square: beside the map on wider
 * screens, a collapsible sheet in the expanded selector, and on phones a
 * full view over the map with a Back button.
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
  previewContainer,
}: {
  expanded?: boolean;
  cellSelected: boolean;
  images: OAMImageryItem[];
  loading: boolean;
  selectedItem: OAMImageryItem | null;
  onSelect: (item: OAMImageryItem | null) => void;
  handleApplyOAMItem: () => void;
  /** Where the enlarged image preview is centred (the imagery dialog). */
  previewContainer?: HTMLElement | null;
  /** Close the images panel (clears the selected grid cell). */
  onClose: () => void;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItem, setExpandedItem] = useState<OAMImageryItem | null>(null);
  // Kept after closing, so the image can animate back into its card.
  const [previewSourceId, setPreviewSourceId] = useState<string | null>(null);
  const closePreview = useCallback(() => setExpandedItem(null), []);
  const preparePreview = useCallback(
    (item: OAMImageryItem) => setPreviewSourceId(item.id),
    [],
  );
  const contentId = useId();
  const { isSmallViewport } = useScreenSize();
  const isPhone = isSmallViewport && !expanded;
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

  const resultsTitle = loading
    ? "Loading images…"
    : `${filtered.length} image${filtered.length === 1 ? "" : "s"} ${isPhone ? "within selected grid square" : "in this area"}`;

  return (
    <aside
      aria-label="Imagery results"
      className={cn(
        expanded
          ? "imagery-results"
          : isPhone
            ? "absolute inset-0 z-40 flex flex-col overflow-hidden bg-white"
            : "absolute top-4 bottom-4 left-4 z-10 w-[200px] md:w-[350px] bg-white rounded-lg shadow-lg flex flex-col overflow-hidden",
        expanded && isCollapsed && "imagery-results--collapsed",
      )}
    >
      <AnimatePresence>
        {expandedItem && (
          <ImageryPreview
            key={expandedItem.id}
            item={expandedItem}
            container={previewContainer}
            onClose={closePreview}
          />
        )}
      </AnimatePresence>
      {isPhone && (
        <div className="flex shrink-0 flex-col gap-3 pb-3">
          <button
            type="button"
            onClick={onClose}
            className="flex w-fit items-center gap-2 text-sm text-dark"
          >
            <ArrowBackIcon className="size-5" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-sm text-grey">{resultsTitle}</h3>
            {loading && <Spinner style={{ fontSize: "14px" }} />}
          </div>
        </div>
      )}
      <div
        className={cn(
          "px-4 py-3 flex items-center gap-2 shrink-0",
          isPhone && "hidden",
        )}
      >
        <h3 className="text-dark font-semibold text-sm flex-1">
          {resultsTitle}
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
        <div className={cn("px-3 pb-2", isPhone && "hidden")}>
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
            isPhone && "hidden",
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

        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto pb-3 scrollable",
            isPhone ? "px-0" : "px-3",
          )}
        >
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
                expanded || isPhone
                  ? "grid-cols-2"
                  : "grid-cols-1 md:grid-cols-2",
              )}
            >
              {filtered.map((item) => (
                <ImageryCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  isExpanded={expandedItem?.id === item.id}
                  isPreviewSource={previewSourceId === item.id}
                  onPrepareExpand={preparePreview}
                  onExpand={setExpandedItem}
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
      {isPhone ? (
        <button
          type="button"
          disabled={!selectedItem}
          onClick={handleApplyOAMItem}
          className="mt-2 w-full shrink-0 rounded-lg bg-primary py-3 text-sm text-white disabled:cursor-not-allowed disabled:bg-[#E3E5E8]"
        >
          Use This Image
        </button>
      ) : (
        <div
          className={cn(
            "p-3 border-t border-gray-border bg-white flex items-center gap-3 shrink-0",
            expanded ? "justify-between" : "justify-end",
          )}
        >
          {expanded && (
            <p
              className="text-xs text-grey truncate"
              title={selectedItem?.title}
            >
              {selectedItem?.title ?? "Select an image to preview"}
            </p>
          )}
          <ToolTip
            content={!selectedItem ? "Select an image first" : undefined}
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
      )}
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
