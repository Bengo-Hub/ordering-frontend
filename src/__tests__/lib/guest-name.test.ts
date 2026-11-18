import { describe, expect, it } from "vitest";

import { GUEST_NAME_MESSAGES as M, guestNameError, normalizeGuestName } from "@/lib/guest-name";

describe("guestNameError", () => {
  it.each(["Wanjiku", "  Wanjiku   Kamau ", "O'Neil-Smith", "J. Otieno", "Ζωή", "Ng"])("accepts %s", (name) => {
    expect(guestNameError(name)).toBeNull();
  });

  it.each([
    ["   ", M.required],
    ["Customer", M.placeholder],
    ["A  customer", M.placeholder],
    ["MTEJA", M.placeholder],
    ["N/A", M.placeholder],
    ["aaaa", M.placeholder],
    ["X x X", M.placeholder],
    ["John2", M.characters],
    ["J", M.tooShort],
    ["J.", M.tooShort],
    ["Abcdefghij Abcdefghij Abcdefghij Abcdefghij Abcdefghij Abcdefghij", M.tooLong],
  ])("refuses %s", (name, message) => {
    expect(guestNameError(name)).toBe(message);
  });

  it("uses the store's own list when it has one", () => {
    expect(guestNameError("walk in", ["walk in"])).toBe(M.placeholder);
    expect(guestNameError("Customer", ["walk in"])).toBeNull();
  });

  it("folds spaces", () => {
    expect(normalizeGuestName("  Mary   Jane ")).toBe("Mary Jane");
  });
});
