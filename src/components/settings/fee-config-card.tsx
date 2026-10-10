"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateAdminServiceConfig, useUpdateServiceConfig } from "@/hooks/use-service-config";
import { apiErrorMessage } from "@/lib/api/error-message";
import type { ServiceConfigItem } from "@/lib/api/settings";
import { toast } from "@/lib/toast";

// The one form for ordering's own fees (fee_config ServiceConfig). Delivery pricing is not
// here: logistics owns delivery areas and quotes. Percentages are stored as fractions.

export const FEE_CONFIG_FIELDS: { key: string; label: string; percent?: boolean }[] = [
  { key: "service_fee_percent", label: "Service fee (%)", percent: true },
  { key: "packaging_fee_flat", label: "Packaging fee (KES)" },
  { key: "small_order_fee", label: "Small-order fee (KES)" },
  { key: "small_order_threshold", label: "Small-order threshold (KES)" },
  { key: "delivery_discount_pct", label: "Delivery fee discount (%)", percent: true },
  { key: "free_delivery_minimum", label: "Free delivery from a basket of (KES, 0 = never)" },
];

type FeeConfigShape = Record<string, unknown>;

function parseFeeConfig(raw: string | undefined): FeeConfigShape {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as FeeConfigShape) : {};
  } catch {
    return {};
  }
}

/** Editable structured form for the fee_config key. */
export function FeeConfigCard({
  item,
  scope,
}: {
  item: ServiceConfigItem | undefined;
  /** tenant edits this tenant's override; platform edits the default every tenant inherits. */
  scope: "tenant" | "platform";
}) {
  const tenantUpdate = useUpdateServiceConfig();
  const platformUpdate = useUpdateAdminServiceConfig();
  const update = scope === "platform" ? platformUpdate : tenantUpdate;
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    const existing = parseFeeConfig(item?.configValue);
    const next: Record<string, string> = {};
    for (const f of FEE_CONFIG_FIELDS) {
      const v = existing[f.key];
      next[f.key] = v === undefined || v === null ? "" : String(f.percent ? Math.round(Number(v) * 10000) / 100 : v);
    }
    setFields(next);
  }, [item?.configValue]);

  const handleSave = () => {
    if (!confirm(scope === "platform" ? "Save the platform default order fees (applies to every tenant without its own)?" : "Save order fee configuration?")) return;
    // Preserve any keys we don't surface in the form, but drop the retired delivery-rate keys
    // (delivery pricing lives in Logistics now).
    const { delivery_fee_base: _base, delivery_fee_per_km: _perKm, packaging_fee: _oldPackaging, ...existing } =
      parseFeeConfig(item?.configValue);
    const value: FeeConfigShape = { ...existing };
    for (const f of FEE_CONFIG_FIELDS) {
      const raw = fields[f.key];
      if (raw === "" || raw === undefined) continue;
      const num = Number(raw);
      if (!Number.isFinite(num) || num < 0) continue;
      value[f.key] = f.percent ? num / 100 : num;
    }
    update.mutate(
      { key: "fee_config", value },
      {
        onSettled: async (_data, error) => {
          if (error) toast.error(await apiErrorMessage(error, "Failed to save fee configuration"));
          else toast.success("Fee configuration saved");
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="size-5" />
          {scope === "platform" ? "Default order fees (all tenants)" : "Order fees"}
          {item?.isOverride && (
            <Badge variant="soft" className="ml-1">
              Override
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEE_CONFIG_FIELDS.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label htmlFor={`fee-${f.key}`}>{f.label}</Label>
              <Input
                id={`fee-${f.key}`}
                type="number"
                min="0"
                step="any"
                value={fields[f.key] ?? ""}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <Button className="mt-4" onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Save className="size-4 mr-2" />
          )}
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  );
}

