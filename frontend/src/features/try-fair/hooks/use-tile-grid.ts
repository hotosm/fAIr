import { useCallback, useEffect, useRef, useState } from "react";
import { Map } from "maplibre-gl";
import { BBOX } from "@/types";
import { TryFairResolution } from "@/enums/try-fair";
import {
  TileAnchor,
  computeCenteredAnchor,
  computeGridBBox,
  getTileZoomForResolution,
  snapAnchorToTileBoundary,
} from "@/features/try-fair/utils/tile-math";

// ── Types

type UseTileGridOptions = {
  map: Map | null;
  /** Imagery center [lng, lat] — snaps the grid here when it resolves. */
  imageryCenter?: [number, number];
  /** Current resolution selection. */
  resolution?: TryFairResolution;
  /** Selected model ID — triggers a re-center when it changes. */
  modelId?: string | null;
  /** Callback fired whenever the snapped grid bbox changes. */
  onBBoxChange: (bbox: BBOX, tileZoom: number) => void;
};

type UseTileGridReturn = {
  anchor: TileAnchor | null;
  setAnchor: React.Dispatch<React.SetStateAction<TileAnchor | null>>;
  tileZoom: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if two [lng, lat] tuples differ. */
const centersAreDifferent = (
  a: [number, number] | null,
  b: [number, number] | null,
): boolean => {
  if (a === null || b === null) return a !== b;
  return a[0] !== b[0] || a[1] !== b[1];
};

/** Returns true if two BBOX arrays are element-wise equal. */
const bboxesAreEqual = (a: BBOX, b: BBOX): boolean =>
  a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages the tile-grid anchor and notifies the parent when the snapped
 * bounding box changes.
 *
 * Consolidates the four separate recentering effects from the original
 * implementation into a single effect with explicit priority:
 *
 *   1. Model changed   → recenter (new imagery)
 *   2. Resolution changed → recenter (grid size changes)
 *   3. Imagery center changed → recenter on new center
 *   4. No anchor yet    → initialize
 */
export const useTileGrid = ({
  map,
  imageryCenter,
  resolution,
  modelId,
  onBBoxChange,
}: UseTileGridOptions): UseTileGridReturn => {
  const [anchor, setAnchor] = useState<TileAnchor | null>(null);
  const tileZoom = getTileZoomForResolution(resolution);

  // ── Track previous values to detect what changed ─────────────────────────

  const previousModelIdRef = useRef<string | null | undefined>(modelId);
  const previousResolutionRef = useRef<TryFairResolution | undefined>(
    resolution,
  );
  const previousImageryCenterRef = useRef<[number, number] | undefined>(
    imageryCenter,
  );

  //  Consolidated recentering effect
  useEffect(() => {
    if (!map) return;

    const modelChanged = modelId !== previousModelIdRef.current;
    const resolutionChanged = resolution !== previousResolutionRef.current;
    const imageryCenterChanged = centersAreDifferent(
      imageryCenter ?? null,
      previousImageryCenterRef.current ?? null,
    );

    // Update refs for next comparison.
    previousModelIdRef.current = modelId;
    previousResolutionRef.current = resolution;
    previousImageryCenterRef.current = imageryCenter;

    // Model changed — recenter from map center
    if (modelChanged && modelId) {
      const mapCenter = map.getCenter();
      setAnchor(
        computeCenteredAnchor(
          { lng: mapCenter.lng, lat: mapCenter.lat },
          tileZoom,
        ),
      );
      return;
    }

    // the grid footprint changes, so recenter from the current map center.
    if (resolutionChanged) {
      const mapCenter = map.getCenter();
      setAnchor(
        computeCenteredAnchor(
          { lng: mapCenter.lng, lat: mapCenter.lat },
          tileZoom,
        ),
      );
      return;
    }

    //  Imagery center resolved/changed — recenter on it.
    if (imageryCenterChanged && imageryCenter) {
      setAnchor(
        computeCenteredAnchor(
          { lng: imageryCenter[0], lat: imageryCenter[1] },
          tileZoom,
        ),
      );
      return;
    }

    // Priority 4: No anchor yet (first render) — initialize.
    if (!anchor) {
      const target = imageryCenter
        ? { lng: imageryCenter[0], lat: imageryCenter[1] }
        : map.getCenter();
      setAnchor(computeCenteredAnchor(target, tileZoom));
    }
    // `anchor` is intentionally excluded from deps — we only want to
    // initialise when there's no anchor. Subsequent anchor updates are
    // driven by dragging, not by this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, modelId, resolution, imageryCenter, tileZoom]);

  // ── Notify parent when the *snapped* bbox changes ────────────────────────
  //
  // The old code called onBBoxChange on every fractional anchor update during
  // drags. We now compare the snapped bbox and only fire when it actually
  // changes, avoiding expensive upstream work on every pixel of movement.

  const previousBBoxRef = useRef<BBOX | null>(null);

  const stableOnBBoxChange = useCallback(onBBoxChange, [onBBoxChange]);

  useEffect(() => {
    if (!anchor) return;

    const snappedAnchor = snapAnchorToTileBoundary(anchor);
    const currentBBox = computeGridBBox(snappedAnchor);

    const bboxChanged =
      !previousBBoxRef.current ||
      !bboxesAreEqual(previousBBoxRef.current, currentBBox);

    if (bboxChanged) {
      previousBBoxRef.current = currentBBox;
      stableOnBBoxChange(currentBBox, anchor.z);
    }
  }, [anchor, stableOnBBoxChange]);

  return { anchor, setAnchor, tileZoom };
};
