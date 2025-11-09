"use client";

import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  deltaLabel?: string;
  deltaValue?: string;
  icon?: ReactNode;
  footer?: ReactNode;
}

export function MetricCard({ title, value, deltaLabel, deltaValue, icon, footer }: MetricCardProps) {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon ?? null}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-3xl font-semibold text-foreground">{value}</div>
        {deltaLabel && deltaValue ? (
          <p className="text-xs text-muted-foreground">
            {deltaLabel} <span className="font-semibold text-brand-emphasis">{deltaValue}</span>
          </p>
        ) : null}
        {footer}
      </CardContent>
    </Card>
  );
}

