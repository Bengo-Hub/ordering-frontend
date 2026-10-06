import { describe, expect, it } from "vitest";

import {
  awaitingPaymentLabel,
  canRetryPayment,
  formatTimeLeft,
  retryMsLeft,
} from "@/lib/payment-retry";

const until = "2026-10-06T12:30:00Z";
const untilMs = Date.parse(until);

describe("payment retry window", () => {
  it("counts down to the deadline and stops at zero", () => {
    const info = { open: true, until, attempts: 1, retries: 0 };
    expect(retryMsLeft(info, untilMs - 90_000)).toBe(90_000);
    expect(retryMsLeft(info, untilMs + 1)).toBe(0);
    expect(retryMsLeft(undefined, untilMs)).toBe(0);
    expect(retryMsLeft({ ...info, until: "soon" }, untilMs)).toBe(0);
  });

  it("allows a retry only while the server and the clock both say open", () => {
    const info = { open: true, until, attempts: 1, retries: 0 };
    expect(canRetryPayment(info, untilMs - 1000)).toBe(true);
    expect(canRetryPayment(info, untilMs + 1000)).toBe(false);
    expect(canRetryPayment({ ...info, open: false }, untilMs - 1000)).toBe(false);
  });

  it("formats the time left", () => {
    expect(formatTimeLeft(0)).toBe("");
    expect(formatTimeLeft(45_000)).toBe("45 s");
    expect(formatTimeLeft(12 * 60_000 + 5_000)).toBe("12 min 05 s");
    expect(formatTimeLeft(2 * 3_600_000 + 5 * 60_000)).toBe("2 h 05 min");
  });

  it("labels the order for staff", () => {
    const info = { open: true, until, attempts: 0, retries: 0 };
    expect(awaitingPaymentLabel(undefined, untilMs)).toBeNull();
    expect(awaitingPaymentLabel(info, untilMs - 60_000)).toMatch(/^Awaiting payment \(retry open until /);
    expect(awaitingPaymentLabel(info, untilMs + 60_000)).toBe("Awaiting payment (retry window closed)");
  });
});
