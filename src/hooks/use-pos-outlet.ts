"use client";

import { useQuery } from "@tanstack/react-query";

import { serviceUrl } from "@/lib/service-urls";

/**
 * Facts the storefront needs from the store's POS outlet: the returns window and, for services
 * outlets, the service profile (printing_branding, salon_barber, ...). pos-api's public outlet
 * route takes the tenant UUID, so the slug is resolved through auth-api's public tenant record.
 */
export interface PosOutletInfo {
  id: string;
  name: string;
  useCase?: string;
  serviceProfile?: string;
  /** The trade's name and the steps a job goes through, from pos-api's profile registry. */
  serviceProfileLabel?: string;
  serviceStages?: string[];
  returnWindowDays?: number;
}

interface PosOutletRow {
  id: string;
  name: string;
  use_case?: string;
  service_profile?: string;
  service_profile_label?: string;
  service_stages?: string[];
  settings?: { return_window_days?: number };
}

const HOUR = 60 * 60 * 1000;

async function fetchPosOutlets(slug: string): Promise<PosOutletInfo[]> {
  const tenantRes = await fetch(`${serviceUrl("sso").replace(/\/+$/, "")}/api/v1/tenants/by-slug/${encodeURIComponent(slug)}`);
  if (!tenantRes.ok) return [];
  const tenant = (await tenantRes.json()) as { id?: string };
  if (!tenant.id) return [];
  const res = await fetch(`${serviceUrl("pos").replace(/\/+$/, "")}/api/v1/${tenant.id}/pos/outlets`);
  if (!res.ok) return [];
  const body = (await res.json()) as { data?: PosOutletRow[] };
  return (body.data ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    ...(o.use_case ? { useCase: o.use_case } : {}),
    ...(o.service_profile ? { serviceProfile: o.service_profile } : {}),
    ...(o.service_profile_label ? { serviceProfileLabel: o.service_profile_label } : {}),
    ...(o.service_stages?.length ? { serviceStages: o.service_stages } : {}),
    ...(o.settings?.return_window_days ? { returnWindowDays: o.settings.return_window_days } : {}),
  }));
}

/** All of a store's POS outlets (cached for an hour; they change rarely). */
export function usePosOutlets(slug: string | undefined) {
  return useQuery({
    queryKey: ["pos-outlets", slug],
    queryFn: () => fetchPosOutlets(slug!),
    enabled: !!slug,
    staleTime: HOUR,
    gcTime: 2 * HOUR,
  });
}

/** One POS outlet by id, else the store's first outlet. */
export function usePosOutlet(slug: string | undefined, outletId: string | null | undefined): PosOutletInfo | undefined {
  const { data } = usePosOutlets(slug);
  if (!data?.length) return undefined;
  return (outletId && data.find((o) => o.id === outletId)) || data[0];
}
