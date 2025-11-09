"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

import { BikeIcon, ShoppingBagIcon, UsersIcon } from "lucide-react";

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
    description: "Sign in to place and track orders. Google sign-in is supported.",
  },
  {
    id: "rider",
    label: "Rider",
    icon: <BikeIcon className="size-4" aria-hidden />,
    description: "Verified riders can use Google OAuth or email to access shifts.",
  },
  {
    id: "staff",
    label: "Staff portal",
    icon: <UsersIcon className="size-4" aria-hidden />,
    description: "Admins and staff sign in here with invitation credentials.",
  },
];

export default function AuthPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<AuthTab>("customer");
  const activeDescription = useMemo(
    () => tabs.find((tab) => tab.id === activeTab)?.description ?? "",
    [activeTab],
  );

  return (
    <SiteShell>
      <section className="border-b border-border bg-brand-surface/60 py-12">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 text-center">
          <h1 className="text-4xl font-semibold text-foreground md:text-5xl">Sign in</h1>
          <p className="text-base text-muted-foreground">
            {"Select the experience that matches your role. Customers and riders can use Google OAuth."}
          </p>
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
                    : "border-border text-muted-foreground hover:border-brand-emphasis hover:text-brand-emphasis  text-muted-foreground"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">{activeDescription}</p>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            {activeTab === "customer" ? <CustomerSignIn /> : null}
            {activeTab === "rider" ? <RiderSignIn /> : null}
            {activeTab === "staff" ? <StaffPortalSignIn /> : null}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function CustomerSignIn(): JSX.Element {
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    await loginWithEmail({ email, password, role: "customer" });
    router.push("/menu");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-card-foreground">Customer sign in</h2>
        <p className="text-sm text-muted-foreground">
          Use your email or continue with Google to place orders and track deliveries. New here?{" "}
          <Link href={{ pathname: "/customers/signup" }} className="font-semibold text-primary">
            Create an account
          </Link>
          .
        </p>
      </div>
      <Button variant="outline" className="w-full justify-center" onClick={() => loginWithGoogle("customer")}>
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
            placeholder="Your password"
            defaultValue="demo1234"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Sign in as customer
        </Button>
      </form>
    </div>
  );
}

function RiderSignIn(): JSX.Element {
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    await loginWithEmail({ email, password, role: "rider" });
    router.push("/");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-card-foreground">Rider sign in</h2>
        <p className="text-sm text-muted-foreground">
          Verified riders use Google OAuth or email credentials issued during onboarding. Need to apply?{" "}
          <Link href={{ pathname: "/riders/signup" }} className="font-semibold text-primary">
            Start rider onboarding
          </Link>
          .
        </p>
      </div>
      <Button variant="outline" className="w-full justify-center" onClick={() => loginWithGoogle("rider")}>
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
            placeholder="Your password"
            defaultValue="demo1234"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Sign in as rider
        </Button>
      </form>
    </div>
  );
}

function StaffPortalSignIn(): JSX.Element {
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail);
  const router = useRouter();
  const [role, setRole] = useState<"staff" | "admin">("staff");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const code = String(form.get("code") ?? "");
    await loginWithEmail({ email, password: code, role });
    router.push("/");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-card-foreground">Staff portal</h2>
        <p className="text-sm text-muted-foreground">
          Use your invitation email and one-time code shared by your administrator. Choose your role to load the right workspace.
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
        <Button type="submit" className="w-full">
          Sign in to staff portal
        </Button>
        <p className="text-xs text-muted-foreground">
          Need help? Contact your organization admin or use the in-app support channel after signing in.
        </p>
      </form>
    </div>
  );
}

