import { api } from "./base";

/**
 * A rider the staff queue can assign. ordering-backend answers GET /admin/riders from logistics'
 * service-to-service rider list, so staff need no logistics fleet permission (which would also
 * expose rider KYC data) and no direct browser call to logistics.
 */
export interface Rider {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  /** "staff" for salaried riders, "freelance" otherwise. */
  employment: string;
}

/** Display name for a rider: full name, else phone, else a short id. */
export function riderName(r: Pick<Rider, "first_name" | "last_name" | "phone" | "id">): string {
  return `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.phone || r.id.slice(0, 8);
}

/** Active riders of the tenant, from ordering-backend (orders.manage, same as assigning). */
export async function listAvailableRiders(tenantSlug: string): Promise<Rider[]> {
  const res = await api.get<{ data?: Rider[] }>(`${tenantSlug}/admin/riders`);
  return res.data?.data ?? [];
}
