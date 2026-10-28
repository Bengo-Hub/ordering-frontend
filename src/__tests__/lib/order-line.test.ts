import { describe, expect, it } from "vitest";

import { normalizeOrder } from "@/lib/api/orders";
import { formatAttributes, formatDeliveryAddress, orderLineDetails, toOrderLineView } from "@/lib/order-line";

describe("order-line", () => {
  it("maps the backend line spelling to the view", () => {
    const line = toOrderLineView({
      inventorySku: "TSHIRT-RED-M",
      nameSnapshot: "T-shirt, Red / M",
      quantity: 2,
      unitPrice: 1200,
      totalPrice: 2400,
      metadata: { variant_attributes: { size: "M", colour: "Red" } },
    });
    expect(line.menuItemId).toBe("TSHIRT-RED-M");
    expect(line.name).toBe("T-shirt, Red / M");
    expect(line.variantLabel).toBeUndefined(); // the name already shows it
  });

  it("labels the variant and modifiers when the name does not show them", () => {
    const line = toOrderLineView(
      {
        nameSnapshot: "Burger",
        quantity: 1,
        unitPrice: 800,
        totalPrice: 850,
        metadata: {
          variant_attributes: { size: "Large" },
          modifiers: [
            { group_name: "Extras", option_name: "Extra cheese", price_adjustment: 50 },
            { group_name: "Cook", option_name: "Well done", price_adjustment: 0 },
          ],
        },
      },
      "KES",
    );
    expect(orderLineDetails(line)).toBe("Large, Extra cheese (+KES 50), Well done");
  });

  it("orders attributes colour first, then size", () => {
    expect(formatAttributes({ size: "M", colour: "Red", fit: "Slim" })).toBe("Red / M / Slim");
  });

  it("normalises the order: discount, address object, lines", () => {
    const order = normalizeOrder({
      id: "o1",
      currency: "KES",
      discountTotal: 100,
      deliveryAddress: { addressLine1: "Moi Avenue", city: "Nairobi" },
      items: [{ nameSnapshot: "Cap", inventorySku: "CAP", quantity: 1, unitPrice: 400, totalPrice: 400 }],
    });
    expect(order.discount).toBe(100);
    expect(order.deliveryAddress).toBe("Moi Avenue, Nairobi");
    expect(order.items[0]?.name).toBe("Cap");
    expect(formatDeliveryAddress(undefined)).toBe("");
  });
});
