import { describe, expect, it } from "vitest";

import { listingDeliveryFee } from "@/lib/api/catalog";

describe("listingDeliveryFee", () => {
  it("uses the quote when the customer's pin is known", () => {
    expect(listingDeliveryFee({ delivery_fee: 150, deliverable: true })).toBe("150");
    expect(listingDeliveryFee({ delivery_fee: 0, deliverable: true })).toBe("free");
    expect(listingDeliveryFee({ delivery_fee: 0, deliverable: false })).toBe("not-deliverable");
  });

  it("shows a starting price without a pin", () => {
    expect(listingDeliveryFee({ delivery_fee: 100 })).toBe("from 100");
    expect(listingDeliveryFee({ delivery_fee: 0 })).toBe("free-nearby");
  });

  it("shows nothing when logistics gave no delivery details", () => {
    expect(listingDeliveryFee({})).toBe("");
  });
});
