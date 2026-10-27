"use client";

import { useCountdownParts } from "@/hooks/use-countdown";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Hours, minutes and seconds to a promotion's real end time, as three boxes on the dark hero.
 * Renders nothing when there is no end time or it has passed.
 */
export function CountdownBoxes({ endAt }: { endAt: string | null | undefined }) {
  const parts = useCountdownParts(endAt);
  if (!parts) return null;
  const cells: [number, string][] = [
    [parts.hours, "hours"],
    [parts.minutes, "min"],
    [parts.seconds, "sec"],
  ];
  return (
    <div className="flex gap-2" role="timer" aria-label={`Ends in ${parts.hours} hours ${parts.minutes} minutes`}>
      {cells.map(([value, label]) => (
        <span
          key={label}
          className="min-w-[3.5rem] rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 text-center"
        >
          <span className="font-display tabular block text-xl font-extrabold leading-tight">{pad(value)}</span>
          <span className="block text-[10px] font-semibold text-white/75">{label}</span>
        </span>
      ))}
    </div>
  );
}

/** "Ends in 02:14:36" as plain text, for a section pill. */
export function CountdownText({ endAt }: { endAt: string | null | undefined }) {
  const parts = useCountdownParts(endAt);
  if (!parts) return null;
  return (
    <span className="tabular">
      Ends in {pad(parts.hours)}:{pad(parts.minutes)}:{pad(parts.seconds)}
    </span>
  );
}
