"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RequireAuth } from "@/components/auth/require-auth";
import { DeliveryAreasCard } from "@/components/delivery/delivery-areas-card";
import { TenantLogo } from "@/components/layout/tenant-logo";
import { FeeConfigCard } from "@/components/settings/fee-config-card";
import { LinkedAppsCard } from "@/components/settings/linked-apps-card";
import { useBrandConfig } from "@/hooks/use-brand";
import {
  useAdminServiceConfig,
  useServiceConfig,
  useUpdateAdminServiceConfig,
  useUpdateServiceConfig,
} from "@/hooks/use-service-config";
import { apiErrorMessage } from "@/lib/api/error-message";
import type { ServiceConfigItem } from "@/lib/api/settings";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/store/auth";
import { Check, Loader2, Lock, Pencil, Save, Settings, ShieldAlert } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// The online store's own settings: order acceptance, its fees and its service configuration.
// Payment methods, customer messages, menu, delivery and the plan belong to other apps and are
// linked from LinkedAppsCard, not copied here.

// ── App brand summary (from GET /api/v1/{tenant}/config) ──────────────────────

function AppBrandSummary() {
  const { data } = useBrandConfig();
  if (!data) return null;
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-wrap items-center gap-4 py-4">
        {data.logoUrl ? <TenantLogo src={data.logoUrl} alt="" className="h-10" /> : null}
        <div>
          <p className="text-sm font-medium text-muted-foreground">App brand (read-only)</p>
          <p className="text-lg font-bold">{data.name}</p>
          <p className="text-xs text-muted-foreground">
            Name, logo and colours come from your organisation profile (Accounts). Message branding
            is set in Notifications.
          </p>
        </div>
        {data.primaryColor ? (
          <div
            className="h-8 w-8 rounded-full border border-border"
            style={{ backgroundColor: data.primaryColor }}
            title="Primary color"
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

// ── Order acceptance ─────────────────────────────────────────────────────────

/**
 * OrderAcceptanceCard switches between manual acceptance (the default: staff accept every order in
 * the POS online-orders queue or here before the kitchen gets it) and automatic acceptance (an
 * order is confirmed as soon as it is paid, or placed with pay on delivery / at the counter).
 */
function OrderAcceptanceCard() {
  const { data: configs = [], isLoading } = useServiceConfig();
  const updateConfig = useUpdateServiceConfig();
  const current = configs.find((c) => c.configKey === "orders.auto_accept");
  const autoAccept = /^(true|1)$/i.test((current?.configValue ?? "false").replace(/"/g, "").trim());

  const setMode = (auto: boolean) => {
    updateConfig.mutate(
      { key: "orders.auto_accept", value: auto ? "true" : "false" },
      {
        onSuccess: () =>
          toast.success(
            auto ? "Orders will be accepted automatically" : "Staff will accept each order",
          ),
        onError: async (err) =>
          toast.error(await apiErrorMessage(err, "Failed to save order acceptance")),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="size-5" />
          Order acceptance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Loader2 className="size-5 animate-spin text-primary" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                auto: false,
                title: "Manual (recommended)",
                body: "Every order rings in the POS online orders queue. Staff accept it (or reject it with a reason) before the kitchen or packing starts.",
              },
              {
                auto: true,
                title: "Automatic",
                body: "Orders go straight to the kitchen once paid, or when placed with pay on delivery / at the counter. Staff can still reject.",
              },
            ].map((opt) => (
              <button
                key={String(opt.auto)}
                type="button"
                disabled={updateConfig.isPending}
                onClick={() => opt.auto !== autoAccept && setMode(opt.auto)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  opt.auto === autoAccept
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <p className="font-medium">{opt.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{opt.body}</p>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TenantSettingsPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  return (
    <RequireAuth roles={["admin", "superuser"]} roleOperator="or">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Organization Settings</p>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">How your online store takes orders, and its fees.</p>
        </header>

        <AppBrandSummary />
        <OrderAcceptanceCard />
        <ConfigurationTab />
        <LinkedAppsCard orgSlug={orgSlug} />
      </div>
    </RequireAuth>
  );
}

// ── Configuration (service-config store) ─────────────────────────────────────

// fee_config holds only the fees ordering owns. Delivery fees, areas and the distance
// rate are set in Logistics (see DeliveryAreasCard) and priced by its quote. Keys match
// ordering-backend's FeeConfig; percentages are stored as fractions (5% = 0.05).
function maskValue(item: ServiceConfigItem): string {
  if (item.isSecret) return "•••••";
  return item.configValue ?? "";
}

/** Generic edit dialog for a single (non-secret) service-config value. */
function EditConfigDialog({
  item,
  open,
  onOpenChange,
  admin,
}: {
  item: ServiceConfigItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: boolean;
}) {
  const updateTenant = useUpdateServiceConfig();
  const updateAdmin = useUpdateAdminServiceConfig();
  const mutation = admin ? updateAdmin : updateTenant;
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(item?.configValue ?? "");
  }, [item]);

  if (!item) return null;

  const handleSave = () => {
    mutation.mutate(
      { key: item.configKey, value },
      {
        onSettled: async (_data, error) => {
          if (error) {
            toast.error(await apiErrorMessage(error, `Failed to update ${item.configKey}`));
          } else {
            toast.success(`${item.configKey} updated`);
            onOpenChange(false);
          }
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit &ldquo;{item.configKey}&rdquo;</DialogTitle>
          <DialogDescription>
            {admin
              ? "Updating the platform default for this key."
              : "Updating the tenant override for this key."}
            {item.description ? ` ${item.description}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="config-value">Value ({item.configType})</Label>
          <Textarea
            id="config-value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Table of service-config items (tenant or platform). */
function ConfigTable({
  items,
  admin,
  onEdit,
}: {
  items: ServiceConfigItem[];
  admin: boolean;
  onEdit: (item: ServiceConfigItem) => void;
}) {
  return (
    <div className="divide-y rounded-lg border border-border">
      <div className="grid grid-cols-[1fr_auto_1.5fr_auto] gap-3 bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Key</span>
        <span>Type</span>
        <span>Value</span>
        <span className="sr-only">Actions</span>
      </div>
      {items.map((item) => (
        <div
          key={item.configKey}
          className="grid grid-cols-[1fr_auto_1.5fr_auto] items-center gap-3 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-medium">
              {item.isSecret && <Lock className="size-3 shrink-0 text-muted-foreground" />}
              {item.configKey}
              {item.isOverride && (
                <Badge variant="soft" className="ml-1 text-[10px]">
                  Override
                </Badge>
              )}
            </p>
            {item.description ? (
              <p className="truncate text-xs text-muted-foreground">{item.description}</p>
            ) : null}
          </div>
          <Badge variant="outline" className="text-[10px]">
            {item.configType}
          </Badge>
          <code className="truncate font-mono text-xs text-muted-foreground">
            {admin ? item.configValue : maskValue(item)}
          </code>
          <Button
            size="sm"
            variant="ghost"
            className="size-8 p-0"
            disabled={item.isSecret && !admin}
            onClick={() => onEdit(item)}
            title={
              item.isSecret && !admin
                ? "Secret values are masked and cannot be edited here"
                : "Override"
            }
          >
            <Pencil className="size-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function ConfigurationTab() {
  const user = useAuthStore((s) => s.user);
  const isSuperuser = !!(
    user?.is_platform_owner ||
    user?.isSuperUser ||
    user?.roles?.includes("superuser")
  );

  const { data: configs = [], isLoading } = useServiceConfig();
  const { data: adminConfigs = [], isLoading: isAdminLoading } = useAdminServiceConfig(isSuperuser);

  const [editItem, setEditItem] = useState<ServiceConfigItem | null>(null);
  const [editAdmin, setEditAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openEdit = (item: ServiceConfigItem, admin: boolean) => {
    setEditItem(item);
    setEditAdmin(admin);
    setDialogOpen(true);
  };

  const feeConfig = configs.find((c) => c.configKey === "fee_config");
  const otherConfigs = configs.filter((c) => c.configKey !== "fee_config");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DeliveryAreasCard />

      <FeeConfigCard scope="tenant" item={feeConfig} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Service Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {otherConfigs.length === 0 ? (
            <div className="py-8 text-center">
              <Settings className="mx-auto mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No service configuration values yet.</p>
            </div>
          ) : (
            <ConfigTable
              items={otherConfigs}
              admin={false}
              onEdit={(item) => openEdit(item, false)}
            />
          )}
        </CardContent>
      </Card>

      {isSuperuser && (
        <Card className="border-amber-300/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-amber-600" />
              Platform Defaults
              <Badge variant="outline" className="ml-1 text-[10px]">
                Superuser
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-xs text-muted-foreground">
              Platform-wide defaults with unmasked secrets. Changes here affect every tenant that
              has not set an override.
            </p>
            {isAdminLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : adminConfigs.length === 0 ? (
              <div className="py-8 text-center">
                <Settings className="mx-auto mb-2 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No platform default values.</p>
              </div>
            ) : (
              <ConfigTable items={adminConfigs} admin onEdit={(item) => openEdit(item, true)} />
            )}
          </CardContent>
        </Card>
      )}

      <EditConfigDialog
        item={editItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        admin={editAdmin}
      />
    </div>
  );
}
