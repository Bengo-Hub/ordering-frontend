"use client";

import { Loader2, Star } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getGoogleReviewUrl } from "@/lib/api/integrations";
import { orgRoute } from "@/lib/routes";

/**
 * /{business}/review/google sends the customer to the business's Google review page. WhatsApp
 * template buttons can only open the store's own domain, so the order messages' "Review us on
 * Google" button lands here and is forwarded to the link the business set (any Google review
 * link or Place ID, see the staff Google reviews page).
 */
export default function GoogleReviewRedirectPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getGoogleReviewUrl(orgSlug)
      .then((url) => {
        if (cancelled) return;
        if (url) window.location.replace(url);
        else setMissing(true);
      })
      .catch(() => !cancelled && setMissing(true));
    return () => {
      cancelled = true;
    };
  }, [orgSlug]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      {missing ? (
        <>
          <Star className="size-10 text-muted-foreground" />
          <p className="text-lg font-semibold">Thanks for wanting to review us</p>
          <p className="text-sm text-muted-foreground">Our Google review page is not available right now.</p>
          <Button asChild>
            <Link href={orgRoute(orgSlug, "/")}>Back to the store</Link>
          </Button>
        </>
      ) : (
        <>
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Opening our Google review page...</p>
        </>
      )}
    </div>
  );
}
