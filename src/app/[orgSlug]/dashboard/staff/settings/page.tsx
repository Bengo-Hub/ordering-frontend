"use client";

import { DeliveryAreasCard } from "@/components/delivery/delivery-areas-card";
import { GatewayManager } from "@/components/payments/gateway-manager";
import { FeeConfigCard } from "@/components/settings/fee-config-card";
import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Check,
  CreditCard,
  Globe,
  Link2,
  Loader2,
  Lock,
  Package,
  Pencil,
  Save,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  Smartphone,
  Mail,
} from "lucide-react";
import { useParams } from "next/navigation";

import { RequireAuth } from "@/components/auth/require-auth";
import { TenantLogo } from "@/components/layout/tenant-logo";
import { useBrandConfig } from "@/hooks/use-brand";
import {
  useAdminServiceConfig,
  useServiceConfig,
  useUpdateAdminServiceConfig,
  useUpdateServiceConfig,
} from "@/hooks/use-service-config";
import type { ServiceConfigItem } from "@/lib/api/settings";
import { useAuthStore } from "@/store/auth";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { apiErrorMessage } from "@/lib/api/error-message";
import { notificationsApi, subscriptionsApi } from "@/lib/api/platform-services";
import { serviceUrl } from "@/lib/service-urls";

// ── Types ────────────────────────────────────────────────────────────────────

interface AvailableProvider {
  id: string;
  channel: string;
  provider_name: string;
}

interface SelectedProviders {
  sms?: string;
  email?: string;
  push?: string;
}

interface Branding {
  from_email: string;
  from_name: string;
  logo_url: string;
}

type ActiveTab = "payments" | "notifications" | "subscription" | "integrations" | "configuration";

// ── App brand summary (from GET /api/v1/{tenant}/config) ──────────────────────

function AppBrandSummary() {
  const { data } = useBrandConfig();
  if (!data) return null;
  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardContent className="flex flex-wrap items-center gap-4 py-4">
        {data.logoUrl ? <TenantLogo src={data.logoUrl} alt="" className="h-10" /> : null}
        <div>
          <p className="text-sm font-medium text-muted-foreground">App brand (read-only)</p>
          <p className="text-lg font-bold">{data.name}</p>
          <p className="text-xs text-muted-foreground">
            Display name and theme colors come from tenant config. Notification branding (logo, from
            name) is editable in the Notifications tab.
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

// ── Main Component ───────────────────────────────────────────────────────────

export default function TenantSettingsPage() {
  const params = useParams();
  const tenantSlug = params.orgSlug as string;
  const [activeTab, setActiveTab] = useState<ActiveTab>("payments");

  const tabs: {
    key: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "subscription", label: "Add-ons", icon: Package },
    { key: "integrations", label: "Integrations", icon: Link2 },
    { key: "configuration", label: "Configuration", icon: SlidersHorizontal },
  ];

  return (
    <RequireAuth roles={["admin", "superuser"]} roleOperator="or">
      <>
        <div className="mx-auto w-full max-w-4xl">
          <header className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Organization Settings
            </p>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage payment gateways, notifications, and subscription add-ons
            </p>
          </header>

          <AppBrandSummary />

          {/* Tabs */}
          <div className="mb-6 flex flex-wrap gap-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "payments" && <PaymentSettingsTab tenantSlug={tenantSlug} />}
          {activeTab === "notifications" && <NotificationSettingsTab tenantSlug={tenantSlug} />}
          {activeTab === "subscription" && <SubscriptionAddonsTab tenantSlug={tenantSlug} />}
          {activeTab === "integrations" && <IntegrationsTab />}
          {activeTab === "configuration" && <ConfigurationTab />}
        </div>
      </>
    </RequireAuth>
  );
}

// ── Payment Settings ─────────────────────────────────────────────────────────

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

function PaymentSettingsTab({ tenantSlug: _tenantSlug }: { tenantSlug: string }) {
  return (
    <div className="space-y-6">
      <OrderAcceptanceCard />
      <GatewayManager emptyText="No payment gateways available. Ask the platform admin to configure gateways." />
    </div>
  );
}

