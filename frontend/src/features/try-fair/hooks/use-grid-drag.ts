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

  // Keep fresh references for values needed inside window event handlers.
  const mapRef = useRef(map);
  mapRef.current = map;
  const containerRef = useRef(mapContainerRef);
  containerRef.current = mapContainerRef;
  const setAnchorRef = useRef(setAnchor);
  setAnchorRef.current = setAnchor;

  // ── Pointer-down: start a drag ─────────────────────────────────────────

  const handlePointerDown = (e: ReactPointerEvent) => {
    if (!map || !anchor || disabled) return;

    e.preventDefault();
    e.stopPropagation();

    const container = mapContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const lngLat = map.unproject([
      e.clientX - containerRect.left,
      e.clientY - containerRect.top,
    ]);
    const { tileX, tileY } = lngLatToTileCoords(
      lngLat.lat,
      lngLat.lng,
      anchor.z,
    );

    // Save drag-start state in refs.
    dragStartAnchorRef.current = anchor;
    dragStartTileRef.current = { x: tileX, y: tileY };

    // Disable map drag-panning while we own the pointer.
    const wasDragPanEnabled = map.dragPan ? map.dragPan.isEnabled() : false;
    dragPanWasEnabledRef.current = wasDragPanEnabled;
    if (wasDragPanEnabled) map.dragPan.disable();

    setIsDragging(true);
    onDragStart?.();
  };

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

    const onPointerUp = () => {
      // Cancel any pending frame.
      if (animationFrameIdRef.current !== null) {
        window.cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }

      // Apply final position.
      flushPendingPointer();

      // Restore map drag-panning.
      const currentMap = mapRef.current;
      if (
        dragPanWasEnabledRef.current &&
        currentMap?.dragPan &&
        !currentMap.dragPan.isEnabled()
      ) {
        currentMap.dragPan.enable();
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
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      if (animationFrameIdRef.current !== null) {
        window.cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      pendingPointerRef.current = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    // `isDragging` is the sole dependency — the effect subscribes when
    // dragging starts and unsubscribes when it ends. All other values are
    // read from refs to avoid re-subscription churn.
  }, [isDragging]);

  return { isDragging, handlePointerDown };
};
