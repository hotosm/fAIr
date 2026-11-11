import { useLayoutEffect, useRef, useState } from "react";

export type PredictionHover = {
  x: number;
  y: number;
  rows: { label: string; value: string }[];
};

export const PredictionHoverTooltip = ({
  hover,
}: {
  hover: PredictionHover;
}) => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [opensLeft, setOpensLeft] = useState(false);
  const [opensUp, setOpensUp] = useState(false);

  useLayoutEffect(() => {
    const container = anchorRef.current?.offsetParent;
    setOpensLeft(!!container && hover.x > container.clientWidth / 2);
    setOpensUp(!!container && hover.y > container.clientHeight / 2);
  }, [hover.x, hover.y]);

  return (
    <div
      ref={anchorRef}
      className="pointer-events-none absolute z-50"
      style={{ left: hover.x, top: hover.y }}
    >
      <div
        className="relative"
        style={{
          transform: `translate(${opensLeft ? "calc(-100% - 12px)" : "12px"}, ${opensUp ? "calc(-100% + 12px)" : "-50%"})`,
        }}
      >
        <div className="bg-white/95 backdrop-blur-sm border border-gray-border rounded-lg shadow-lg px-3 py-2 flex flex-col items-start gap-1.5 min-w-[120px]">
          {hover.rows.map((row, index) => (
            <div key={index} className="flex flex-col gap-0.5">
              <p className="text-[10px] font-medium text-grey uppercase tracking-wide leading-none whitespace-nowrap">
                {row.label}
              </p>
              <p className="text-base font-bold text-purple-700 leading-tight">
                {row.value}
              </p>
            </div>
          ))}
        </div>
        <div
          className={`absolute w-0 h-0 ${opensUp ? "bottom-[6px]" : "top-1/2 -translate-y-1/2"} ${opensLeft ? "-right-[6px]" : "-left-[6px]"}`}
          style={{
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
            [opensLeft ? "borderLeft" : "borderRight"]: "6px solid white",
          }}
        />
      </div>
    </div>
  );
};
