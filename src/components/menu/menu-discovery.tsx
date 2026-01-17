"use client";

import { useMemo, useState } from "react";

import {
  ChefHatIcon,
  FilterIcon,
  SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  SproutIcon,
  WheatIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useCartStore } from "@/store/cart";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DietaryTag = "vegan" | "vegetarian" | "glutenFree" | "spicy" | "chefSpecial";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceValue: number; // numeric value for cart
  category: string;
  dietary: DietaryTag[];
  feature?: "recommended" | "new";
  outletId?: string;
  outletName?: string;
};

const dietaryFilters: Array<{ value: DietaryTag; label: string; icon: React.ReactNode }> = [
  { value: "vegan", label: "Vegan", icon: <SproutIcon className="size-4" aria-hidden /> },
  { value: "vegetarian", label: "Vegetarian", icon: <SproutIcon className="size-4" aria-hidden /> },
  { value: "glutenFree", label: "Gluten Free", icon: <WheatIcon className="size-4" aria-hidden /> },
  { value: "spicy", label: "Spicy", icon: <FilterIcon className="size-4" aria-hidden /> },
  {
    value: "chefSpecial",
    label: "Chef Special",
    icon: <ChefHatIcon className="size-4" aria-hidden />,
  },
];

const mockMenu: MenuItem[] = [
  {
    id: "caf-espresso-tonic",
    name: "Citrus Espresso Tonic",
    description: "Cold brew espresso over craft tonic, finished with candied orange peel.",
    price: "KES 480",
    priceValue: 480,
    category: "Beverages",
    dietary: ["vegan"],
    feature: "recommended",
    outletName: "Main Outlet",
  },
  {
    id: "caf-busia-bowl",
    name: "Busia Sunrise Bowl",
    description: "Sorghum tabbouleh, roasted pumpkin, avocado crema, and tamarind dressing.",
    price: "KES 820",
    priceValue: 820,
    category: "Bowls",
    dietary: ["vegetarian", "glutenFree"],
    outletName: "Main Outlet",
  },
  {
    id: "caf-ugali-bites",
    name: "Smoked Tilapia Ugali Bites",
    description: "Mini ugali cakes topped with smoked tilapia and herb yogurt drizzle.",
    price: "KES 640",
    priceValue: 640,
    category: "Small Plates",
    dietary: ["chefSpecial"],
    feature: "new",
    outletName: "Main Outlet",
  },
  {
    id: "caf-mandazi",
    name: "Spiced Mandazi Flight",
    description: "Trio of house-made mandazi with orange blossom, cardamom, and cocoa dusting.",
    price: "KES 540",
    priceValue: 540,
    category: "Pastries",
    dietary: ["vegetarian"],
    outletName: "Main Outlet",
  },
  {
    id: "caf-sip",
    name: "Iced Hibiscus Cold Brew",
    description: "Hibiscus cold brew infused with pineapple syrup and mint.",
    price: "KES 420",
    priceValue: 420,
    category: "Beverages",
    dietary: ["vegan", "glutenFree"],
    outletName: "Main Outlet",
  },
];

const getCategories = (items: MenuItem[]): string[] => {
  const unique = new Set(items.map((item) => item.category));
  return ["All", ...Array.from(unique)];
};

