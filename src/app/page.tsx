"use client";

import { Clock, MapPin, Tag, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  CategoryCarousel,
  defaultCategories,
  type Category,
} from "@/components/category/category-carousel";
import { FilterBar } from "@/components/layout/filter-bar";
import { SiteShell } from "@/components/layout/site-shell";
import {
  FeaturedItemCard,
  FeaturedItemsCarousel,
  type FeaturedItemProps,
} from "@/components/menu/featured-item-card";
import { OutletCard, OutletGrid, type OutletCardProps } from "@/components/outlet/outlet-card";
import { PromoBannerCarousel, mockPromoBanners } from "@/components/promo/promo-banner-carousel";
import { Button } from "@/components/ui/button";
import { useDiningModeStore } from "@/store/dining-mode";

// =============================================================================
// API FETCH FUNCTIONS (TODO: Replace with actual API calls)
// =============================================================================

async function fetchCategories(): Promise<Category[]> {
  try {
    // TODO: GET /api/v1/menu/categories
    return defaultCategories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return defaultCategories;
  }
}

async function fetchOutlets(): Promise<OutletCardProps[]> {
  try {
    // TODO: GET /api/v1/outlets
    return mockOutlets;
  } catch (error) {
    console.error("Failed to fetch outlets:", error);
    return mockOutlets;
  }
}

async function fetchFeaturedItems(): Promise<FeaturedItemProps[]> {
  try {
    // TODO: GET /api/v1/menu/items?featured=true
    return mockFeaturedItems;
  } catch (error) {
    console.error("Failed to fetch featured items:", error);
    return mockFeaturedItems;
  }
}

// =============================================================================
// MOCK DATA - Urban Loft Cafe Outlets (to be loaded from DB in production)
// These should be seeded in the backend database
// =============================================================================

/**
 * Urban Loft Cafe Outlets
 * In production, these are fetched from: GET /api/v1/outlets
 * Backend should seed these outlets with sample menu items
 */
const mockOutlets: OutletCardProps[] = [
  {
    id: "ulc-busia",
    name: "Urban Loft Cafe Busia",
    rating: 4.8,
    reviewCount: 2450,
    deliveryTime: "20-30",
    deliveryFee: "Free",
    distance: "1.2 km",
    cuisines: ["Cafe", "Bakery", "Breakfast", "Lunch"],
    promoted: true,
    offerBadge: "Free Delivery",
    image: "/images/outlets/ulc-busia.jpg",
    businessType: "food",
  },
  {
    id: "ulc-kiambu",
    name: "Urban Loft Cafe Kiambu",
    rating: 4.7,
    reviewCount: 1890,
    deliveryTime: "25-35",
    deliveryFee: "KES 50",
    distance: "2.5 km",
    cuisines: ["Cafe", "Bakery", "Breakfast", "Lunch"],
    promoted: true,
    offerBadge: "20% Off Today",
    image: "/images/outlets/ulc-kiambu.jpg",
    businessType: "food",
  },
];

/**
 * Featured Menu Items from Urban Loft Cafe
 * In production, these are fetched from: GET /api/v1/menu/items?featured=true
 * Backend should seed sample menu items for each outlet
 */
