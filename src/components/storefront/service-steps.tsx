"use client";

import { usePosOutlets } from "@/hooks/use-pos-outlet";

/**
 * "How it works" for a services store: the trade (Garage & Auto Service, Printing & Branding) and
 * the steps every job goes through, read from the store's POS outlet profile. Shown only when the
 * store has a trade profile with steps.
 */
export function ServiceSteps({ orgSlug }: { orgSlug: string }) {
  const { data } = usePosOutlets(orgSlug);
  const outlet = data?.find((o) => o.serviceStages?.length);
  if (!outlet?.serviceStages?.length) return null;

  return (
    <section aria-labelledby="service-steps-title" className="bg-background py-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-8">
        <h2 id="service-steps-title" className="text-lg font-bold text-foreground sm:text-xl">
          How it works
        </h2>
        {outlet.serviceProfileLabel && <p className="mt-1 text-sm text-muted-foreground">{outlet.serviceProfileLabel}</p>}
        <ol className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {outlet.serviceStages.map((stage, i) => (
            <li key={stage} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-muted text-sm font-bold text-brand-emphasis">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-foreground">{stage}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
