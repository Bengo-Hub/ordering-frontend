"use client";

import dynamic from "next/dynamic";
import type { LocationMapInnerProps } from "./location-map-inner";

const DynamicMap = dynamic(
  () => import("./location-map-inner").then((mod) => mod.LocationMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[240px] w-full items-center justify-center rounded-3xl border border-border bg-card text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  },
);

export function LocationMap(props: LocationMapInnerProps) {
  return <DynamicMap {...props} />;
}
