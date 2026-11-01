import { describe, expect, it } from "vitest";

import { listFrom } from "@/lib/api/list";

describe("listFrom", () => {
  it("returns a bare array unchanged", () => {
    expect(listFrom([1, 2], "data")).toEqual([1, 2]);
  });

  it("unwraps the named envelope key", () => {
    expect(listFrom({ data: [{ id: 1 }] }, "data")).toEqual([{ id: 1 }]);
    expect(listFrom({ roles: ["admin"] }, "roles")).toEqual(["admin"]);
  });

  it("gives an empty array for a Go nil slice", () => {
    // The analytics dashboards route answered { data: null } with no dashboards configured,
    // and the page crashed spreading the object.
    expect(listFrom({ data: null }, "data")).toEqual([]);
  });

  it("gives an empty array for objects, null and undefined", () => {
    expect(listFrom({ code: "feature_disabled", upgrade: true }, "data")).toEqual([]);
    expect(listFrom(null, "data")).toEqual([]);
    expect(listFrom(undefined)).toEqual([]);
  });

  it("tries keys in order", () => {
    expect(listFrom({ addresses: ["a"] }, "data", "addresses")).toEqual(["a"]);
  });
});
