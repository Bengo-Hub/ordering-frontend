import { describe, expect, it } from "vitest";

import { orderAxes } from "@/lib/order-line";
import { variantCartFields } from "@/lib/variant-line";

describe("variantCartFields", () => {
  const item = { id: "TSHIRT", name: "T-shirt" };

  it("a plain product keeps its own id and name", () => {
    expect(variantCartFields(item, null)).toEqual({ id: "TSHIRT", name: "T-shirt", metadata: {} });
  });

  it("a variant line names the variant once and carries its SKU and keys", () => {
    const line = variantCartFields(item, {
      id: "v1",
      sku: "TSHIRT-RED-M",
      name: "T-shirt, Red / M",
      price: 1200,
      attributes: { size: "M", colour: "Red" },
    });
    expect(line.name).toBe("T-shirt, Red / M");
    expect(line.inventorySku).toBe("TSHIRT-RED-M");
    expect(line.id).toBe("TSHIRT::v1");
    expect(line.metadata).toMatchObject({ variant_id: "v1", variant_sku: "TSHIRT-RED-M" });
  });

  it("adds the product name when the variant name is only the option", () => {
    const line = variantCartFields(item, { id: "v2", sku: "S2", name: "Large", price: 1, attributes: { size: "L" } });
    expect(line.name).toBe("T-shirt, L");
  });

  it("orders axes colour, size, then the rest", () => {
    expect(orderAxes(["fit", "size", "colour"])).toEqual(["colour", "size", "fit"]);
  });
});
