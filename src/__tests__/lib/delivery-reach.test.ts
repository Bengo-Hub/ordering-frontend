import { describe, expect, it } from "vitest";

import { reachNote } from "@/lib/api/delivery";

describe("reachNote", () => {
  it("says which way a pin lies and how far it is from our delivery routes", () => {
    expect(
      reachNote({ route_area: { id: "z", name: "Malaba" }, route_off_km: 49.6, direction: "south", outlet_km: 62.2 }),
    ).toBe("This is about 62 km south of the outlet, 50 km away from our nearest delivery route (towards Malaba).");
  });

  it("stays silent when the route details are unknown", () => {
    expect(reachNote({})).toBeNull();
    expect(reachNote({ route_off_km: 5, direction: "south", outlet_km: 9 })).toBeNull();
    expect(reachNote({ route_area: { id: "z", name: "Malaba" }, route_off_km: 0, direction: "south", outlet_km: 9 })).toBeNull();
  });
});
