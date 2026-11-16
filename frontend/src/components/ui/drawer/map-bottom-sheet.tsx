import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils";

/** Pointer travel (px) before a press becomes a drag instead of a tap. */
const DRAG_THRESHOLD_PX = 6;
/** Release speed (px/ms) that counts as a flick towards that position. */
const FLICK_VELOCITY = 0.5;

/** Elements that keep their own pointer gestures (typing, sliders, …). */
const NO_DRAG_SELECTOR =
  "input, textarea, select, [contenteditable='true'], [data-no-sheet-drag]";

type MapBottomSheetProps = {
  children: React.ReactNode;
  /** Accessible name of the sheet. */
  label: string;
  /** Visible height when collapsed, as a fraction of the screen height. */
  collapsedFraction?: number;
  /** Visible height when expanded, as a fraction of the screen height. */
  expandedFraction?: number;
  className?: string;
};

/**
 * A bottom sheet that sits over a full-screen map on phones. It has two
 * positions, collapsed and expanded:
 * - tap the handle to toggle;
 * - drag the sheet (anywhere, except inputs and sliders) and it follows the
 *   finger, then snaps to the nearer position, or the flicked direction;
 * - tap outside it (e.g. on the map) or press Escape to collapse it.
 * When expanded and its content is scrolled down, dragging scrolls first.
 */
export const MapBottomSheet = ({
  children,
  label,
  collapsedFraction = 0.2,
  expandedFraction = 0.7,
  className,
}: MapBottomSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window === "undefined" ? 800 : window.innerHeight,
  );

  // Whether the content is taller than the sheet (so it needs to scroll).
  const [contentOverflows, setContentOverflows] = useState(false);
  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === "undefined") return;
    const measure = () =>
      setContentOverflows(content.scrollHeight > content.clientHeight + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    Array.from(content.children).forEach((child) => observer.observe(child));
    measure();
    return () => observer.disconnect();
  }, []);
  const contentScrolls = isExpanded && contentOverflows;

  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // The sheet is always expanded-height; collapsing slides it down so only
  // the collapsed part shows.
  const sheetHeight = viewportHeight * expandedFraction;
  const collapsedOffset =
    viewportHeight * (expandedFraction - collapsedFraction);
  const restingOffset = isExpanded ? 0 : collapsedOffset;
  const offset = dragOffset ?? restingOffset;

  // ── Dragging ────────────────────────────────────────────────────────────
  // A press on the sheet starts a gesture; from then on the pointer is
  // followed on the whole window, so a fast swipe that leaves the sheet (or a
  // pointer that jumps) is still tracked until it's released.
  const suppressNextClick = useRef(false);
  const stopGesture = useRef<(() => void) | null>(null);
  useEffect(() => () => stopGesture.current?.(), []);

  const handlePointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    if ((event.target as Element).closest(NO_DRAG_SELECTOR)) return;
    stopGesture.current?.();

    const startY = event.clientY;
    const startOffset = restingOffset;
    const startTime = Date.now();
    const startedExpanded = isExpanded;
    let isDragging = false;

    const clamp = (value: number) =>
      Math.min(Math.max(value, 0), collapsedOffset);

    const onMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      if (!isDragging) {
        if (Math.abs(deltaY) < DRAG_THRESHOLD_PX) return;
        const contentIsScrolled = (contentRef.current?.scrollTop ?? 0) > 0;
        // Moves past the ends, or down while the content is scrolled,
        // aren't sheet drags (the content scrolls instead).
        const blocked =
          (startedExpanded && deltaY < 0) ||
          (startedExpanded && deltaY > 0 && contentIsScrolled) ||
          (!startedExpanded && deltaY > 0);
        if (blocked) {
          stop();
          return;
        }
        isDragging = true;
        window.getSelection()?.removeAllRanges();
      }
      setDragOffset(clamp(startOffset + deltaY));
    };

    const onEnd = (endEvent: PointerEvent) => {
      stop();
      if (!isDragging) return;
      const deltaY = endEvent.clientY - startY;
      const velocity = deltaY / Math.max(Date.now() - startTime, 1);
      const expand =
        Math.abs(velocity) > FLICK_VELOCITY
          ? velocity < 0
          : clamp(startOffset + deltaY) < collapsedOffset / 2;
      setIsExpanded(expand);
      setDragOffset(null);
      // The click that follows a drag must not press the button it began on.
      suppressNextClick.current = true;
      window.setTimeout(() => {
        suppressNextClick.current = false;
      }, 300);
    };

    const stop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      stopGesture.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    stopGesture.current = stop;
  };

  const handleClickCapture = (event: React.MouseEvent) => {
    if (!suppressNextClick.current) return;
    suppressNextClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  // ── Collapse on outside press / Escape ─────────────────────────────────
  useEffect(() => {
    if (!isExpanded) return;
    const handleOutsidePress = (event: PointerEvent) => {
      const path = event.composedPath();
      if (sheetRef.current && path.includes(sheetRef.current)) return;
      // Dialogs opened from the sheet (e.g. the model picker) are rendered
      // outside it, so presses in them don't count. Dropdowns opened from
      // the sheet live inside it already; anything else, including the
      // map's Menu chip, collapses the sheet.
      const insidePopup = path.some(
        (node) =>
          node instanceof Element &&
          node.matches("sl-dialog, sl-drawer, [role='dialog']"),
      );
      if (!insidePopup) setIsExpanded(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsExpanded(false);
    };
    document.addEventListener("pointerdown", handleOutsidePress, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePress, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  return (
    <section
      ref={sheetRef}
      aria-label={label}
      data-state={isExpanded ? "expanded" : "collapsed"}
      onPointerDown={handlePointerDown}
      onClickCapture={handleClickCapture}
      className={cn(
        // touch-action: the sheet handles vertical drags itself.
        "fixed inset-x-0 bottom-0 z-10 flex select-none flex-col rounded-t-[10px] border border-b-0 border-gray-border bg-white [touch-action:none]",
        className,
      )}
      style={{
        height: sheetHeight,
        transform: `translateY(${offset}px)`,
        transition:
          dragOffset === null
            ? "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)"
            : "none",
      }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((value) => !value)}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? `Collapse ${label}` : `Expand ${label}`}
        className="flex h-8 w-full shrink-0 cursor-grab items-center justify-center"
      >
        <span className="block h-1.5 w-12 rounded-full bg-grey" />
      </button>
      <div
        ref={contentRef}
        className={cn(
          "app-padding mx-auto w-full max-w-md flex-1 pb-[calc(env(safe-area-inset-bottom)+1rem)] select-text",
          // When the expanded content is taller than the sheet, a vertical
          // swipe on it scrolls (the handle still drags the sheet).
          // Otherwise the whole sheet is the drag surface.
          contentScrolls
            ? "overflow-y-auto [touch-action:pan-y]"
            : "overflow-hidden",
        )}
      >
        {children}
      </div>
    </section>
  );
};
