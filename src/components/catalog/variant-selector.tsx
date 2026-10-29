"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { CatalogVariant } from "@/types/catalog";

interface VariantSelectorProps {
  variants: CatalogVariant[];
  /** Currently selected variant id, or null when none chosen yet. */
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
  currency: string;
  /** Optional heading; defaults to "Choose an option". */
  label?: string;
}

/** Stock at or below this shows "Only N left" (real on-hand from inventory, never invented). */
const LOW_STOCK = 5;

/** Axis order shared with ordering-backend's variant names ("T-shirt, Red / M"): colour first,
 *  then size, then any other axis alphabetically. */
function axisRank(axis: string): number {
  const a = axis.toLowerCase();
  if (a === "colour" || a === "color") return 0;
  if (a === "size") return 1;
  return 2;
}

function orderedAxes(variants: CatalogVariant[]): string[] {
  const seen = new Set<string>();
  for (const v of variants) for (const k of Object.keys(v.attributes ?? {})) if (k) seen.add(k);
  return [...seen].sort((a, b) => axisRank(a) - axisRank(b) || a.localeCompare(b));
}

/** Format a variant's attributes as "Red / M" (falls back to the variant name). */
export function formatVariantAttributes(variant: CatalogVariant): string {
  const attrs = variant.attributes ?? {};
  const parts = orderedAxes([variant])
    .map((k) => attrs[k])
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : variant.name;
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** True when the variant carries every value in `want` (ignoring empty entries). */
function matches(v: CatalogVariant, want: Record<string, string>): boolean {
  return Object.entries(want).every(([k, val]) => !val || v.attributes?.[k] === val);
}

/**
 * Variant picker grouped by axis: one radio group per attribute (Colour, then Size, ...), the way
 * large stores present "Variation available". Picking a value selects the variant matching every
 * chosen value; a value with no variant for the other current choices is struck through but stays
 * clickable and jumps to the first variant that has it. Products whose variants carry no
 * attributes fall back to a single list of variant names. Raw SKUs are never shown.
 */
export function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
  currency,
  label = "Choose an option",
}: VariantSelectorProps) {
  const axes = useMemo(() => orderedAxes(variants), [variants]);
  const valuesByAxis = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const axis of axes) {
      out[axis] = [];
      for (const v of variants) {
        const val = v.attributes?.[axis];
        if (val && !out[axis].includes(val)) out[axis].push(val);
      }
    }
    return out;
  }, [axes, variants]);

  const selected = variants.find((v) => v.id === selectedVariantId) ?? null;
  // Choices made before a full combination exists (e.g. a colour picked, no size yet).
  const [partial, setPartial] = useState<Record<string, string>>({});
  const current: Record<string, string> = selected ? { ...selected.attributes } : partial;

  const choose = (id: string) => {
    setPartial({});
    onSelect(id);
  };

  const pick = (axis: string, value: string) => {
    const want = { ...current, [axis]: value };
    const compatible = variants.filter((v) => matches(v, want));
    const complete = axes.every((a) => want[a]);
    if (complete || selected) {
      // Every axis is set: take the exact match, else jump to the first variant with this value
      // (its other values change with it).
      const target = compatible[0] ?? variants.find((v) => v.attributes?.[axis] === value);
      if (target) choose(target.id);
      return;
    }
    if (compatible.length === 1 && compatible[0]) {
      choose(compatible[0].id);
      return;
    }
    setPartial(compatible.length > 0 ? want : { [axis]: value });
  };

  const onHand = selected?.onHand;
  const lowStock = onHand != null && onHand > 0 && onHand <= LOW_STOCK;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-foreground">
          {label}
          <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
            Required
          </span>
        </h3>
        {selected && (
          <span className="shrink-0 text-sm font-semibold text-foreground">
            {currency} {selected.price.toLocaleString()}
          </span>
        )}
      </div>

      {axes.length === 0 ? (
        <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
          {variants.map((v) => (
            <OptionButton
              key={v.id}
              checked={v.id === selectedVariantId}
              onClick={() => onSelect(v.id)}
            >
              {v.name}
            </OptionButton>
          ))}
        </div>
      ) : (
        axes.map((axis) => {
          const others = Object.fromEntries(Object.entries(current).filter(([k]) => k !== axis));
          return (
            <div key={axis} className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {titleCase(axis)}
                {current[axis] && (
                  <span className="ml-1 font-medium text-foreground">: {current[axis]}</span>
                )}
              </p>
              <div role="radiogroup" aria-label={titleCase(axis)} className="flex flex-wrap gap-2">
                {(valuesByAxis[axis] ?? []).map((value) => {
                  const offered = variants.some(
                    (v) => v.attributes?.[axis] === value && matches(v, others),
                  );
                  return (
                    <OptionButton
                      key={value}
                      checked={current[axis] === value}
                      unavailable={!offered}
                      onClick={() => pick(axis, value)}
                    >
                      {value}
                    </OptionButton>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {lowStock && (
        <p className="text-sm font-medium text-destructive" role="status">
          Only {onHand} left
        </p>
      )}
    </div>
  );
}

function OptionButton({
  checked,
  unavailable = false,
  onClick,
  children,
}: {
  checked: boolean;
  unavailable?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      className={cn(
        "min-h-11 min-w-11 rounded-lg border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        checked
          ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
          : "border-border text-foreground hover:border-primary/50",
        unavailable &&
          !checked &&
          "text-muted-foreground line-through decoration-muted-foreground/60",
      )}
    >
      {children}
    </button>
  );
}
