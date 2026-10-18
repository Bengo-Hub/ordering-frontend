import { describe, expect, it } from "vitest";

import { reachNote } from "@/lib/api/delivery";

describe("reachNote", () => {
  it("says how far deliveries go and how far a pin out of range is", () => {
    expect(reachNote({ furthest_area_km: 28.4, outlet_km: 62.2 })).toBe(
      "We deliver up to about 28 km from the outlet and this is about 62 km away.",
    );
  });

  it("stays silent inside the reach or when the distances are unknown", () => {
    expect(reachNote({ furthest_area_km: 28.4, outlet_km: 10 })).toBeNull();
    expect(reachNote({ furthest_area_km: 28.4, outlet_km: 28.4 })).toBeNull();
    expect(reachNote({})).toBeNull();
    expect(reachNote({ furthest_area_km: 0, outlet_km: 5 })).toBeNull();
  });
});
