import { GridVisibility } from "@/features/try-fair/hooks/use-grid-visibility";

type GridOffScreenNudgeProps = {
  visibility: GridVisibility;
  /** Recenter the grid onto the current view. */
  onBringGrid: () => void;
};

/**
 * Floating affordance shown when the draggable grid has been panned off-screen.
 *
 * Because the grid is the prediction AOI, it deliberately doesn't follow the
 * camera — instead we surface a pill (pinned to the edge nearest the grid, with
 * an arrow pointing toward it) that lets the user bring the grid to the current
 * view with one tap.
 */
export const GridOffScreenNudge = ({
  visibility,
  onBringGrid,
}: GridOffScreenNudgeProps) => {
  if (!visibility.isOffScreen) return null;

  const { angleRad } = visibility;
  const angleDeg = (angleRad * 180) / Math.PI;

  return (
    <button
      type="button"
      onClick={onBringGrid}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-md border border-gray-border text-xs text-dark hover:bg-off-white transition-colors"
      aria-label="Bring the grid to the current view"
    >
      {/* Arrow points toward the grid's current location. */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: `rotate(${angleDeg}deg)` }}
        aria-hidden="true"
      >
        <line x1="4" y1="12" x2="20" y2="12" />
        <polyline points="14 6 20 12 14 18" />
      </svg>
      <span className="font-medium whitespace-nowrap">Bring grid here</span>
    </button>
  );
};
