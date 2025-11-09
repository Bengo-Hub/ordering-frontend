type DateInput = string | number | Date;

const DEFAULT_DATETIME_FORMAT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

const RELATIVE_TIME_FORMAT = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatDateTime(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATETIME_FORMAT,
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-KE", options).format(date);
}

export function formatRelativeTime(value: DateInput): string {
  const date = value instanceof Date ? value : new Date(value);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["week", 1000 * 60 * 60 * 24 * 7],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ];

  for (const [unit, ms] of units) {
    const value = diffMs / ms;
    if (Math.abs(value) >= 1) {
      return RELATIVE_TIME_FORMAT.format(Math.round(value), unit);
    }
  }

  return "just now";
}
