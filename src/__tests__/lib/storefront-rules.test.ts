import { describe, expect, it } from "vitest";

import { brandThemeVariables, contrastWithWhite, parseHex, toHslTriplet } from "@/lib/brand-theme";
import { applyDeal, resolveDealItems, type Deal, type DealRule } from "@/lib/api/promo-deals";
import { getUseCaseCopy } from "@/lib/use-case-copy";
import { normalizeOrderingUseCase } from "@/lib/use-case-config";
import type { MenuItem } from "@/types/catalog";

describe("brandThemeVariables", () => {
  it("uses a dark tenant colour for buttons and the focus ring", () => {
    const vars = brandThemeVariables("#9B2C6B", "#C8963E");
    expect(vars["--brand-primary"]).toBe("155 44 107");
    expect(vars["--brand-emphasis"]).toBe("200 150 62");
    expect(vars["--primary"]).toBe("326 56% 39%");
    expect(vars["--ring"]).toBe(vars["--primary"]);
  });

  it("keeps the platform plum for buttons when white text would be unreadable", () => {
    const vars = brandThemeVariables("#F9E04B");
    expect(vars["--brand-primary"]).toBe("249 224 75");
    expect(vars["--primary"]).toBeUndefined();
  });

  it("ignores values that are not six-digit hex colours", () => {
    expect(brandThemeVariables("red", "#12")).toEqual({});
    expect(parseHex(undefined)).toBeNull();
  });

  it("matches the WCAG contrast and HSL conversions", () => {
    expect(contrastWithWhite([0, 0, 0])).toBeCloseTo(21, 0);
    expect(toHslTriplet([255, 255, 255])).toBe("0 0% 100%");
  });
});

describe("use case copy and layout", () => {
  it("gives restaurant words to restaurant-like values", () => {
    expect(getUseCaseCopy("restaurant").outletLabel).toBe(getUseCaseCopy("hospitality").outletLabel);
    expect(getUseCaseCopy("cafe").itemLabel).toBe(getUseCaseCopy("hospitality").itemLabel);
  });

  it("gives shop words to electronics and grocery stores", () => {
    expect(getUseCaseCopy("electronics").outletLabel).toBe(getUseCaseCopy("retail").outletLabel);
    expect(normalizeOrderingUseCase("grocery")).toBe("retail");
    expect(normalizeOrderingUseCase("supermarket")).toBe("retail");
  });

  it("keeps a value's own copy and falls back to the generic set", () => {
    expect(getUseCaseCopy("e_commerce")).not.toBe(getUseCaseCopy("other"));
    expect(getUseCaseCopy("axle_load_enforcement")).toBe(getUseCaseCopy("other"));
    expect(getUseCaseCopy(undefined)).toBe(getUseCaseCopy("other"));
  });
});

describe("resolveDealItems", () => {
  const item = (id: string, category: string, extra: Partial<MenuItem> = {}) =>
    ({ id, name: id, category, categoryId: `cat-${category}`, price: 100, ...extra }) as MenuItem;
  const deal = (scopeType: "item" | "category", scopeIds: string[], discountType: DealRule["discountType"] = "percentage"): Deal => ({
    id: `${scopeType}-${scopeIds.join()}`,
    name: "deal",
    startAt: "",
    endAt: null,
    isFlashSale: false,
    rule: { scopeType, scopeIds, discountType, discountValue: 20, maxDiscount: 0 },
  });

  it("matches item rules by SKU and category rules by category name, without case", () => {
    const items = [item("WIN-ASC-R", "Wines"), item("BRG-01", "Burgers"), item("SODA", "Drinks")];
    const pairs = resolveDealItems(items, [deal("item", ["win-asc-r"]), deal("category", ["burgers"])]);
    expect(pairs.map((p) => p.item.id)).toEqual(["WIN-ASC-R", "BRG-01"]);
  });

  it("still accepts inventory and category ids from older rules", () => {
    const items = [item("SKU-1", "Bags", { inventoryId: "uuid-1" }), item("SKU-2", "Shoes")];
    const pairs = resolveDealItems(items, [deal("item", ["uuid-1"]), deal("category", ["cat-Shoes"])]);
    expect(pairs.map((p) => p.item.id)).toEqual(["SKU-1", "SKU-2"]);
  });

  it("skips bogo rules, which have no single deal price", () => {
    expect(resolveDealItems([item("A", "X")], [deal("item", ["A"], "bogo")])).toEqual([]);
  });

  it("prices with the same rules the cards show", () => {
    expect(applyDeal(1000, { scopeType: "item", scopeIds: [], discountType: "percentage", discountValue: 25, maxDiscount: 0 })).toBe(750);
    expect(applyDeal(1000, { scopeType: "item", scopeIds: [], discountType: "percentage", discountValue: 50, maxDiscount: 200 })).toBe(800);
    expect(applyDeal(1000, { scopeType: "item", scopeIds: [], discountType: "fixed_price", discountValue: 699, maxDiscount: 0 })).toBe(699);
  });
});
