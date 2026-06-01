import {
  PointerEvent as ReactPointerEvent,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { Map } from "maplibre-gl";
import {
  TileAnchor,
  clampAnchorToWorldBounds,
  lngLatToTileCoords,
  snapAnchorToTileBoundary,
} from "@/features/try-fair/utils/tile-math";

// ── Types

type UseGridDragOptions = {
  map: Map | null;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  /** Current grid anchor — read at drag-start and updated during drags. */
  anchor: TileAnchor | null;
  /** State setter for the anchor — called during drags and on snap at release. */
  setAnchor: React.Dispatch<React.SetStateAction<TileAnchor | null>>;
  /** When true, dragging is disabled (e.g. prediction in progress). */
  disabled?: boolean;
  /** Fired once when a drag begins (e.g. to hide the export dropdown). */
  onDragStart?: () => void;
};

type UseGridDragReturn = {
  /** Whether the user is currently dragging the grid. */
  isDragging: boolean;
  /** Attach this to the drag surface's `onPointerDown`. */
  handlePointerDown: (e: ReactPointerEvent) => void;
};

// ── Constants

/** How long the user must hold before a touch becomes a grid drag (ms). */
const LONG_PRESS_DURATION_MS = 300;
/** Max movement (px) during the hold period before the long-press is cancelled. */
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

// ── Hook

/**
 * Handles pointer-based dragging of the tile grid overlay.
 *
 * Key design decisions:
 * - Mutable drag state (start anchor, start tile coords, saved dragPan
 *   state) is stored in a **ref** rather than `useState`. This avoids the
 *   old issue where the entire pointermove/pointerup effect re-subscribed
 *   on every state change.
 * - Only the `isDragging` boolean is React state so the component can
 *   toggle cursor styles.
 * - Pointer-move updates are throttled via `requestAnimationFrame`.
 * - **Touch devices** use a long-press gesture: the user must hold for
 *   300 ms before the grid drag activates. Quick taps and swipes pass
 *   through to the map for panning / zooming.
 * - Long-press cancel listeners are managed **imperatively** (added in
 *   handlePointerDown, removed when the timer fires or is cancelled) to
 *   avoid re-subscription churn on every render.
 */
export const useGridDrag = ({
  map,
  mapContainerRef,
  anchor,
  setAnchor,
  disabled = false,
  onDragStart,
}: UseGridDragOptions): UseGridDragReturn => {
  const [isDragging, setIsDragging] = useState(false);

  // Mutable refs for drag state — avoids effect re-subscription on every update.
  const dragStartAnchorRef = useRef<TileAnchor | null>(null);
  const dragStartTileRef = useRef<{ x: number; y: number } | null>(null);
  const dragPanWasEnabledRef = useRef(false);

  // rAF-throttled pointer tracking.
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Long-press state — managed imperatively (no useEffect), so we store a
  // cleanup function that removes the window listeners added during
  // handlePointerDown for touch.
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressCleanupRef = useRef<(() => void) | null>(null);

  // Keep fresh references for values needed inside window event handlers.
  const mapRef = useRef(map);
  mapRef.current = map;
  const containerRef = useRef(mapContainerRef);
  containerRef.current = mapContainerRef;
  const setAnchorRef = useRef(setAnchor);
  setAnchorRef.current = setAnchor;
  const anchorRef = useRef(anchor);
  anchorRef.current = anchor;
  const onDragStartRef = useRef(onDragStart);
  onDragStartRef.current = onDragStart;

  // ── Helpers ───────────────────────────────────────────────────────────

  /** Cancel any pending long-press timer and remove its window listeners. */
  const clearLongPress = () => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressCleanupRef.current?.();
    longPressCleanupRef.current = null;
  };

  /** Shared logic to initialise a grid drag from a screen coordinate. */
  const beginDrag = (clientX: number, clientY: number) => {
    const currentMap = mapRef.current;
    const currentAnchor = anchorRef.current;
    const container = containerRef.current.current;
    if (!currentMap || !currentAnchor || !container) return;

    const containerRect = container.getBoundingClientRect();
    const lngLat = currentMap.unproject([
      clientX - containerRect.left,
      clientY - containerRect.top,
    ]);
    const { tileX, tileY } = lngLatToTileCoords(
      lngLat.lat,
      lngLat.lng,
      currentAnchor.z,
    );

    // Save drag-start state in refs.
    dragStartAnchorRef.current = currentAnchor;
    dragStartTileRef.current = { x: tileX, y: tileY };

    // Disable map drag-panning while we own the pointer.
    const wasDragPanEnabled = currentMap.dragPan
      ? currentMap.dragPan.isEnabled()
      : false;
    dragPanWasEnabledRef.current = wasDragPanEnabled;
    if (wasDragPanEnabled) currentMap.dragPan.disable();

    // Also disable touch handlers so the map doesn't fight for the gesture.
    currentMap.touchZoomRotate.disable();
    currentMap.touchPitch.disable();

    setIsDragging(true);
    onDragStartRef.current?.();
  };

  // ── Pointer-down: start a drag ─────────────────────────────────────────

  const handlePointerDown = (e: ReactPointerEvent) => {
    if (!map || !anchor || disabled) return;

    if (e.pointerType === "touch") {
      // Long-press gesture: wait LONG_PRESS_DURATION_MS with the finger
      // held still before initiating the grid drag. Quick taps and swipes
      // are left to the map for panning / zooming.
      clearLongPress();

      const origin = { x: e.clientX, y: e.clientY };
      const pointerId = e.pointerId;

      // ── Imperative window listeners to detect cancellation ──
      // These are added here (not in a useEffect) so they don't re-subscribe
      // on every render — a critical fix for drag smoothness.

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        const dx = ev.clientX - origin.x;
        const dy = ev.clientY - origin.y;
        if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_TOLERANCE_PX) {
          clearLongPress(); // finger moved — cancel
        }
      };

      const onEnd = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        clearLongPress(); // lifted or cancelled before timer
      };

      const removeListeners = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onEnd);
        window.removeEventListener("pointercancel", onEnd);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onEnd);
      window.addEventListener("pointercancel", onEnd);

      longPressCleanupRef.current = removeListeners;

      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        // Remove cancel listeners — the drag effect takes over from here.
        removeListeners();
        longPressCleanupRef.current = null;
        // Begin the drag from the original touch point.
        beginDrag(origin.x, origin.y);
      }, LONG_PRESS_DURATION_MS);

      return;
    }

    // Mouse / pen — immediate drag as before.
    e.preventDefault();
    e.stopPropagation();
    beginDrag(e.clientX, e.clientY);
  };

  // Clean up the long-press timer on unmount.
  useEffect(() => {
    return () => clearLongPress();
  }, []);

  // ── Pointer-move / pointer-up (attached to window while dragging) ──────

  useEffect(() => {
    if (!isDragging) return;

    const computeAnchorFromPointer = (clientX: number, clientY: number) => {
      const currentMap = mapRef.current;
      const container = containerRef.current.current;
      const startAnchor = dragStartAnchorRef.current;
      const startTile = dragStartTileRef.current;
      if (!currentMap || !container || !startAnchor || !startTile) return;

      const containerRect = container.getBoundingClientRect();
      const lngLat = currentMap.unproject([
        clientX - containerRect.left,
        clientY - containerRect.top,
      ]);
      const { tileX, tileY } = lngLatToTileCoords(
        lngLat.lat,
        lngLat.lng,
        startAnchor.z,
      );

      const tileDeltaX = tileX - startTile.x;
      const tileDeltaY = tileY - startTile.y;

      setAnchorRef.current(
        clampAnchorToWorldBounds({
          x: startAnchor.x + tileDeltaX,
          y: startAnchor.y + tileDeltaY,
          z: startAnchor.z,
        }),
      );
    };

    const flushPendingPointer = () => {
      const pending = pendingPointerRef.current;
      if (!pending) return;
      pendingPointerRef.current = null;
      computeAnchorFromPointer(pending.x, pending.y);
    };

    const scheduleAnimationFrame = () => {
      if (animationFrameIdRef.current !== null) return;
      animationFrameIdRef.current = window.requestAnimationFrame(() => {
        animationFrameIdRef.current = null;
        flushPendingPointer();
        // If another pointer event arrived during the frame, schedule again.
        if (pendingPointerRef.current) scheduleAnimationFrame();
      });
    };

    const onPointerMove = (e: PointerEvent) => {
      pendingPointerRef.current = { x: e.clientX, y: e.clientY };
      scheduleAnimationFrame();
    };

    const endDrag = () => {
      // Cancel any pending animation frame.
      if (animationFrameIdRef.current !== null) {
        window.cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }

      // Apply final position.
      flushPendingPointer();

      // Restore map interactions.
      const currentMap = mapRef.current;
      if (
        dragPanWasEnabledRef.current &&
        currentMap?.dragPan &&
        !currentMap.dragPan.isEnabled()
      ) {
        currentMap.dragPan.enable();
      }

      // Restore touch handlers that were disabled when the drag began.
      if (currentMap) {
        currentMap.touchZoomRotate.enable();
        currentMap.touchPitch.enable();
      }

      // Snap anchor to the nearest integer tile boundary on release.
      setAnchorRef.current((prev) =>
        prev ? snapAnchorToTileBoundary(prev) : prev,
      );

      // Reset drag state.
      dragStartAnchorRef.current = null;
      dragStartTileRef.current = null;
      dragPanWasEnabledRef.current = false;
      setIsDragging(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    return () => {
      if (animationFrameIdRef.current !== null) {
        window.cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      pendingPointerRef.current = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [isDragging]);

  return { isDragging, handlePointerDown };
};
