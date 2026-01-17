"use client";

import { SiteShell } from "@/components/layout/site-shell";
import { useParams } from "next/navigation";

export default function OutletPage() {
  const params = useParams();
  const outletId = params.id as string;

  return (
    <SiteShell>
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Outlet: {outletId}</h1>
          <p className="mt-2 text-muted-foreground">Coming soon...</p>
        </div>
      </div>
    </SiteShell>
  );
}
