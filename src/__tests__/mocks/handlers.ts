import { http, HttpResponse } from "msw";

// ─── Menu Handlers ──────────────────────────────────────────────────────

const menuItems = {
  data: [
    {
      id: "item-1",
      name: "Caramel Latte",
      slug: "caramel-latte",
      description: "Smooth espresso with caramel",
      price: 450,
      currency: "KES",
      category: { id: "cat-1", name: "Hot Beverages" },
      image: "/images/latte.jpg",
      isAvailable: true,
      isFeatured: true,
    },
    {
      id: "item-2",
      name: "Caesar Salad",
      slug: "caesar-salad",
      description: "Fresh romaine with parmesan",
      price: 650,
      currency: "KES",
      category: { id: "cat-2", name: "Salads" },
      image: "/images/salad.jpg",
      isAvailable: true,
      isFeatured: false,
    },
  ],
  meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
};

const categories = [
  { id: "cat-1", name: "Hot Beverages", slug: "hot-beverages", itemCount: 10 },
  { id: "cat-2", name: "Salads", slug: "salads", itemCount: 5 },
  { id: "cat-3", name: "Pastries", slug: "pastries", itemCount: 8 },
];

const outlets = {
  data: [
    {
      id: "outlet-1",
      name: "Urban Loft Busia",
      slug: "urban-loft-busia",
      address: "Main Street, Busia",
      isOpen: true,
      rating: 4.5,
      deliveryFee: 150,
      deliveryTime: "25-35 min",
    },
  ],
  meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

// ─── Order Handlers ─────────────────────────────────────────────────────

const orders = {
  orders: [
    {
      id: "order-1",
      orderNumber: "ULC-001",
      status: "confirmed",
      items: [{ menuItemId: "item-1", name: "Caramel Latte", quantity: 2, unitPrice: 450, totalPrice: 900 }],
      subtotal: 900,
      deliveryFee: 150,
      discount: 0,
      grandTotal: 1050,
      currency: "KES",
      paymentMethod: "mpesa",
      paymentStatus: "paid",
      deliveryAddress: "123 Main St, Busia",
      createdAt: "2026-02-16T10:00:00Z",
      updatedAt: "2026-02-16T10:05:00Z",
    },
  ],
  total: 1,
};

const orderDetail = {
  id: "order-1",
  orderNumber: "ULC-001",
  status: "confirmed",
  items: [{ menuItemId: "item-1", name: "Caramel Latte", quantity: 2, unitPrice: 450, totalPrice: 900 }],
  subtotal: 900,
  deliveryFee: 150,
  discount: 0,
  grandTotal: 1050,
  currency: "KES",
  paymentMethod: "mpesa",
  paymentStatus: "paid",
  deliveryAddress: "123 Main St, Busia",
  createdAt: "2026-02-16T10:00:00Z",
  updatedAt: "2026-02-16T10:05:00Z",
};

// ─── Loyalty Handlers ───────────────────────────────────────────────────

const loyaltyAccount = {
  id: "loyalty-1",
  customerId: "user-1",
  tier: "silver",
  points: 1250,
  lifetimePoints: 3500,
  tierProgress: 62,
  nextTier: "gold",
  pointsToNextTier: 3750,
};

const loyaltyTransactions = {
  transactions: [
    { id: "lt-1", type: "earn", points: 90, description: "Order #ULC-001", createdAt: "2026-02-16T10:05:00Z" },
    { id: "lt-2", type: "redeem", points: -200, description: "Free coffee", createdAt: "2026-02-15T14:30:00Z" },
  ],
  total: 2,
  page: 1,
  limit: 20,
};

const tierBenefits = {
  tier: "silver",
  benefits: [
    { id: "b-1", name: "5% discount on all orders", description: "Applied automatically at checkout" },
    { id: "b-2", name: "Free delivery on orders over KES 1,500", description: "Delivery fee waived" },
  ],
};

// ─── All Handlers ───────────────────────────────────────────────────────

export const handlers = [
  // Catalog: backend returns { data, total, limit, page }
  http.get("*/catalog/items", () =>
    HttpResponse.json({
      data: menuItems.data.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        basePrice: i.price,
        currency: i.currency,
        categoryId: i.category?.id ?? "cat-1",
        categoryName: i.category?.name,
        imageUrl: i.image,
      })),
      total: menuItems.meta.total,
      limit: menuItems.meta.limit,
      page: menuItems.meta.page,
    }),
  ),
  http.get("*/catalog/items/:id", ({ params }) => {
    const item = menuItems.data.find((i) => i.id === params.id) ?? menuItems.data[0];
    return HttpResponse.json({
      id: item.id,
      name: item.name,
      description: item.description,
      basePrice: item.price,
      currency: item.currency,
      categoryId: item.category?.id ?? "cat-1",
      categoryName: item.category?.name,
      imageUrl: item.image,
    });
  }),
  http.get("*/catalog/categories", () => HttpResponse.json(categories)),
  http.get("*/catalog/categories/:id", ({ params }) =>
    HttpResponse.json(categories.find((c) => c.id === params.id) ?? categories[0]),
  ),
  // Outlets: backend returns { data, total, limit, page }
  http.get("*/outlets", () => HttpResponse.json(outlets)),
  http.get("*/outlets/:id", () => HttpResponse.json(outlets.data[0])),

  // Orders
  // ordering-backend lists orders as { data, total }
  http.get("*/orders", () => HttpResponse.json({ data: orders.orders, total: orders.total })),
  http.get("*/orders/:id", () => HttpResponse.json(orderDetail)),
  http.get("*/orders/:id/tracking", () =>
    HttpResponse.json({ status: "en_route", riderName: "John", eta: "15 min", updatedAt: "2026-02-16T10:15:00Z" }),
  ),
  http.post("*/orders", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...orderDetail, ...(body as object) }, { status: 201 });
  }),
  http.post("*/orders/:id/cancel", () => HttpResponse.json(null, { status: 204 })),

  // Payments
  http.post("*/payments/mpesa/stk-push", () =>
    HttpResponse.json({ id: "pi-1", status: "pending", paymentMethod: "mpesa", amount: 1050, currency: "KES" }),
  ),
  http.get("*/payments/intents/:id", () =>
    HttpResponse.json({ id: "pi-1", status: "completed", paymentMethod: "mpesa", amount: 1050, currency: "KES" }),
  ),
  http.post("*/promo-codes/validate", () =>
    HttpResponse.json({ valid: true, discountAmount: 100, errorMessage: "" }),
  ),

  // Loyalty
  http.get("*/loyalty/account", () => HttpResponse.json(loyaltyAccount)),
  http.get("*/loyalty/transactions", () => HttpResponse.json(loyaltyTransactions)),
  http.get("*/loyalty/tier-benefits", () => HttpResponse.json(tierBenefits)),

  // Tenant config and checkout payment options
  http.get("*/test-org/config", () => HttpResponse.json({})),
  http.get("*/payment-methods", () => HttpResponse.json(paymentMethods)),
  // Server cart preview: empty cart, so checkout computes the breakdown locally.
  http.get("*/cart/fee-breakdown", () => HttpResponse.json({ item_total: 0, delivery_fee: 0, grand_total: 0 })),

  // Logistics delivery areas, quotes and place names (logistics-api owns delivery pricing)
  http.get("*/zones/coverage", () => HttpResponse.json(deliveryCoverage)),
  http.get("*/zones/quote", () => HttpResponse.json(deliveryQuote)),
  http.get("*/routing/geocode/reverse", () => HttpResponse.json(reversePlace)),
  http.get("*/routing/geocode/search", () => HttpResponse.json([reversePlace])),
];

