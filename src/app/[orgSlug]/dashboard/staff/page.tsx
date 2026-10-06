"use client";

import {
  CheckCircle2,
  ChefHat,
  ChevronDown,
  Clock,
  Loader2,
  Package,
  Search,
  Truck,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { PermissionActionButton } from "@/components/auth/permission-action-button";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SiteShell } from "@/components/layout/site-shell";
import { SubscriptionBanner } from "@/components/subscription/subscription-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  useAdminOrderCounts, useAdminOrders, useAssignRider, useAvailableRiders, useCancelAdminOrder,
  useUpdateOrderStatus, useDeleteAdminOrder, useVerifyOrderPayment,
} from "@/hooks/use-admin";
import { toast } from "@/lib/toast";
import { apiErrorMessage } from "@/lib/api/error-message";
import type { AdminOrder } from "@/lib/api/admin";
import { awaitingPaymentLabel } from "@/lib/payment-retry";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type StatusAction = { next: string; label: string; variant: "default" | "outline" };

const isDeliveryType = (t: string) => /deliver|scheduled/i.test(t);
const isManualMpesaOrder = (o: AdminOrder) => o.metadata?.payment_channel === "mpesa_manual";
/** Cash/M-Pesa on collection or delivery, or a customer-keyed M-Pesa payment: nothing online confirms it. */
const isOfflinePaid = (o: AdminOrder) =>
  o.paymentMethod === "cod" || o.paymentMethod === "cash" || isManualMpesaOrder(o);

/**
 * nextActions lists the status moves that make sense for this order right now. An order paid by
 * an online gateway is confirmed by the payment itself, so a pending one is simply waiting for the
 * customer to pay and must not be "accepted" (the kitchen would cook an unpaid order). A pickup
 * order ends with "Collected"; a delivery order leaves with a rider, never by a status button.
 */
function nextActions(order: AdminOrder): StatusAction[] {
  const delivery = isDeliveryType(order.fulfillmentType);
  switch (order.status) {
    case "pending":
      // Acceptable once paid, or straight away when paid later (cash / M-Pesa on collection or
      // delivery, or a customer-keyed M-Pesa code). Manual acceptance is the default policy.
      return isOfflinePaid(order) || order.paymentStatus === "paid"
        ? [{ next: "confirmed", label: "Accept order", variant: "default" }]
        : [];
    case "confirmed":
      return [{ next: "preparing", label: "Start preparing", variant: "default" }];
    case "preparing":
      return [{ next: "ready", label: delivery ? "Ready for the rider" : "Ready for pickup", variant: "default" }];
    case "ready":
      return delivery ? [] : [{ next: "completed", label: "Collected", variant: "default" }];
    default:
      return [];
  }
}

/**
 * A live order (offered to the outlet, in the kitchen, with a rider) is rejected, never deleted:
 * deleting would leave the POS card, kitchen tickets and rider job behind. The server enforces the
 * same rule; this only hides the button.
 */
function canDelete(order: AdminOrder): boolean {
  if (["cancelled", "refunded", "payment_timeout", "completed", "delivered"].includes(order.status)) return true;
  return order.status === "pending" && !order.metadata?.outlet_offered_at && !order.metadata?.outlet_handoff_at;
}

const RIDER_STATE: Record<string, string> = {
  rider_assigned: "Rider assigned",
  rider_accepted: "Rider accepted",
  en_route_pickup: "Rider heading to the outlet",
  arrived_pickup: "Rider at the outlet",
  picked_up: "Rider has the order",
  en_route_dropoff: "On the way to the customer",
  arrived_dropoff: "Rider at the customer",
  needs_rider: "Needs a new rider",
};

function statusBadgeVariant(status: string): "default" | "soft" | "outline" {
  switch (status) {
    case "pending":
      return "soft";
    case "confirmed":
    case "preparing":
      return "default";
    case "ready":
    case "out_for_delivery":
      return "outline";
    case "delivered":
    case "completed":
      return "default";
    case "cancelled":
    case "refunded":
      return "outline";
    default:
      return "soft";
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "pending":
      return <Clock className="size-3.5" />;
    case "confirmed":
      return <CheckCircle2 className="size-3.5" />;
    case "preparing":
      return <ChefHat className="size-3.5" />;
    case "ready":
      return <Package className="size-3.5" />;
    case "out_for_delivery":
      return <Truck className="size-3.5" />;
    case "delivered":
    case "completed":
      return <CheckCircle2 className="size-3.5" />;
    case "cancelled":
      return <XCircle className="size-3.5" />;
    default:
      return <Clock className="size-3.5" />;
  }
}

