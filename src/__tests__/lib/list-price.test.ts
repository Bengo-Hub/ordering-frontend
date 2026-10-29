import { describe, expect, it } from "vitest";

import {
  formatListPrice,
  formatMoney,
  formatPriceRange,
  hasPriceRange,
  listPrice,
} from "@/lib/list-price";

describe("list-price", () => {
  const ranged = { price: 0, priceFrom: 900, priceTo: 1100 };
  const flat = { price: 450 };
  const samePrice = { price: 0, priceFrom: 700, priceTo: 700 };

  it("lists a ranged product at its lowest variant price", () => {
    expect(listPrice(ranged)).toBe(900);
    expect(listPrice(flat)).toBe(450);
  });

  it("says From only when variants differ in price", () => {
    expect(hasPriceRange(ranged)).toBe(true);
    expect(hasPriceRange(samePrice)).toBe(false);
    expect(formatListPrice(ranged, "KES")).toBe("From KES 900");
    expect(formatListPrice(samePrice, "KES")).toBe("KES 700");
    expect(formatListPrice(flat)).toBe("KES 450");
  });

  it("shows the full range on the product page", () => {
    expect(formatPriceRange(ranged, "KES")).toBe("KES 900 - KES 1,100");
    expect(formatPriceRange(flat, "KES")).toBe("KES 450");
  });

  it("rounds money to whole units", () => {
    expect(formatMoney("KES", 1249.6)).toBe("KES 1,250");
  });
});
