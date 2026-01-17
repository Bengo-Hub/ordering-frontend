import { SiteShell } from "@/components/layout/site-shell";

export async function generateStaticParams() {
  // Return empty array since outlets are dynamic
  // In production, fetch from API to get list of outlet IDs
  return [];
}

export default async function OutletPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id: outletId } = params;

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