export default function StaffDashboardPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [riderPickerOrderId, setRiderPickerOrderId] = useState<string | null>(null);

  const limit = 50;
  const filters = {
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    limit,
    page,
  };

  const { data, isLoading } = useAdminOrders(filters);
  const { data: counts } = useAdminOrderCounts();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteAdminOrder();
  const assignRider = useAssignRider();
  const { data: availableRiders = [], isLoading: ridersLoading } = useAvailableRiders(riderPickerOrderId !== null);

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Card counts come from the server across every open order, not from the current page or tab.
  const pendingCount = counts?.pending ?? 0;
  const preparingCount = (counts?.confirmed ?? 0) + (counts?.preparing ?? 0);
  const readyCount = counts?.ready ?? 0;

  const handleStatusUpdate = useCallback(
    async (orderId: string, status: string) => {
      try {
        await updateStatus.mutateAsync({ orderId, status });
        toast.success(`Order status updated to ${status.replace(/_/g, " ")}`);
      } catch (e) {
        toast.error(await apiErrorMessage(e, "Failed to update order status"));
      }
    },
    [updateStatus],
  );

  const handleAssignRider = useCallback(
    async (orderId: string, fleetMemberId: string) => {
      try {
        await assignRider.mutateAsync({ orderId, fleetMemberId });
        toast.success("Rider assigned successfully");
        setRiderPickerOrderId(null);
      } catch (err) {
        toast.error(await apiErrorMessage(err, "Failed to assign rider"));
      }
    },
    [assignRider],
  );

  return (
    <RequireAuth roles={["staff", "admin", "superuser", "member"]} roleOperator="or">
      <SiteShell>
        <SubscriptionBanner />
        <div className="mx-auto w-full max-w-6xl px-4 py-6">
          {/* Header */}
          <header className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Staff Dashboard
            </p>
            <h1 className="text-2xl font-bold">Order Queue</h1>
            <p className="text-sm text-muted-foreground">
              Manage incoming orders and fulfillment workflow
            </p>
          </header>

          {/* Summary Cards */}
          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <MetricCard
              title="Pending"
              value={pendingCount}
              icon={<Clock className="size-4 text-amber-500" />}
            />
            <MetricCard
              title="Accepted / preparing"
              value={preparingCount}
              icon={<ChefHat className="size-4 text-blue-500" />}
            />
            <MetricCard
              title="Ready (pickup or rider)"
              value={readyCount}
              icon={<Package className="size-4 text-green-500" />}
            />
          </section>

          {/* Search + Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search by order number..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">{total} orders</p>
          </div>

          {/* Status Tabs */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Order List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <Package className="size-10 text-muted-foreground" />
                <p className="font-medium">No orders found</p>
                <p className="text-sm text-muted-foreground">
                  {statusFilter !== "all"
                    ? `No ${statusFilter.replace(/_/g, " ")} orders right now.`
                    : "Orders will appear here as customers place them."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={handleStatusUpdate}
                  onDelete={(id) => deleteOrder.mutate(id)}
                  isUpdating={updateStatus.isPending || deleteOrder.isPending || assignRider.isPending}
                  onAssignRider={handleAssignRider}
                  availableRiders={availableRiders}
                  ridersLoading={ridersLoading}
                  showRiderPicker={riderPickerOrderId === order.id}
                  onToggleRiderPicker={(id) => setRiderPickerOrderId(riderPickerOrderId === id ? null : id)}
                />
              ))}
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mt-6"
          />
        </div>
      </SiteShell>
    </RequireAuth>
  );
}

