import { describe, expect, it } from "vitest";
import { ModelType, TileServiceType } from "@/enums";
import { imageryKeptOnModelSwitch } from "@/features/try-fair/utils/common";

const oamItemSample =
  "https://tiles.imagery.hotosm.org/raster/collections/openaerialmap/items/2cb40d6b-cc76-411e-9496-9cabf1402bea/tiles/WebMercatorQuad/{z}/{x}/{y}?assets=visual";
const tileSample =
  "https://tiles.openaerialmap.org/690585b76415e43597ffd7ea/0/690585b76415e43597ffd7eb/{z}/{x}/{y}";

describe("imageryKeptOnModelSwitch", () => {
  it("keeps OAM sample imagery as that OAM item", () => {
    expect(imageryKeptOnModelSwitch(ModelType.DEMO, oamItemSample)).toEqual({
      url: null,
      tileServiceType: null,
      oamItemId: "2cb40d6b-cc76-411e-9496-9cabf1402bea",
    });
  });

  it("keeps any other sample imagery as its tile URL", () => {
    expect(imageryKeptOnModelSwitch(ModelType.DEMO, tileSample)).toEqual({
      url: tileSample,
      tileServiceType: TileServiceType.XYZ,
      oamItemId: null,
    });
  });

  it("leaves the user's own imagery to the existing selection", () => {
    expect(
      imageryKeptOnModelSwitch(ModelType.IMAGERY, oamItemSample),
    ).toBeUndefined();
  });

  it("keeps nothing when there is no sample imagery", () => {
    expect(imageryKeptOnModelSwitch(ModelType.DEMO, undefined)).toBeUndefined();
  });
});
