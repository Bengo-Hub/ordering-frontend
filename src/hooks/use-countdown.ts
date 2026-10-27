"use client";

import { useEffect, useState } from "react";

/**
 * Live-updating "time remaining until `endAt`" label, recomputed on an interval
 * (default 30s — flash-sale countdowns don't need second-level precision).
 * Returns null once the deadline has passed or when `endAt` is absent.
 */
export function useCountdown(endAt: string | null | undefined, intervalMs = 30_000): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!endAt) {
      setLabel(null);
      return;
    }
    const end = new Date(endAt).getTime();
    if (Number.isNaN(end)) {
      setLabel(null);
      return;
    }

    const tick = () => {
      const diffMs = end - Date.now();
      if (diffMs <= 0) {
        setLabel(null);
        return;
      }
      const totalMinutes = Math.floor(diffMs / 60_000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (hours > 0) {
        setLabel(`Ends in ${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setLabel(`Ends in ${minutes}m`);
      } else {
        setLabel("Ends soon");
      }
    };

    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [endAt, intervalMs]);

  return label;
}

export interface CountdownParts {
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Hours, minutes and seconds left until `endAt`, ticking every second, for a hero timer. Only
 * ever fed a promotion's real end_at; null when there is none or it has passed, so callers
 * render no timer rather than an invented one.
 */
export function useCountdownParts(endAt: string | null | undefined): CountdownParts | null {
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    const end = endAt ? new Date(endAt).getTime() : NaN;
    if (Number.isNaN(end)) {
      setParts(null);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      if (left === 0) {
        setParts(null);
        return;
      }
      setParts({ hours: Math.floor(left / 3600), minutes: Math.floor((left % 3600) / 60), seconds: left % 60 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endAt]);

  return parts;
}
