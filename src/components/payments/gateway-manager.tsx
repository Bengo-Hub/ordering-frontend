"use client";

import { Check, CreditCard, Loader2, Settings, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAvailableGateways, useDeactivateGateway, useSelectGateway, useSelectedGateways } from "@/hooks/use-gateways";
import { apiErrorMessage } from "@/lib/api/error-message";
import { toast } from "@/lib/toast";

/**
 * Enable or disable the payment gateways an organisation takes payments with. One screen used by
 * both the tenant settings page and the platform page (platform owners hold config.manage), on
 * the shared gateway hooks through the ordering-backend payments proxy.
 */
export function GatewayManager({ emptyText }: { emptyText: string }) {
  const { data: available = [], isLoading: availableLoading } = useAvailableGateways();
  const { data: selected = [], isLoading: selectedLoading } = useSelectedGateways();
  const selectGateway = useSelectGateway();
  const deactivateGateway = useDeactivateGateway();
  // The row with a change in flight (its own spinner).
  const [pendingType, setPendingType] = useState<string | null>(null);

  const isLoading = availableLoading || selectedLoading;
  const selectedByType = new Map(selected.map((g) => [g.gateway_type, g]));
  const primary = selected.find((g) => g.is_primary && g.is_active);

  const handleEnable = (gatewayType: string) => {
    setPendingType(gatewayType);
    selectGateway.mutate(
      { gatewayType },
      {
        onSuccess: () => toast.success("Payment gateway enabled"),
        onError: async (err) => toast.error(await apiErrorMessage(err, "Failed to enable gateway")),
        onSettled: () => setPendingType(null),
      },
    );
  };

  const handleDisable = (gatewayType: string) => {
    setPendingType(gatewayType);
    deactivateGateway.mutate(gatewayType, {
      onSuccess: () => toast.success("Payment gateway disabled"),
      onError: async (err) => toast.error(await apiErrorMessage(err, "Failed to disable gateway")),
      onSettled: () => setPendingType(null),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="size-5" />
          Payment gateways
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : available.length === 0 ? (
          <div className="py-8 text-center">
            <Settings className="mx-auto mb-2 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          </div>
        ) : (
          <>
            {primary && (
              <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-medium text-muted-foreground">Primary gateway</p>
                <p className="text-lg font-bold">{primary.name}</p>
                <Badge variant="default" className="mt-1">
                  {primary.gateway_type.replace(/_/g, " ")}
                </Badge>
              </div>
            )}
            <div className="space-y-3">
              {available.map((gw) => {
                const sel = selectedByType.get(gw.gateway_type);
                const isEnabled = !!sel?.is_active;
                const isPrimary = !!sel?.is_primary && isEnabled;
                const isPending = pendingType === gw.gateway_type;
                return (
                  <div
                    key={gw.gateway_type}
                    className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                      isEnabled ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div>
                      <p className="flex items-center gap-2 font-medium">
                        {gw.name}
                        {isPrimary && (
                          <Badge variant="default" className="text-[10px]">
                            <Check className="mr-1 size-3" /> Primary
                          </Badge>
                        )}
                        {sel && (
                          <Badge variant={isEnabled ? "default" : "outline"} className="text-[10px]">
                            {sel.status || (isEnabled ? "active" : "inactive")}
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {gw.gateway_type.replace(/_/g, " ")}
                        {gw.transaction_fee_type && `, ${gw.transaction_fee_type.replace(/_/g, " ")} fee`}
                        {gw.supports_stk_push && ", STK push"}
                      </p>
                    </div>
                    {isEnabled ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        disabled={isPending}
                        onClick={() => handleDisable(gw.gateway_type)}
                      >
                        {isPending ? <Loader2 className="mr-1 size-3 animate-spin" /> : <X className="mr-1 size-3" />}
                        Disable
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleEnable(gw.gateway_type)}>
                        {isPending ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
                        Enable
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
