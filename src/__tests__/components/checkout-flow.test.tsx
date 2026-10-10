import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";

import CheckoutPage from "@/app/[orgSlug]/checkout/page";
import { OrgSlugProvider } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { useDiningModeStore } from "@/store/dining-mode";
import { createTestQueryClient } from "../utils/test-wrapper";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  usePathname: () => "/test-org/checkout",
  useParams: () => ({ orgSlug: "test-org" }),
}));

// Mock SiteShell to simplify rendering
vi.mock("@/components/layout/site-shell", () => ({
  SiteShell: ({ children }: { children: React.ReactNode }) => <div data-testid="site-shell">{children}</div>,
}));

// The map is WebGL; jsdom cannot render it.
vi.mock("@bengo-hub/maps", () => ({
  LocationPicker: () => <div data-testid="location-picker" />,
}));

// Mock toast
vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderCheckout() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <OrgSlugProvider orgSlug="test-org">
        <CheckoutPage />
      </OrgSlugProvider>
    </QueryClientProvider>,
  );
}

describe("CheckoutPage", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    useDiningModeStore.getState().reset();
    useAuthStore.setState({ user: null, status: "idle" });
  });

  it("asks guests how they want to check out", () => {
    useAuthStore.setState({ status: "idle", user: null });
    useCartStore.setState({
      items: [{ id: "item-1", name: "Latte", quantity: 1, price: 350, total: 350 }],
    });

    renderCheckout();

    expect(screen.getByText("How would you like to checkout?")).toBeInTheDocument();
    expect(screen.getByText("Continue as Guest")).toBeInTheDocument();
  });

  it("shows empty cart message when authenticated with no items", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "u1", email: "test@test.com", name: "Test" } as never,
    });

    renderCheckout();

    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(screen.getByText(/Add some items before/)).toBeInTheDocument();
  });

  it("renders order summary with cart items", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "u1", email: "test@test.com", name: "Test" } as never,
    });
    useCartStore.setState({
      items: [
        { id: "item-1", name: "Caramel Latte", quantity: 2, price: 450, total: 900 },
        { id: "item-2", name: "Caesar Salad", quantity: 1, price: 650, total: 650 },
      ],
    });

    renderCheckout();

    expect(screen.getByText("Caramel Latte")).toBeInTheDocument();
    expect(screen.getByText("Caesar Salad")).toBeInTheDocument();
    expect(screen.getByText("Order Summary")).toBeInTheDocument();
  });

  it("prices delivery from the logistics quote for the preselected location", async () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "u1", email: "test@test.com", name: "Test" } as never,
    });
    useCartStore.setState({
      items: [{ id: "item-1", name: "Latte", quantity: 1, price: 350, total: 350, outletId: "outlet-1" } as never],
    });
    useDiningModeStore.setState({
      mode: "delivery",
      deliveryLocation: { address: "Bugengi Market", latitude: 0.47, longitude: 34.16, placeName: "Bugengi Market" },
    });

    renderCheckout();

    // The quote (KES 150 for the Bugengi area) shows on the location card and the delivery option.
    expect(await screen.findByText("KES 150 · Bugengi")).toBeInTheDocument();
    expect(await screen.findAllByText("KES 150")).not.toHaveLength(0);
  });

  it("shows no delivery charge for pickup", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "u1", email: "test@test.com", name: "Test" } as never,
    });
    useCartStore.setState({
      items: [{ id: "item-1", name: "Latte", quantity: 1, price: 350, total: 350 }],
    });
    useDiningModeStore.setState({ mode: "pickup" });

    renderCheckout();

    expect(screen.getAllByText("KES 0").length).toBeGreaterThan(0);
  });

  it("offers the outlet's payment options", async () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "u1", email: "test@test.com", name: "Test" } as never,
    });
    useCartStore.setState({
      items: [{ id: "item-1", name: "Latte", quantity: 1, price: 350, total: 350 }],
    });

    renderCheckout();

    expect(await screen.findByText("Pay now — M-Pesa (STK)")).toBeInTheDocument();
    expect(await screen.findByText("Pay on delivery")).toBeInTheDocument();
  });
});
