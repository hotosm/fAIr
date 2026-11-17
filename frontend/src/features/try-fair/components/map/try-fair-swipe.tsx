import { Map } from "maplibre-gl";
import {
  KeyboardEvent,
  PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { TryFairMapOutputType } from "@/enums/try-fair";
import { BBOX } from "@/types";
import { TryFairPredictionsLayer } from "@/features/try-fair/components/map/try-fair-prediction-results";
import { PredictionClassStyle } from "@/features/try-fair/utils/prediction-classes";

const MIN_DIVIDER_PERCENT = 5;
const MAX_DIVIDER_PERCENT = 95;
const KEYBOARD_STEP_PERCENT = 5;
const SIDE_LABEL =
  "absolute top-1/2 -translate-y-1/2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] leading-none font-semibold uppercase tracking-wide text-white pointer-events-none";
const LABEL_HIDE_PERCENT = 8;

type TryFairSwipeProps = {
  map: Map | null;
  preImageryUrl?: string | null;
  predictions: GeoJSON.FeatureCollection | null;
  predictionBBox: BBOX | null;
  predictionGridZoom?: number;
  outputType: TryFairMapOutputType;
  classStyle?: PredictionClassStyle | null;
};

const clampDivider = (percent: number) =>
  Math.min(MAX_DIVIDER_PERCENT, Math.max(MIN_DIVIDER_PERCENT, percent));

/**
 * Pre/post swipe for models that declare `fair:preview.pre_imagery`: a
 * non-interactive map of the pre imagery, synced to the main map and clipped
 * left of a draggable divider.
 */
export const TryFairSwipe = ({
  map,
  preImageryUrl,
  predictions,
  predictionBBox,
  predictionGridZoom,
  outputType,
  classStyle,
}: TryFairSwipeProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [preMap, setPreMap] = useState<Map | null>(null);
  const [dividerPercent, setDividerPercent] = useState(50);

  useEffect(() => {
    if (!map || !preImageryUrl || !containerRef.current) return;
    const createdMap = new Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          pre: { type: "raster", tiles: [preImageryUrl], tileSize: 256 },
        },
        layers: [{ id: "pre", type: "raster", source: "pre" }],
      },
      center: map.getCenter(),
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
      interactive: false,
      attributionControl: false,
    });
    // Exposed only once loaded so the predictions layer can add sources safely.
    createdMap.once("load", () => setPreMap(createdMap));
    const sync = () => {
      createdMap.jumpTo({
        center: map.getCenter(),
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
    };
    map.on("move", sync);
    return () => {
      map.off("move", sync);
      setPreMap(null);
      createdMap.remove();
    };
  }, [map, preImageryUrl]);

  const moveDividerTo = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDividerPercent(clampDivider(((clientX - rect.left) / rect.width) * 100));
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      moveDividerTo(event.clientX);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step =
      event.key === "ArrowLeft"
        ? -KEYBOARD_STEP_PERCENT
        : event.key === "ArrowRight"
          ? KEYBOARD_STEP_PERCENT
          : 0;
    if (!step) return;
    event.preventDefault();
    setDividerPercent((current) => clampDivider(current + step));
  };

  if (!map || !preImageryUrl) return null;

  return (
    <>
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - dividerPercent}% 0 0)` }}
      />
      <TryFairPredictionsLayer
        map={preMap}
        predictions={predictions}
        predictionBBox={predictionBBox}
        predictionGridZoom={predictionGridZoom}
        outputType={outputType}
        classStyle={classStyle}
      />
      <div
        className="absolute top-0 bottom-0 z-[4]"
        style={{ left: `${dividerPercent}%`, transform: "translateX(-50%)" }}
      >
        <div className="mx-auto h-full w-0.5 bg-white/90 shadow" />
        <span
          className={`${SIDE_LABEL} right-full mr-5`}
          style={{ opacity: dividerPercent > LABEL_HIDE_PERCENT ? 1 : 0 }}
        >
          Pre
        </span>
        <span
          className={`${SIDE_LABEL} left-full ml-5`}
          style={{
            opacity: dividerPercent < 100 - LABEL_HIDE_PERCENT ? 1 : 0,
          }}
        >
          Post
        </span>
        <button
          type="button"
          role="slider"
          aria-label="Drag to compare pre and post imagery"
          aria-valuemin={MIN_DIVIDER_PERCENT}
          aria-valuemax={MAX_DIVIDER_PERCENT}
          aria-valuenow={Math.round(dividerPercent)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onKeyDown={handleKeyDown}
          style={{ touchAction: "none" }}
          className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-gray-border bg-white text-dark shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="text-xs">&#8660;</span>
        </button>
      </div>
    </>
  );
};
