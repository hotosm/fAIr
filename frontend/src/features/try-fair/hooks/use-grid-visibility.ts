import { RefObject, useCallback, useEffect, useState } from "react";
import { Map } from "maplibre-gl";
import {
  TileAnchor,
  computeGridBBox,
  snapAnchorToTileBoundary,
} from "@/features/try-fair/utils/tile-math";


export type GridVisibility = {
  /** True when the grid's bbox no longer intersects the current viewport. */
  isOffScreen: boolean;
  /** Angle (radians, screen space) from the viewport centre to the grid centre. */
  angleRad: number;
};

type UseGridVisibilityOptions = {
  map: Map | null;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  anchor: TileAnchor | null;
  /** When true, visibility is never reported as off-screen (e.g. while predicting). */
  disabled?: boolean;
};


const HIDDEN: GridVisibility = {
  isOffScreen: false,
  angleRad: 0,
};


/**
 * Tracks whether the draggable grid has been left outside the current viewport.
 *
 * The grid doubles as the prediction AOI, so it deliberately does *not* follow
 * the camera — instead this hook detects when it is fully off-screen so the UI
 * can offer the user a one-tap "bring it here" affordance. When off-screen it
 * also computes the on-screen direction toward the grid so an arrow can point
 * the user back to it.
 */
export const useGridVisibility = ({
  map,
  mapContainerRef,
  anchor,
  disabled = false,
}: UseGridVisibilityOptions): GridVisibility => {
  const [visibility, setVisibility] = useState<GridVisibility>(HIDDEN);

  const recompute = useCallback(() => {
    if (!map || !anchor || disabled) {
      setVisibility((prev) => (prev.isOffScreen ? HIDDEN : prev));
      return;
    }

    const [west, south, east, north] = computeGridBBox(
      snapAnchorToTileBoundary(anchor),
    );
    const bounds = map.getBounds();
    const mapWest = bounds.getWest();
    const mapEast = bounds.getEast();
    const mapSouth = bounds.getSouth();
    const mapNorth = bounds.getNorth();

    // The grid is visible if its bbox overlaps the viewport bbox at all.
    const intersects = !(
      east < mapWest ||
      west > mapEast ||
      north < mapSouth ||
      south > mapNorth
    );

    if (intersects) {
      setVisibility((prev) => (prev.isOffScreen ? HIDDEN : prev));
      return;
    }

    // Off-screen: the nudge lives in a fixed spot, but its arrow points from
    // the viewport centre toward the grid so the user knows which way it went.
    const gridCenterPixel = map.project({
      lng: (west + east) / 2,
      lat: (south + north) / 2,
    });

    const container = mapContainerRef.current;
    const centerX = (container?.clientWidth ?? 0) / 2;
    const centerY = (container?.clientHeight ?? 0) / 2;

    const angleRad = Math.atan2(
      gridCenterPixel.y - centerY,
      gridCenterPixel.x - centerX,
    );

    setVisibility({ isOffScreen: true, angleRad });
  }, [map, anchor, mapContainerRef, disabled]);

  useEffect(() => {
    if (!map) return;

    recompute();
    map.on("move", recompute);
    map.on("moveend", recompute);

    return () => {
      map.off("move", recompute);
      map.off("moveend", recompute);
    };
  }, [map, recompute]);

  return visibility;
};
