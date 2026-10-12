import axios from "axios";

const LOGISTICS_BASE_URL =
  (process.env.NEXT_PUBLIC_LOGISTICS_API_URL || "https://logisticsapi.codevertexafrica.com/api/v1").replace(/\/$/, "");

const logisticsApi = axios.create({
  baseURL: LOGISTICS_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

logisticsApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("ordering.auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed?.session?.accessToken;
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
    const tenantId = localStorage.getItem("tenantId");
    if (tenantId) config.headers["X-Tenant-ID"] = tenantId;
    const tenantSlug = localStorage.getItem("tenantSlug");
    if (tenantSlug) config.headers["X-Tenant-Slug"] = tenantSlug;
  }
  return config;
});

/** A rider as logistics returns it (handlers.FleetMemberResponse): names and contact are top level. */
export interface FleetMember {
  id: string;
  user_id: string;
  fleet_id: string;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  average_rating: number;
  total_ratings: number;
}

/** Display name for a rider: full name, else email, else a short id. */
export function riderName(m: Pick<FleetMember, "first_name" | "last_name" | "email" | "id">): string {
  return `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || m.email || m.id.slice(0, 8);
}

/** Active riders of the tenant. Logistics answers with the shared pagination envelope ({data, total}). */
export async function listAvailableRiders(tenantSlug: string): Promise<FleetMember[]> {
  const res = await logisticsApi.get<{ data?: FleetMember[] }>(`/${tenantSlug}/fleet/members`, {
    params: { status: "active", limit: 100 },
  });
  return res.data?.data ?? [];
}

export async function assignRiderToTask(
  tenantSlug: string,
  logisticsTaskId: string,
  fleetMemberId: string
): Promise<void> {
  await logisticsApi.post(`/${tenantSlug}/tasks/${logisticsTaskId}/assign`, {
    fleet_member_id: fleetMemberId,
  });
}