export function MenuDiscovery() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDietary, setActiveDietary] = useState<DietaryTag[]>([]);
  const addItem = useCartStore((state) => state.addItem);

  const categories = useMemo(() => getCategories(mockMenu), []);

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.priceValue,
      ...(item.outletId && { outletId: item.outletId }),
      ...(item.outletName && { outletName: item.outletName }),
    });
    toast.success(`Added ${item.name} to cart`);
  };

  const filteredItems = useMemo(() => {
    return mockMenu.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesDietary =
        activeDietary.length === 0 || activeDietary.every((tag) => item.dietary.includes(tag));
      const matchesSearch =
        search.length === 0 ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesDietary && matchesSearch;
    });
  }, [activeCategory, activeDietary, search]);

  return (
    <section className="border-t border-border bg-card py-8 sm:py-12 md:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 sm:gap-6 md:gap-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-brand-surface/40 p-4 shadow-sm sm:gap-6 sm:rounded-3xl sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">
              Browse the {activeCategory === "All" ? "full menu" : activeCategory.toLowerCase()}
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Filter by dietary preference, explore specials, and build your cart seamlessly.
            </p>
          </div>
          <div className="w-full md:max-w-md">
            <label htmlFor="menu-search" className="sr-only">
              Search menu items
            </label>
            <div className="relative">
              <SearchIcon
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="menu-search"
                placeholder="Search dishes, ingredients, or categories"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Category filters - Mobile: Scrollable horizontal, Desktop: Wrap */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-x-visible sm:pb-0">
          {categories.map((category) => (
            <Button
              key={category}
              type="button"
              size="sm"
              variant={activeCategory === category ? "default" : "outline"}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "shrink-0",
                activeCategory === category
                  ? "bg-brand text-brand-contrast shadow-soft"
                  : "border-border text-muted-foreground hover:border-brand-emphasis hover:text-brand-emphasis",
              )}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Dietary filters - Mobile: Scrollable horizontal, Desktop: Wrap */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-x-visible sm:pb-0">
          {dietaryFilters.map((filter) => {
            const isActive = activeDietary.includes(filter.value);
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() =>
                  setActiveDietary((prev) =>
                    isActive ? prev.filter((tag) => tag !== filter.value) : [...prev, filter.value],
                  )
                }
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "border-brand-emphasis bg-brand-emphasis/10 text-brand-emphasis"
                    : "border-border text-muted-foreground hover:border-brand-emphasis hover:text-brand-emphasis",
                )}
              >
                {filter.icon}
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>

        {/* Menu items grid - Mobile: Single column, Tablet: 2 columns, Desktop: 3 columns */}
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {filteredItems.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-6 text-center sm:rounded-3xl sm:p-8">
              <p className="text-xs text-muted-foreground sm:text-sm">
                No menu items match the current filters. Try clearing a dietary preference or
                adjusting your search.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <article
                key={item.id}
                className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl sm:p-6"
              >
                <div className="space-y-2 sm:space-y-3">
                  <header className="flex items-start justify-between gap-2 sm:gap-3">
                    <h3 className="text-base font-semibold text-foreground sm:text-lg">
                      {item.name}
                    </h3>
                    <div className="flex shrink-0 gap-1">
                      {item.feature === "recommended" ? (
                        <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[10px] font-medium text-brand-emphasis sm:px-3 sm:py-1 sm:text-xs">
                          ⭐
                        </span>
                      ) : null}
                      {item.feature === "new" ? (
                        <span className="rounded-full bg-brand-emphasis/10 px-2 py-0.5 text-[10px] font-medium text-brand-emphasis sm:px-3 sm:py-1 sm:text-xs">
                          New
                        </span>
                      ) : null}
                    </div>
                  </header>
                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {item.description}
                  </p>
                </div>
                <footer className="mt-4 space-y-3 sm:mt-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-base font-semibold text-foreground sm:text-sm">
                      {item.price}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.dietary.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-brand-muted px-1.5 py-0.5 text-[10px] font-medium text-brand-dark sm:px-2 sm:text-[11px]"
                        >
                          {dietaryFilters.find((filter) => filter.value === tag)?.label ?? tag}
                        </span>
                      ))}
                      {item.dietary.length > 3 && (
                        <span className="rounded-full bg-brand-muted px-1.5 py-0.5 text-[10px] font-medium text-brand-dark sm:px-2 sm:text-[11px]">
                          +{item.dietary.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button onClick={() => handleAddToCart(item)} className="w-full" size="sm">
                    <ShoppingCartIcon className="mr-2 size-4" />
                    Add to Cart
                  </Button>
                </footer>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
