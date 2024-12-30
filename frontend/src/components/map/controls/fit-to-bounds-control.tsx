import useScreenSize from '@/hooks/use-screen-size';
import { ArrowMoveIcon } from '@/components/ui/icons';
import { Map } from 'maplibre-gl';
import { MAP_CONTENT } from '@/constants';
import { ToolTip } from '@/components/ui/tooltip';
import { useCallback } from 'react';

export const FitToBounds = ({
  map,
  bounds,
}: {
  map: Map | null;
  bounds: any;
}) => {
  const { isSmallViewport } = useScreenSize();

  const fitToBounds = useCallback(() => {
    if (!map || !bounds) return;
    map?.fitBounds(bounds);
  }, [map, bounds]);

  return (
    <ToolTip content={MAP_CONTENT.controls.fitToBounds.tooltip}>
      <button
        className={`bg-white  ${isSmallViewport ? "rounded-xl p-2.5 border border-gray-border md:border-0" : "p-1.5"}`}
        onClick={fitToBounds}
      >
        <ArrowMoveIcon className="icon-lg" />
      </button>
    </ToolTip>
  );
};
