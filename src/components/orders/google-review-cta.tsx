"use client";

import { ExternalLink, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { getGoogleReviewUrl } from "@/lib/api/integrations";
import { cn } from "@/lib/utils";

/**
 * "Review us on Google" button for a delivered or completed order. It reads the
 * business's review link (service-config key `google_review_url`, set on the staff
 * integrations page) and renders nothing when the business has not set one.
 *
 * `variant="secondary"` is the quieter form shown under the rating form, so the
 * order's own rating stays the main ask.
 */
export function GoogleReviewCta({
  orgSlug,
  enabled = true,
  variant = "primary",
  className,
}: {
  orgSlug: string;
  enabled?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const { data: reviewUrl } = useQuery({
    queryKey: ["google-review-url", orgSlug],
    queryFn: () => getGoogleReviewUrl(orgSlug),
    enabled: enabled && !!orgSlug,
    staleTime: 5 * 60_000,
    retry: 0,
  });

  if (!reviewUrl || !reviewUrl.startsWith("https://")) return null;

  return (
    <Button
      asChild
      variant={variant === "primary" ? "default" : "outline"}
      className={cn("w-full gap-2", className)}
    >
      <a href={reviewUrl} target="_blank" rel="noopener noreferrer">
        <Star className="size-4 fill-current" />
        Review us on Google
        <ExternalLink className="size-4" />
      </a>
    </Button>
  );
}
