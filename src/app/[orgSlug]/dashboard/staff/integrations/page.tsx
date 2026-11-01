"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
  MapPin,
  MessageSquare,
  RefreshCw,
  Star,
  Trash2,
  Unplug,
} from "lucide-react";

import { RequireAuth } from "@/components/auth/require-auth";
import {
  useDisconnectGoogle,
  useGoogleConnect,
  useGoogleLocations,
  useGoogleReviews,
  useGoogleStatus,
  useRemoveGoogleReviewLink,
  useReplyToGoogleReview,
  useSaveGoogleReviewLink,
  useSelectGoogleLocation,
} from "@/hooks/use-google";
import {
  isSameLocation,
  starRatingToNumber,
  type GoogleLocation,
  type GoogleReview,
  type GoogleStatus,
} from "@/lib/api/google";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { apiErrorMessage } from "@/lib/api/error-message";

const PLACE_ID_FINDER =
  "https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder";

// ── Review link (works with or without the Google connection) ───────────────

function ReviewLinkCard({ status }: { status: GoogleStatus }) {
  const save = useSaveGoogleReviewLink();
  const remove = useRemoveGoogleReviewLink();
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(false);
  const link = status.review_link;
  const hasLink = !!link.review_url;
  const showForm = !hasLink || editing;

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) {
      toast.error("Paste your Google review link or Place ID.");
      return;
    }
    save.mutate(v, {
      onSuccess: () => {
        toast.success("Review link saved. Customers will see the button after their order.");
        setValue("");
        setEditing(false);
      },
      onError: async (err) =>
        toast.error(await apiErrorMessage(err, "That doesn't look like a Google review link.")),
    });
  };

  const handleRemove = () => {
    if (!confirm("Remove the review link? Customers will stop seeing the Review us on Google button.")) {
      return;
    }
    remove.mutate(undefined, {
      onSuccess: () => toast.success("Review link removed"),
      onError: async (err) => toast.error(await apiErrorMessage(err, "Failed to remove the link")),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <Star className="size-5" />
          Ask customers for Google reviews
          {hasLink ? (
            <Badge variant="soft" className="gap-1 text-[10px]">
              <CheckCircle2 className="size-3" /> On
            </Badge>
          ) : null}
        </CardTitle>
        <CardDescription>
          When an order is delivered or completed, customers see a{" "}
          <span className="font-medium text-foreground">Review us on Google</span> button on
          their order page and in the order email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasLink ? (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Customers are sent to
            </p>
            <p className="break-all text-sm">{link.review_url}</p>
            <p className="text-xs text-muted-foreground">
              {link.source === "google"
                ? "Set from your connected Google location."
                : "Added by your team."}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm" variant="outline">
                <a href={link.review_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Test the link
                </a>
              </Button>
              {!editing ? (
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                  <Link2 className="size-4" />
                  Change
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={remove.isPending}
                onClick={handleRemove}
              >
                {remove.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Remove
              </Button>
            </div>
          </div>
        ) : null}

        {showForm ? (
          <form onSubmit={handleSave} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="google-review-link">Google review link or Place ID</Label>
              <Input
                id="google-review-link"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="https://g.page/r/... or ChIJ..."
                autoComplete="off"
                inputMode="url"
              />
            </div>
            <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              <li>
                Open your Business Profile on Google (search your business name while signed in),
                choose <span className="font-medium">Ask for reviews</span> and copy the link.
              </li>
              <li>
                Or find your Place ID with{" "}
                <a
                  href={PLACE_ID_FINDER}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Google&apos;s Place ID finder
                </a>{" "}
                and paste it here.
              </li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Save link
              </Button>
              {editing ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setValue("");
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ── Google connection ──────────────────────────────────────────────────────────

function ConnectionCard({ status }: { status: GoogleStatus }) {
  const connect = useGoogleConnect();
  const disconnect = useDisconnectGoogle();

  const handleConnect = () => {
    connect.mutate(undefined, {
      onSuccess: (authUrl) => {
        if (authUrl) {
          window.location.href = authUrl;
        } else {
          toast.error("Could not start the Google connection.");
        }
      },
      onError: async (err) =>
        toast.error(await apiErrorMessage(err, "Could not start the Google connection.")),
    });
  };

  const handleDisconnect = () => {
    if (
      !confirm(
        "Disconnect Google? You won't see or answer reviews here any more. The review link for customers stays.",
      )
    ) {
      return;
    }
    disconnect.mutate(undefined, {
      onSuccess: () => toast.success("Google disconnected"),
      onError: async (err) => toast.error(await apiErrorMessage(err, "Failed to disconnect")),
    });
  };

  const title = (
    <CardTitle className="flex flex-wrap items-center gap-2">
      <MapPin className="size-5" />
      Read and answer reviews here
      {status.connected ? (
        <Badge variant="soft" className="gap-1 text-[10px]">
          <CheckCircle2 className="size-3" /> Connected
        </Badge>
      ) : null}
    </CardTitle>
  );

  // The platform has not set up the Google sign-in yet. Not a dead end: the review
  // link above already works.
  if (!status.configured) {
    return (
      <Card>
        <CardHeader>
          {title}
          <CardDescription>
            Connecting your Google account lets you read and reply to your Google reviews from
            this page. It isn&apos;t available yet; we&apos;ll switch it on once Google approves
            it. Your review link above works without it.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status.status === "reconnect") {
    return (
      <Card>
        <CardHeader>
          {title}
          <CardDescription className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
            Google access has expired. Connect again to keep reading and answering reviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button disabled={connect.isPending} onClick={handleConnect}>
            {connect.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Connect again
          </Button>
          <Button variant="ghost" disabled={disconnect.isPending} onClick={handleDisconnect}>
            Disconnect
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!status.linked) {
    return (
      <Card>
        <CardHeader>
          {title}
          <CardDescription>
            Sign in with the Google account that manages your Business Profile. You&apos;ll pick
            your business location next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full sm:w-auto" disabled={connect.isPending} onClick={handleConnect}>
            {connect.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MapPin className="size-4" />
            )}
            Connect Google
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        {title}
        <CardDescription>
          {status.connected
            ? "Your Google reviews show below."
            : "Google is linked. Choose your business location to see its reviews."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.connected ? (
          <p className="text-sm">
            <span className="text-muted-foreground">Location: </span>
            <span className="font-medium">{status.location_name || status.location_id}</span>
          </p>
        ) : null}
        <LocationPicker status={status} />
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={disconnect.isPending}
          onClick={handleDisconnect}
        >
          {disconnect.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Unplug className="size-4" />
          )}
          Disconnect Google
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Location picker ─────────────────────────────────────────────────────────────

function LocationPicker({ status }: { status: GoogleStatus }) {
  // Once a location is chosen the list folds away behind "Switch location".
  const [open, setOpen] = useState(!status.connected);
  const { data: locations = [], isLoading, isError, refetch } = useGoogleLocations(
    status.linked && open,
  );
  const select = useSelectGoogleLocation();
  const [selectingName, setSelectingName] = useState<string | null>(null);

  const handleSelect = (loc: GoogleLocation) => {
    setSelectingName(loc.name);
    select.mutate(
      {
        location_name: loc.name,
        place_id: loc.metadata.placeId,
        display_name: loc.title,
        new_review_uri: loc.metadata.newReviewUri,
      },
      {
        onSuccess: () => {
          toast.success(`Showing reviews for ${loc.title || "this location"}`);
          setOpen(false);
        },
        onError: async (err) => toast.error(await apiErrorMessage(err, "Failed to choose the location")),
        onSettled: () => setSelectingName(null),
      },
    );
  };

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <MapPin className="size-4" />
        Switch location
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Choose your business location</p>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="space-y-2 py-4 text-center">
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load your Google locations.
          </p>
          <Button size="sm" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : locations.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          This Google account doesn&apos;t manage any business location. Sign in with the account
          that owns your Business Profile.
        </p>
      ) : (
        locations.map((loc) => {
          const isCurrent = isSameLocation(loc.name, status.location_id);
          return (
            <div
              key={loc.name}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{loc.title || loc.name}</p>
                {loc.storeCode ? (
                  <p className="truncate text-xs text-muted-foreground">Store code {loc.storeCode}</p>
                ) : null}
              </div>
              {isCurrent ? (
                <Badge variant="soft" className="gap-1 text-[10px]">
                  <CheckCircle2 className="size-3" /> Chosen
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={selectingName !== null}
                  onClick={() => handleSelect(loc)}
                >
                  {selectingName === loc.name ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Choose
                </Button>
              )}
            </div>
          );
        })
      )}
      {status.connected ? (
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      ) : null}
    </div>
  );
}

// ── Reviews ──────────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={
            i <= Math.round(rating)
              ? "size-4 fill-yellow-400 text-yellow-400"
              : "size-4 text-muted-foreground/40"
          }
        />
      ))}
    </div>
  );
}

function ReviewRow({ review }: { review: GoogleReview }) {
  const reply = useReplyToGoogleReview();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const hasReply = !!review.reviewReply?.comment;

  const handleReply = () => {
    const comment = draft.trim();
    if (!comment) {
      toast.error("Write a reply first.");
      return;
    }
    reply.mutate(
      { reviewId: review.reviewId, comment },
      {
        onSuccess: () => {
          toast.success("Reply posted on Google");
          setDraft("");
          setEditing(false);
        },
        onError: async (err) => toast.error(await apiErrorMessage(err, "Failed to post the reply")),
      },
    );
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{review.reviewer.displayName || "A Google user"}</p>
        <span className="text-xs text-muted-foreground">
          {review.createTime ? new Date(review.createTime).toLocaleDateString() : ""}
        </span>
      </div>
      <div className="mt-1">
        <StarRating rating={starRatingToNumber(review.starRating)} />
      </div>
      {review.comment ? (
        <p className="mt-2 whitespace-pre-line break-words text-sm">{review.comment}</p>
      ) : (
        <p className="mt-2 text-sm italic text-muted-foreground">Stars only, no comment.</p>
      )}

      {hasReply && !editing ? (
        <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your reply
          </p>
          <p className="mt-1 whitespace-pre-line break-words text-sm">{review.reviewReply?.comment}</p>
          <Button
            size="sm"
            variant="ghost"
            className="mt-1 px-0"
            onClick={() => {
              setDraft(review.reviewReply?.comment ?? "");
              setEditing(true);
            }}
          >
            Edit reply
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <Textarea
            placeholder="Write a public reply. Everyone on Google can see it."
            value={draft}
            maxLength={4096}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={reply.isPending} onClick={handleReply}>
              {reply.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MessageSquare className="size-4" />
              )}
              {hasReply ? "Update reply" : "Reply"}
            </Button>
            {editing ? (
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewsSection() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGoogleReviews(true);
  const pages = data?.pages ?? [];
  const reviews = pages.flatMap((p) => p.reviews);
  const first = pages[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <MessageSquare className="size-5" />
          Google reviews
        </CardTitle>
        {first && first.total > 0 ? (
          <CardDescription className="flex flex-wrap items-center gap-2">
            <StarRating rating={first.averageRating} />
            <span>
              {first.averageRating.toFixed(1)} from {first.total} review
              {first.total === 1 ? "" : "s"}
            </span>
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="space-y-2 py-6 text-center">
            <p className="text-sm text-muted-foreground">Couldn&apos;t load your reviews.</p>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : reviews.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No Google reviews yet. They show up here as customers leave them.
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <ReviewRow key={r.reviewId || r.name} review={r} />
            ))}
            {hasNextPage ? (
              <Button
                variant="outline"
                className="w-full"
                disabled={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                {isFetchingNextPage ? <Loader2 className="size-4 animate-spin" /> : null}
                Show more reviews
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Content (inside RequireAuth) ────────────────────────────────────────────────

const CALLBACK_MESSAGES: Record<string, { ok: boolean; text: string }> = {
  connected: { ok: true, text: "Google connected" },
  denied: { ok: false, text: "Google connection was cancelled." },
  not_configured: { ok: false, text: "Connecting Google isn't available yet." },
};

function IntegrationsContent() {
  const { data: status, isLoading, isError, refetch } = useGoogleStatus();
  const searchParams = useSearchParams();
  const toastedRef = useRef(false);

  // The backend callback lands here with ?integration=google&status=<result>.
  useEffect(() => {
    if (toastedRef.current) return;
    if (searchParams.get("integration") !== "google") return;
    const result = searchParams.get("status");
    if (!result) return;
    toastedRef.current = true;
    const msg = CALLBACK_MESSAGES[result] ?? {
      ok: false,
      text: "Google connection failed. Please try again.",
    };
    if (msg.ok) toast.success(msg.text);
    else toast.error(msg.text);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !status) {
    return (
      <Card>
        <CardContent className="space-y-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">Couldn&apos;t load this page.</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ReviewLinkCard status={status} />
      <ConnectionCard status={status} />
      {status.connected ? <ReviewsSection /> : null}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function GoogleIntegrationsPage() {
  return (
    <RequireAuth
      roles={["admin", "superuser", "manager"]}
      permissions={["ordering.config.manage"]}
      permissionOperator="or"
    >
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Integrations
          </p>
          <h1 className="text-2xl font-bold">Google reviews</h1>
          <p className="text-sm text-muted-foreground">
            Get more Google reviews from your customers, and read and answer them here.
          </p>
        </header>

        <IntegrationsContent />
      </div>
    </RequireAuth>
  );
}
