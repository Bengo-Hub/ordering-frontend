"use client";

import { Suspense, useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { GoogleIcon } from "@/components/icons/google";
import { Button } from "@/components/ui/button";
import { userHasRole } from "@/lib/auth/permissions";
import { useAuthStore } from "@/store/auth";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams?.get("code");
  const state = searchParams?.get("state");
  const oauthError = searchParams?.get("error");
  const completeGoogleOAuth = useAuthStore((state) => state.completeGoogleOAuth);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (oauthError) return;
    if (!code) {
      router.replace("/auth");
      return;
    }
    void completeGoogleOAuth({ code, state });
  }, [code, state, oauthError, completeGoogleOAuth, router]);

  useEffect(() => {
    if (status === "authenticated" && user) {
      const destination = userHasRole(user, ["staff", "admin", "superadmin"])
        ? "/dashboard/staff"
        : userHasRole(user, ["rider"])
          ? "/dashboard/rider"
          : userHasRole(user, ["customer"])
            ? "/dashboard/customer"
            : "/profile";
      router.replace(destination);
    }
  }, [status, user, router]);

  if (oauthError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <GoogleIcon className="size-8 text-destructive" />
        <h1 className="text-2xl font-semibold text-foreground">Google sign-in failed</h1>
        <p className="text-muted-foreground">
          {oauthError === "access_denied"
            ? "You denied the permissions requested by Google. Please try again."
            : "We were unable to complete your Google sign-in."}
        </p>
        <Button onClick={() => router.replace("/auth")} variant="outline">
          Return to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <GoogleIcon className="size-8 text-brand-emphasis" />
      <h1 className="text-2xl font-semibold text-foreground">Completing Google sign-in…</h1>
      <p className="text-muted-foreground">
        Hold on while we secure your session and apply your organization permissions.
      </p>
      <p className="text-xs text-muted-foreground">Status: {status}</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
