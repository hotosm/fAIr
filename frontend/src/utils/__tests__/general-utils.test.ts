import * as utils from "../general-utils";
import { describe, expect, it } from "vitest";

describe("uuid4", () => {
  it("should generate a valid UUID4", () => {
    const uuid = utils.uuid4();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  });

  it("should generate unique UUIDs", () => {
    const uuid1 = utils.uuid4();
    const uuid2 = utils.uuid4();
    expect(uuid1).not.toBe(uuid2);
  });
});
