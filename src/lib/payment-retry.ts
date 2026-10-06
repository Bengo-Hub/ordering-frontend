import type { PaymentRetryInfo } from "@/lib/api/orders";

/** Milliseconds left in the retry window (0 once it has closed or when unknown). */
export function retryMsLeft(info: PaymentRetryInfo | undefined, now: number): number {
  if (!info?.until) return 0;
  const until = Date.parse(info.until);
  if (Number.isNaN(until)) return 0;
  return Math.max(0, until - now);
}

/** Whether the customer can still retry: the server says open and the clock agrees. */
export function canRetryPayment(info: PaymentRetryInfo | undefined, now: number): boolean {
  return !!info?.open && retryMsLeft(info, now) > 0;
}

/** "12 min 05 s", "45 s", or "" once closed. */
export function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "";
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours} h ${String(minutes % 60).padStart(2, "0")} min`;
  }
  if (minutes === 0) return `${seconds} s`;
  return `${minutes} min ${String(seconds).padStart(2, "0")} s`;
}

/** "HH:MM" in the viewer's locale for the end of the window, "" when unknown. */
export function retryUntilClock(info: PaymentRetryInfo | undefined): string {
  if (!info?.until) return "";
  const d = new Date(info.until);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Staff label for an order still waiting for an online payment, or null when the order is not
 * waiting. Such an order can never be accepted until it is paid.
 */
export function awaitingPaymentLabel(info: PaymentRetryInfo | undefined, now: number): string | null {
  if (!info) return null;
  const clock = retryUntilClock(info);
  if (canRetryPayment(info, now) && clock) return `Awaiting payment (retry open until ${clock})`;
  return "Awaiting payment (retry window closed)";
}
