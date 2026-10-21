import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Map } from "maplibre-gl";
import { useTileGrid } from "@/features/try-fair/hooks/use-tile-grid";
import { TryFairResolution } from "@/enums";
import type { BBOX } from "@/types";

afterEach(cleanup);

it("moves the grid to the restored location even when its resolution also changes", async () => {
  const onBBoxChange = vi.fn();
  const map = {
    getCenter: () => ({ lng: 1, lat: 1 }),
    getBounds: () => ({ contains: () => true }),
  } as unknown as Map;
  const { rerender } = renderHook(
    ({
      center,
      resolution,
    }: {
      center: [number, number];
      resolution: TryFairResolution;
    }) => useTileGrid({ map, imageryCenter: center, resolution, onBBoxChange }),
    {
      initialProps: {
        center: [1, 1] as [number, number],
        resolution: TryFairResolution.LOW,
      },
    },
  );
  await waitFor(() => expect(onBBoxChange).toHaveBeenCalled());
  rerender({ center: [85, 27], resolution: TryFairResolution.HIGH });
  await waitFor(() => {
    const bbox = onBBoxChange.mock.lastCall?.[0] as BBOX;
    expect(bbox[0]).toBeLessThan(85);
    expect(bbox[2]).toBeGreaterThan(85);
    expect(bbox[1]).toBeLessThan(27);
    expect(bbox[3]).toBeGreaterThan(27);
  });
});
