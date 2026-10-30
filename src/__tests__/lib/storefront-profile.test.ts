import { describe, expect, it } from "vitest";

import { retailKind } from "@/lib/storefront-profile";

// Category lists taken from live stores (2026-10-31).
const ALPHA = ["Home & Living", "Home Decor", "Party & Gifts", "Baby & Kids", "Cleaning & Household", "General Merchandise", "Holders & Organizers", "Fragrances & Air Care", "Confectionery & Snacks", "Tableware & Cutlery", "Apparel & Accessories", "Toys & Games", "Packaging", "Kitchen & Dining", "Bottles, Flasks & Drinkware", "Kitchenware & Cookware", "Small Appliances & Electronics", "Fashion & Accessories", "Bags & Luggage", "Footwear", "Watches & Fashion Accessories", "Food & Beverage", "Health & Beauty", "Personal Care & Cosmetics", "Electronics"];
const GRAM = ["Gaskets & Seals", "Fasteners & Fittings", "Adhesives & Sealants", "Lubricants & Oils", "Electricals", "Arm Bushes - Small", "Arm Bushes - Big", "Wipers", "Stabilizer Links - Big", "Bolts, Nuts & CV Joints", "Stabilizer Links - Small", "Bearings", "Grease", "Brakes", "Spark Plugs", "Air Filters", "Oil Filters", "Interior Care & Cleaners"];
const SMALL_STEPS = ["Home & Living", "Hair Extensions & Braids", "Hair Accessories & Tools", "Hair Care Products", "Nail Care", "Cleaning & Household", "Fragrances & Air Care", "Fashion & Accessories", "Watches & Fashion Accessories", "Food & Beverage", "Health & Beauty", "Personal Care & Cosmetics"];
const BOI = ["Home & Living", "Accessories", "MEMORY", "FLASH", "GAS COOKER", "Electronics & Entertainment", "SATELITE", "SPEAKERS", "TELEVISION", "WALLBRACKET", "Lighting & Power", "BULBS", "SMART PHONES", "FLOODLIGHT", "SOLARS", "EXTENSIONS", "SOUNDBAR", "PADS", "HAIR TRIMMER", "HAIR DRYER", "USB", "Baby & Kids", "CAMERA", "RADIOS", "SCALE"];

describe("retailKind", () => {
  it("reads the kind of shop from real category lists", () => {
    expect(retailKind(GRAM)).toBe("auto_parts");
    expect(retailKind(SMALL_STEPS)).toBe("beauty");
    expect(retailKind(BOI)).toBe("electronics");
  });

  it("leaves a general store general", () => {
    expect(retailKind(ALPHA)).toBeNull();
  });

  it("needs more than one stray category", () => {
    expect(retailKind(["Home", "Kitchen", "Bags", "Toys"])).toBeNull();
    expect(retailKind([])).toBeNull();
  });
});