function OrderCard({
  order,
  onStatusUpdate,
  onDelete,
  isUpdating,
  onAssignRider,
  availableRiders,
  ridersLoading,
  showRiderPicker,
  onToggleRiderPicker,
}: {
  order: AdminOrder;
  onStatusUpdate: (orderId: string, status: string) => void;
  onDelete: (orderId: string) => void;
  isUpdating: boolean;
  onAssignRider: (orderId: string, fleetMemberId: string) => void;
  availableRiders: import("@/lib/api/logistics").FleetMember[];
  ridersLoading: boolean;
  showRiderPicker: boolean;
  onToggleRiderPicker: (orderId: string) => void;
}) {
  const isDeliveryOrder = isDeliveryType(order.fulfillmentType);
  const actions = nextActions(order);
  const [dialog, setDialog] = useState<"reject" | "verify" | "delete" | null>(null);
  const [reason, setReason] = useState("");
  const [mpesaCode, setMpesaCode] = useState(String(order.metadata?.mpesa_code ?? ""));
  const cancelOrder = useCancelAdminOrder();
  const verifyPayment = useVerifyOrderPayment();
  const needsPaymentCheck = isManualMpesaOrder(order) && order.paymentStatus !== "paid";
  const awaitingOnlinePayment = order.status === "pending" && !isOfflinePaid(order) && order.paymentStatus !== "paid";
  const canReject = ["pending", "confirmed", "preparing", "ready"].includes(order.status);
  const riderState = RIDER_STATE[String(order.metadata?.delivery_status ?? "")];

  const submitReject = async () => {
    try {
      await cancelOrder.mutateAsync({ orderId: order.id, reason: reason.trim() });
      toast.success(`Order #${order.orderNumber} rejected; the customer has been told`);
      setDialog(null);
    } catch (e) {
      toast.error(await apiErrorMessage(e, "Failed to reject the order"));
    }
  };
  const submitVerify = async () => {
    try {
      await verifyPayment.mutateAsync({ orderId: order.id, reference: mpesaCode });
      toast.success(`Payment for #${order.orderNumber} confirmed`);
      setDialog(null);
    } catch (e) {
      toast.error(await apiErrorMessage(e, "Could not confirm the payment"));
    }
  };
  const createdDate = new Date(order.createdAt);
  const minutesAgo = Math.round((Date.now() - createdDate.getTime()) / 60_000);
  const timeLabel =
    minutesAgo < 1
      ? "Just now"
      : minutesAgo < 60
        ? `${minutesAgo}m ago`
        : `${Math.round(minutesAgo / 60)}h ago`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              #{order.orderNumber}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {order.customerName || "—"} &middot; {timeLabel}
              {order.source === "guest" && (
                <span className="ml-1.5 inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">Guest</span>
              )}
              {order.channel && (
                <span className="ml-1 inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">{order.channel}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusBadgeVariant(order.status)}>
              <span className="mr-1 inline-flex">{statusIcon(order.status)}</span>
              {order.status.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {order.paymentMethod === "mpesa"
                ? "M-Pesa"
                : order.paymentMethod === "paystack"
                  ? "Paystack"
                  : order.paymentMethod === "wallet"
                    ? "Wallet"
                    : order.paymentMethod === "cod" || order.paymentMethod === "cash"
                      ? "COD"
                      : order.paymentMethod || "—"}{" "}
              &middot; {order.paymentStatus}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Item list */}
        <div className="mb-3 space-y-1">
          {(order.items ?? []).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span>
                <span className="text-muted-foreground">{item.quantity}x</span>{" "}
                {item.name}
              </span>
              <span className="font-medium">KES {item.totalPrice.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div>
            <span className="text-sm font-bold">
              KES {order.grandTotal.toLocaleString()}
            </span>
            {order.deliveryAddress && order.deliveryAddress !== "Pickup" && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Deliver to: {order.deliveryAddress}
              </p>
            )}
            {isDeliveryOrder && riderState && (
              <p className="mt-0.5 text-xs font-medium text-green-700 dark:text-green-400">{riderState}</p>
            )}
            {awaitingOnlinePayment && (
              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                {awaitingPaymentLabel(order.paymentRetry, Date.now()) ?? "Awaiting payment"}.{" "}
                It goes to the kitchen once paid.
                {order.paymentRetry?.attempts ? ` Failed attempts: ${order.paymentRetry.attempts}.` : ""}
              </p>
            )}
            {needsPaymentCheck && (
              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                M-Pesa code {String(order.metadata?.mpesa_code ?? "")}: confirm it before handing the order over.
              </p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            {actions.map((action) => (
              <Button
                key={action.next}
                size="sm"
                variant={action.variant}
                disabled={isUpdating}
                onClick={() => onStatusUpdate(order.id, action.next)}
              >
                {isUpdating ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
                {action.label}
              </Button>
            ))}

            {/* Assign Rider button: delivery orders at "ready" status */}
            {order.status === "ready" && isDeliveryOrder && (
              <div className="relative">
                <PermissionActionButton
                  permission="ordering.orders.manage"
                  disabled={isUpdating}
                  onClick={() => onToggleRiderPicker(order.id)}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                >
                  <UserCheck className="size-3.5" />
                  Assign Rider
                  <ChevronDown className="size-3" />
                </PermissionActionButton>
                {showRiderPicker && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-background shadow-lg">
                    {ridersLoading ? (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                        <Loader2 className="size-3 animate-spin" /> Loading riders…
                      </div>
                    ) : availableRiders.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">No available riders</p>
                    ) : (
                      availableRiders.map((rider) => {
                        const name = rider.edges?.user?.full_name || rider.edges?.user?.email || rider.id;
                        return (
                          <button
                            key={rider.id}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"
                            onClick={() => onAssignRider(order.id, rider.id)}
                          >
                            <UserCheck className="size-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{name}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}

            {needsPaymentCheck && (
              <PermissionActionButton
                permission="ordering.orders.manage"
                disabled={isUpdating}
                onClick={() => setDialog("verify")}
                className="inline-flex h-8 items-center justify-center rounded-md bg-amber-500 px-3 text-sm font-medium text-white hover:bg-amber-600 disabled:pointer-events-none disabled:opacity-50"
              >
                Confirm M-Pesa
              </PermissionActionButton>
            )}

            {canReject && (
              <PermissionActionButton
                permission="ordering.orders.manage"
                disabled={isUpdating}
                onClick={() => setDialog("reject")}
                className="inline-flex h-8 items-center justify-center rounded-md border border-input px-3 text-sm font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
              >
                Reject
              </PermissionActionButton>
            )}

            {canDelete(order) && (
              <PermissionActionButton
                permission="ordering.orders.delete"
                disabled={isUpdating}
                className="inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
                onClick={() => setDialog("delete")}
              >
                Delete
              </PermissionActionButton>
            )}
          </div>
        </div>
      </CardContent>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          {dialog === "reject" && (
            <>
              <DialogHeader>
                <DialogTitle>Reject order #{order.orderNumber}?</DialogTitle>
                <DialogDescription>
                  The customer is told why. A prepaid order is refunded to them.
                </DialogDescription>
              </DialogHeader>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. An item is out of stock" />
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>Back</Button>
                <Button onClick={submitReject} disabled={!reason.trim() || cancelOrder.isPending}>Reject order</Button>
              </DialogFooter>
            </>
          )}
          {dialog === "verify" && (
            <>
              <DialogHeader>
                <DialogTitle>Confirm M-Pesa payment</DialogTitle>
                <DialogDescription>
                  Find this code in the business M-Pesa messages and check the amount ({order.currency} {order.grandTotal.toLocaleString()}).
                </DialogDescription>
              </DialogHeader>
              <Input
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
                className="font-semibold tracking-widest"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog("reject")}>Not received</Button>
                <Button onClick={submitVerify} disabled={mpesaCode.length !== 10 || verifyPayment.isPending}>Payment received</Button>
              </DialogFooter>
            </>
          )}
          {dialog === "delete" && (
            <>
              <DialogHeader>
                <DialogTitle>Delete order #{order.orderNumber}?</DialogTitle>
                <DialogDescription>This cannot be undone. Use Reject to cancel an order the customer should hear about.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>Keep</Button>
                <Button
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => { onDelete(order.id); setDialog(null); }}
                >
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