const mockFeaturedItems: FeaturedItemProps[] = [
  {
    id: "item-1",
    name: "Classic Cappuccino",
    description: "Rich espresso with steamed milk and foam",
    price: 350,
    currency: "KES",
    image: "/images/menu/cappuccino.jpg",
    outletId: "ulc-busia",
    outletName: "Urban Loft Cafe Busia",
    category: "Beverages",
  },
  {
    id: "item-2",
    name: "Avocado Toast",
    description: "Sourdough bread with fresh avocado, poached egg, and microgreens",
    price: 650,
    currency: "KES",
    image: "/images/menu/avocado-toast.jpg",
    outletId: "ulc-busia",
    outletName: "Urban Loft Cafe Busia",
    category: "Breakfast",
  },
  {
    id: "item-3",
    name: "Chicken Burger",
    description: "Grilled chicken breast with lettuce, tomato, and special sauce",
    price: 750,
    originalPrice: 850,
    discountPercent: 12,
    currency: "KES",
    image: "/images/menu/chicken-burger.jpg",
    outletId: "ulc-kiambu",
    outletName: "Urban Loft Cafe Kiambu",
    category: "Lunch",
  },
  {
    id: "item-4",
    name: "Fresh Fruit Smoothie",
    description: "Blend of seasonal fruits with yogurt",
    price: 450,
    currency: "KES",
    image: "/images/menu/smoothie.jpg",
    outletId: "ulc-busia",
    outletName: "Urban Loft Cafe Busia",
    category: "Beverages",
  },
  {
    id: "item-5",
    name: "Beef Steak",
    description: "Tender grilled steak with herbs and garlic butter",
    price: 1200,
    originalPrice: 1500,
    discountPercent: 20,
    currency: "KES",
    image: "/images/menu/steak.jpg",
    outletId: "ulc-kiambu",
    outletName: "Urban Loft Cafe Kiambu",
    category: "Lunch",
  },
  {
    id: "item-6",
    name: "Chocolate Croissant",
    description: "Buttery croissant filled with rich chocolate",
    price: 280,
    currency: "KES",
    image: "/images/menu/croissant.jpg",
    outletId: "ulc-busia",
    outletName: "Urban Loft Cafe Busia",
    category: "Bakery",
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function filterOutletsByCategory(
  outlets: OutletCardProps[],
  categoryId: string,
): OutletCardProps[] {
  if (categoryId === "all" || categoryId === "restaurants") {
    return outlets;
  }

  return outlets.filter(
    (outlet) =>
      outlet.businessType === categoryId ||
      outlet.cuisines?.some((c) => c.toLowerCase().includes(categoryId.toLowerCase())),
  );
}

// Get outlets with speedy delivery (under 30 min)
function getSpeedyDeliveryOutlets(outlets: OutletCardProps[]): OutletCardProps[] {
  return outlets.filter((outlet) => {
    const time = outlet.deliveryTime?.split("-")[0];
    return time && parseInt(time) <= 25;
  });
}

// Get outlets with delivery fee under threshold (supports multi-currency)
function getBudgetDeliveryOutlets(
  outlets: OutletCardProps[],
  maxFee: number = 100,
): OutletCardProps[] {
  return outlets.filter((outlet) => {
    if (!outlet.deliveryFee) return false;
    if (outlet.deliveryFee.toLowerCase() === "free") return true;
    // Extract numeric value from delivery fee string (e.g., "KES 50" -> 50)
    const feeMatch = outlet.deliveryFee.match(/\d+/);
    if (feeMatch) {
      return parseInt(feeMatch[0]) <= maxFee;
    }
    return false;
  });
}

// Get outlets with today's offers
function getTodaysOffersOutlets(outlets: OutletCardProps[]): OutletCardProps[] {
  return outlets.filter((outlet) => outlet.offerBadge || outlet.discount);
}

// =============================================================================
// SECTION COMPONENTS
// =============================================================================

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  seeAllHref?: string;
}

function SectionHeader({ title, subtitle, icon, seeAllHref }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {seeAllHref && (
        <Button variant="ghost" size="sm" className="text-primary" asChild>
          <Link href={seeAllHref as any}>See all</Link>
        </Button>
      )}
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [outlets, setOutlets] = useState<OutletCardProps[]>(mockOutlets);
  const [featuredItems, setFeaturedItems] = useState<FeaturedItemProps[]>(mockFeaturedItems);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const deliveryLocation = useDiningModeStore((state) => state.deliveryLocation);

  // Load data on mount
  useEffect(() => {
    fetchCategories().then(setCategories);
    fetchOutlets().then(setOutlets);
    fetchFeaturedItems().then(setFeaturedItems);
  }, []);

  // Handle favorite toggle
  const handleFavoriteToggle = (id: string, isFavorite: boolean) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFavorite) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  // Handle add to cart
  const handleAddToCart = (itemId: string) => {
    // TODO: Implement add to cart functionality
    console.log("Add to cart:", itemId);
  };

  // Filter outlets based on active category
  const filteredOutlets = filterOutletsByCategory(outlets, activeCategory);
  const speedyOutlets = getSpeedyDeliveryOutlets(outlets);
  const budgetDeliveryOutlets = getBudgetDeliveryOutlets(outlets, 100);
  const todaysOffersOutlets = getTodaysOffersOutlets(outlets);

  return (
    <SiteShell>
      {/* Category Carousel - Uber Eats Style with Icons */}
      <section className="sticky top-16 z-20 border-b border-border bg-background/95 py-3 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <CategoryCarousel
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            variant="icons"
          />
        </div>
      </section>

      {/* Filter Bar - Uber Eats Style */}
      <section className="border-b border-border bg-background py-3">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <FilterBar />
        </div>
      </section>

      {/* Promotional Banners Carousel */}
      <section className="bg-background py-6">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <PromoBannerCarousel banners={mockPromoBanners} />
        </div>
      </section>

      {/* 1. Featured Items Section */}
      <section className="py-6 sm:py-8">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Featured Items"
            subtitle="Popular picks from our menu"
            seeAllHref="/menu?featured=true"
          />
          <FeaturedItemsCarousel>
            {featuredItems.map((item) => (
              <FeaturedItemCard key={item.id} {...item} onAddToCart={handleAddToCart} />
            ))}
          </FeaturedItemsCarousel>
        </div>
      </section>

      {/* 2. Outlets Near You Section */}
      <section className="bg-muted/30 py-6 sm:py-8">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Outlets Near You"
            subtitle={
              deliveryLocation?.address
                ? `Near ${deliveryLocation.address}`
                : "Based on your location"
            }
            icon={<MapPin className="size-5" />}
            seeAllHref="/outlets"
          />
          <OutletGrid>
            {filteredOutlets.map((outlet) => (
              <OutletCard
                key={outlet.id}
                {...outlet}
                isFavorite={favorites.has(outlet.id)}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </OutletGrid>
        </div>
      </section>

      {/* 3. Speedy Deliveries Section */}
      {speedyOutlets.length > 0 && (
        <section className="py-6 sm:py-8">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Speedy Deliveries"
              subtitle="Get it fast - under 30 minutes"
              icon={<Zap className="size-5" />}
              seeAllHref="/outlets?filter=speedy"
            />
            <OutletGrid>
              {speedyOutlets.map((outlet) => (
                <OutletCard
                  key={outlet.id}
                  {...outlet}
                  isFavorite={favorites.has(outlet.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </OutletGrid>
          </div>
        </section>
      )}

      {/* 4. Under 100 KES Delivery Fee Section */}
      {budgetDeliveryOutlets.length > 0 && (
        <section className="bg-muted/30 py-6 sm:py-8">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Under 100 KES Delivery"
              subtitle="Budget-friendly delivery options"
              icon={<Clock className="size-5" />}
              seeAllHref="/outlets?filter=budget-delivery"
            />
            <OutletGrid>
              {budgetDeliveryOutlets.map((outlet) => (
                <OutletCard
                  key={outlet.id}
                  {...outlet}
                  isFavorite={favorites.has(outlet.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </OutletGrid>
          </div>
        </section>
      )}

      {/* 5. Today's Offers Section */}
      {todaysOffersOutlets.length > 0 && (
        <section className="py-6 sm:py-8">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Today's Offers"
              subtitle="Special deals just for today"
              icon={<Tag className="size-5" />}
              seeAllHref="/outlets?filter=offers"
            />
            <OutletGrid>
              {todaysOffersOutlets.map((outlet) => (
                <OutletCard
                  key={outlet.id}
                  {...outlet}
                  isFavorite={favorites.has(outlet.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </OutletGrid>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/50 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Ready to start ordering?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Browse our menu and enjoy fast delivery from Urban Loft Cafe.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="sm:px-8">
              <Link href="/menu">Browse Menu</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="sm:px-8">
              <Link href="/auth">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