const paymentMethods = {
  gateways: [
    { type: "mpesa", name: "M-Pesa", icon: "mpesa", enabled: true },
    { type: "cod", name: "Pay on delivery", icon: "cash", enabled: true },
  ],
  wallet: null,
  saved_methods: [],
};

const deliveryCoverage = {
  zones: [
    { id: "z-town", name: "Busia Town", zone_type: "delivery", color: "#16a34a", fee: 0, free: true, boundary: [] },
    { id: "z-bugengi", name: "Bugengi", zone_type: "delivery", color: "#3b82f6", fee: 150, free: false, boundary: [] },
  ],
  outlets: [{ id: "outlet-1", name: "Urban Loft Busia", location: { lat: 0.4545662, lng: 34.1272854 } }],
  center: { lat: 0.4545662, lng: 34.1272854 },
  min_fee: 0,
  has_free_zone: true,
  currency: "KES",
};

const deliveryQuote = {
  serviceable: true,
  method: "zone",
  fee: 150,
  free: false,
  currency: "KES",
  zone: { id: "z-bugengi", name: "Bugengi" },
  distance_km: 4.2,
  eta_minutes: 32,
  min_order: 0,
  policy_version: "test",
};

const reversePlace = {
  name: "Bugengi Market",
  display_name: "Bugengi Market, Busia",
  location: { lat: 0.47, lng: 34.16 },
  source: "geocoder",
  area: { id: "z-bugengi", name: "Bugengi" },
  area_km: 0,
};

// Re-export mock data for assertions in tests
export const mockData = {
  menuItems,
  categories,
  outlets,
  orders,
  orderDetail,
  loyaltyAccount,
  loyaltyTransactions,
  tierBenefits,
  deliveryQuote,
  deliveryCoverage,
};
