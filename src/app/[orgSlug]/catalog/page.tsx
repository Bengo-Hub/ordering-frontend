import { SiteShell } from "@/components/layout/site-shell";

import { MenuDiscovery } from "@/components/catalog/catalog-discovery";

type CatalogPageProps = {
  searchParams: Promise<{
    category?: string;
    outlet?: string;
    search?: string;
    dietary?: string;
    item_id?: string;
    action?: string;
    sort?: string;
    filter?: string;
    brand?: string;
  }>;
};

// The catalog opens straight on the menu, like an app's menu screen: no marketing hero or
// feature cards (those belong on the landing page). MenuDiscovery owns the sticky app bar
// (title, search, menu sections) and the item list.
export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  return (
    <SiteShell>
      <div id="menu-browser">
        <MenuDiscovery
          initialCategory={params.category}
          initialOutlet={params.outlet}
          initialSearch={params.search}
          initialDietary={params.dietary?.split(",").filter(Boolean)}
          initialItemId={params.item_id}
          initialAction={params.action}
          initialSort={params.sort}
          initialFilter={params.filter}
          initialBrand={params.brand}
        />
      </div>
    </SiteShell>
  );
}
