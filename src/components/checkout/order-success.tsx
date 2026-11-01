"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";

interface OrderSuccessProps {
  /** The customer's own order page (status, collection or delivery code). */
  orderHref: string;
  /** False for pay on delivery or at the counter: nothing has been paid yet. */
  paid: boolean;
}

export function OrderSuccess({ orderHref, paid }: OrderSuccessProps) {
  const orgSlug = useOrgSlug();

  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircle2 className="size-10 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">Order placed</h2>
        <p className="mt-2 text-muted-foreground">
          {paid
            ? "Payment confirmed. Follow your order and find your collection or delivery code on the order page."
            : "You pay when you collect it or when it is delivered. Follow your order and find your collection or delivery code on the order page."}
        </p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <Button asChild className="w-full">
          <Link href={orderHref}>Track your order</Link>
        </Button>
        <Button variant="outline" asChild className="w-full">
          <Link href={orgRoute(orgSlug, "/catalog")}>Continue browsing</Link>
        </Button>
      </div>
    </div>
  );
}
