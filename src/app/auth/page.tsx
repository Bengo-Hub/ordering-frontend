"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { BikeIcon, ShieldCheckIcon, ShoppingBagIcon, UsersIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { GoogleIcon } from "@/components/icons/google";
import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";

type AuthTab = "customer" | "rider" | "staff";

type TabConfig = {
  id: AuthTab;
  label: string;
  icon: ReactNode;
  description: string;
};

const tabs: TabConfig[] = [
  {
    id: "customer",
    label: "Customer",
    icon: <ShoppingBagIcon className="size-4" aria-hidden />,
    description: "Customers can place orders, manage saved addresses, and track deliveries.",
  },
  {
    id: "rider",
    label: "Rider",
    icon: <BikeIcon className="size-4" aria-hidden />,
    description: "Verified riders manage shifts, navigation, and proof-of-delivery from here.",
  },
  {
    id: "staff",
    label: "Staff portal",
    icon: <UsersIcon className="size-4" aria-hidden />,
    description: "Admins and invited staff access dashboards, loyalty, and support tooling.",
  },
];

export default function AuthPage(): JSX.Element {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as AuthTab | null) ?? "customer";
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const activeDescription = useMemo(
    () => tabs.find((tab) => tab.id === activeTab)?.description ?? "",
    [activeTab],
  );
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);

  return (
    <SiteShell>
      <section className="border-b border-border bg-brand-surface/60 py-12">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 text-center">
          <h1 className="flex items-center justify-center gap-2 text-4xl font-semibold text-foreground md:text-5xl">
            <ShieldCheckIcon className="size-8 text-brand-emphasis" aria-hidden />
            Sign in securely
          </h1>
          <p className="text-base text-muted-foreground">
            Select the experience that matches your role. Google OAuth flows redirect through our secure backend.
          </p>
          {error ? (
            <span className="text-sm font-medium text-destructive">
              {error}
            </span>
          ) : null}
        </div>
      </section>

      <section className="bg-background py-12">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "border-brand-emphasis bg-brand-emphasis/10 text-brand-emphasis"
                    : "border-border text-muted-foreground hover:border-brand-emphasis hover:text-brand-emphasis"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">{activeDescription}</p>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            {activeTab === "customer" ? <CustomerSignIn isLoading={status === "loading"} /> : null}
            {activeTab === "rider" ? <RiderSignIn isLoading={status === "loading"} /> : null}
            {activeTab === "staff" ? <StaffPortalSignIn isLoading={status === "loading"} /> : null}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

interface SignInProps {
  isLoading: boolean;
}

function CustomerSignIn({ isLoading }: SignInProps): JSX.Element {
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail);
  const beginGoogleOAuth = useAuthStore((s) => s.beginGoogleOAuth);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    await loginWithEmail({ email, password, role: "customer" });
    router.push("/dashboard/customer");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-card-foreground">Customer sign in</h2>
        <p className="text-sm text-muted-foreground">
          Use email or Google to access your saved addresses, loyalty balance, and order tracking.
          New here?{" "}
          <Link href={{ pathname: "/customers/signup" }} className="font-semibold text-primary">
            Create an account
          </Link>
          .
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center gap-2"
        onClick={() => beginGoogleOAuth({ role: "customer" })}
        disabled={isLoading}
      >
        <GoogleIcon className="size-4" />
        Continue with Google
      </Button>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="customerEmail" className="block text-xs font-semibold uppercase text-muted-foreground">
            Email
          </label>
          <Input
            id="customerEmail"
            name="email"
            type="email"
            placeholder="you@example.com"
            defaultValue="customer@demo.com"
            required
          />
        </div>
        <div>
          <label htmlFor="customerPassword" className="block text-xs font-semibold uppercase text-muted-foreground">
            Password
          </label>
          <Input
            id="customerPassword"
            name="password"
            type="password"
            placeholder="•••••••"
            defaultValue="demo1234"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          Sign in as customer
        </Button>
      </form>
    </div>
  );
}

function RiderSignIn({ isLoading }: SignInProps): JSX.Element {
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail);
  const beginGoogleOAuth = useAuthStore((s) => s.beginGoogleOAuth);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    await loginWithEmail({ email, password, role: "rider" });
    router.push("/dashboard/rider");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-card-foreground">Rider sign in</h2>
        <p className="text-sm text-muted-foreground">
          Use your onboarding credentials or Google account to manage assigned routes and delivery proof.
          Need to apply?{" "}
          <Link href={{ pathname: "/riders/signup" }} className="font-semibold text-primary">
            Start rider onboarding
          </Link>
          .
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center gap-2"
        onClick={() => beginGoogleOAuth({ role: "rider" })}
        disabled={isLoading}
      >
        <GoogleIcon className="size-4" />
        Continue with Google
      </Button>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="riderEmail" className="block text-xs font-semibold uppercase text-muted-foreground">
            Email
          </label>
          <Input
            id="riderEmail"
            name="email"
            type="email"
            placeholder="rider@example.com"
            defaultValue="rider@demo.com"
            required
          />
        </div>
        <div>
          <label htmlFor="riderPassword" className="block text-xs font-semibold uppercase text-muted-foreground">
            Password
          </label>
          <Input
            id="riderPassword"
            name="password"
            type="password"
            placeholder="•••••••"
            defaultValue="demo1234"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          Sign in as rider
        </Button>
      </form>
    </div>
  );
}

function StaffPortalSignIn({ isLoading }: SignInProps): JSX.Element {
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail);
  const router = useRouter();
  const [role, setRole] = useState<"staff" | "admin">("staff");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const code = String(form.get("code") ?? "");
    await loginWithEmail({ email, password: code, role });
    router.push("/dashboard/staff");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-card-foreground">Staff portal</h2>
        <p className="text-sm text-muted-foreground">
          Use your invitation email and one-time passcode shared by the superuser. Admin and merchant admin share the same role.
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="flex gap-3">
          <label
            className={`flex-1 cursor-pointer rounded-2xl border px-4 py-3 text-sm transition ${
              role === "staff"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            <input
              type="radio"
              name="portalRole"
              value="staff"
              checked={role === "staff"}
              onChange={() => setRole("staff")}
              className="hidden"
            />
            Staff
          </label>
          <label
            className={`flex-1 cursor-pointer rounded-2xl border px-4 py-3 text-sm transition ${
              role === "admin"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            <input
              type="radio"
              name="portalRole"
              value="admin"
              checked={role === "admin"}
              onChange={() => setRole("admin")}
              className="hidden"
            />
            Admin
          </label>
        </div>
        <div>
          <label htmlFor="staffEmail" className="block text-xs font-semibold uppercase text-muted-foreground">
            Email
          </label>
          <Input
            id="staffEmail"
            name="email"
            type="email"
            placeholder="staff@urbancafe.com"
            defaultValue="staff@demo.com"
            required
          />
        </div>
        <div>
          <label htmlFor="staffCode" className="block text-xs font-semibold uppercase text-muted-foreground">
            Invitation code
          </label>
          <Input
            id="staffCode"
            name="code"
            placeholder="6-digit code"
            defaultValue="123456"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          Sign in to staff portal
        </Button>
        <p className="text-xs text-muted-foreground">
          Need help? Contact Codevertex IT Solution via your admin workspace support channel.
        </p>
      </form>
    </div>
  );
}