// ── Notification Settings ────────────────────────────────────────────────────

function NotificationSettingsTab({ tenantSlug }: { tenantSlug: string }) {
  const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<SelectedProviders>({});
  const [branding, setBranding] = useState<Branding>({
    from_email: "",
    from_name: "",
    logo_url: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoadError(false);
    const [avRes, selRes, brandRes] = await Promise.allSettled([
      notificationsApi.get(`/api/v1/${tenantSlug}/providers/available`),
      notificationsApi.get(`/api/v1/${tenantSlug}/providers/selected`),
      notificationsApi.get(`/api/v1/${tenantSlug}/branding`),
    ]);
    if (avRes.status === "fulfilled") setAvailableProviders(avRes.value.data || []);
    if (selRes.status === "fulfilled") setSelectedProviders(selRes.value.data || {});
    if (brandRes.status === "fulfilled") setBranding(brandRes.value.data || branding);
    // Surface a clear error state instead of silently degrading to empty.
    if (
      avRes.status === "rejected" &&
      selRes.status === "rejected" &&
      brandRes.status === "rejected"
    ) {
      setLoadError(true);
    }
    setIsLoading(false);
  }, [tenantSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveBranding = async () => {
    setIsSaving(true);
    try {
      await notificationsApi.put(`/api/v1/${tenantSlug}/branding`, branding);
      toast.success("Branding updated");
    } catch (e) {
      toast.error(await apiErrorMessage(e, "Failed to update branding"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectProvider = async (channel: string, providerName: string) => {
    try {
      await notificationsApi.post(`/api/v1/${tenantSlug}/providers/select`, {
        channel,
        provider_name: providerName,
      });
      toast.success(`${channel.toUpperCase()} provider updated`);
      fetchData();
    } catch (e) {
      toast.error(await apiErrorMessage(e, "Failed to update provider"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group available providers by channel
  const byChannel = availableProviders.reduce<Record<string, AvailableProvider[]>>((acc, p) => {
    if (!acc[p.channel]) acc[p.channel] = [];
    acc[p.channel].push(p);
    return acc;
  }, {});

  const channelIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    sms: Smartphone,
    email: Mail,
    push: Bell,
  };

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load notification settings. Please retry or contact support if this persists.
        </div>
      )}
      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            Notification Providers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(byChannel).length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="mx-auto mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No notification providers available. Ask the platform admin to configure providers.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(byChannel).map(([channel, providers]) => {
                const Icon = channelIcons[channel] || Bell;
                const currentlySelected = selectedProviders[channel as keyof SelectedProviders];
                return (
                  <div key={channel}>
                    <div className="mb-3 flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" />
                      <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        {channel}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {providers.map((p) => {
                        const isActive = currentlySelected === p.provider_name;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectProvider(channel, p.provider_name)}
                            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                              isActive
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-muted-foreground/30"
                            }`}
                          >
                            {isActive && <Check className="mr-1 inline size-3" />}
                            {p.provider_name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Notification Branding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from-email">From Email</Label>
              <Input
                id="from-email"
                placeholder="orders@yourdomain.com"
                value={branding.from_email}
                onChange={(e) => setBranding({ ...branding, from_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-name">From Name</Label>
              <Input
                id="from-name"
                placeholder="Your Business Name"
                value={branding.from_name}
                onChange={(e) => setBranding({ ...branding, from_name: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input
                id="logo-url"
                placeholder="https://yourdomain.com/logo.png"
                value={branding.logo_url}
                onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
              />
            </div>
          </div>
          <Button className="mt-4" onClick={handleSaveBranding} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save Branding
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Subscription Add-ons ─────────────────────────────────────────────────────

/** A tenant's custom add-on as subscriptions-api returns it (GET /api/v1/custom-addons). */
interface CustomAddon {
  id: string;
  name: string;
  description?: string;
  billing_cycle?: string;
  unit_price_kes?: number;
  quantity?: number;
  status?: string;
}

const SUBSCRIPTIONS_UI_URL =
  process.env.NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL || "https://pricing.codevertexafrica.com";

/**
 * The tenant's add-ons, read only. subscriptions-api has no tenant subscribe/remove routes
 * (add-ons are set up by Codevertex; the tenant sees them at /custom-addons), so plan and
 * add-on changes link to the subscriptions app. This tab used to call /{slug}/addons/available,
 * /active, /subscribe and DELETE routes that never existed, so it only ever showed an error.
 */
function SubscriptionAddonsTab({ tenantSlug: _tenantSlug }: { tenantSlug: string }) {
  const [addons, setAddons] = useState<CustomAddon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    subscriptionsApi
      .get<{ data?: CustomAddon[] }>("/api/v1/custom-addons")
      .then((res) => {
        if (!cancelled) setAddons(res.data?.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Package className="size-5" />
          Add-ons on your plan
        </CardTitle>
        <Button asChild size="sm" variant="outline">
          <a href={`${SUBSCRIPTIONS_UI_URL}/plans`} target="_blank" rel="noopener noreferrer">
            Manage plan
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        {loadError ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Could not load your add-ons. Please try again, or open Manage plan.
          </p>
        ) : addons.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No add-ons on your plan. Open Manage plan to see what is available.
          </p>
        ) : (
          <ul className="space-y-3">
            {addons.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-4"
              >
                <div>
                  <p className="font-medium">{a.name}</p>
                  {a.description && (
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  )}
                </div>
                <div className="text-right text-sm">
                  {a.unit_price_kes != null && (
                    <p className="font-bold">
                      KES {(a.unit_price_kes * (a.quantity || 1)).toLocaleString()}
                      {a.billing_cycle ? ` / ${a.billing_cycle}` : ""}
                    </p>
                  )}
                  {a.status && (
                    <p className="text-xs capitalize text-muted-foreground">{a.status}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ── Integrations Settings ────────────────────────────────────────────────────

const AUTH_API_URL_DEFAULT = serviceUrl("sso");
const ORDERING_API_URL = serviceUrl("ordering");

function IntegrationsTab() {
  const [authApiUrl, setAuthApiUrl] = useState(AUTH_API_URL_DEFAULT);
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "ok" | "fail">("idle");

  const testAuthConnection = async () => {
    setTestStatus("loading");
    try {
      const res = await fetch(`${authApiUrl}/healthz`);
      setTestStatus(res.ok ? "ok" : "fail");
    } catch {
      setTestStatus("fail");
    }
  };

  // NOTE: CORS allowed-origins is configured at deploy time via the backend's
  // ALLOWED_ORIGINS env (router.New(..., allowedOrigins []string)), not via a
  // runtime tenant endpoint. The previous PUT /api/v1/admin/config/allowed_origins
  // call had no {tenant} segment and hit no real route (404), so the save control
  // is disabled until a real endpoint exists.

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-4 text-primary" />
            S2S Auth
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Auth-API URL</Label>
            <div className="flex gap-3">
              <Input
                value={authApiUrl}
                onChange={(e) => setAuthApiUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                onClick={testAuthConnection}
                disabled={testStatus === "loading"}
              >
                {testStatus === "loading" ? <Loader2 className="size-3.5 animate-spin" /> : "Test"}
              </Button>
            </div>
            {testStatus === "ok" && <p className="text-xs text-green-600">Connection successful</p>}
            {testStatus === "fail" && <p className="text-xs text-destructive">Connection failed</p>}
          </div>
          <div className="space-y-2">
            <Label>Ordering API URL (this service)</Label>
            <Input value={ORDERING_API_URL} readOnly className="cursor-not-allowed opacity-60" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="size-4 text-primary" />
            CORS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Allowed Origins</Label>
            <Input
              placeholder="https://app.example.com, https://admin.example.com"
              disabled
              readOnly
              className="cursor-not-allowed opacity-60"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of allowed CORS origins.
            </p>
          </div>
          <Button size="sm" disabled className="gap-2">
            <Save className="size-3.5" />
            Save
          </Button>
          <p className="text-xs text-muted-foreground">
            Editing CORS origins from the dashboard is not yet available — allowed origins are
            configured at deploy time on the server.
          </p>
        </CardContent>
      </Card>
    </div>
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
