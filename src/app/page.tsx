import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { brand } from "@/config/brand";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: `Order Fresh Food Online | ${brand.shortName} Food Delivery in Busia`,
  description: `Order delicious meals from ${brand.shortName} cafés in Busia. Fast delivery, live tracking, secure payments, and loyalty rewards. Join thousands of satisfied customers.`,
  keywords: [
    "food delivery Busia",
    "online food ordering",
    "cafe delivery",
    "restaurant delivery Busia",
    "fast food delivery",
    "meal delivery service",
    brand.shortName.toLowerCase(),
    "food delivery app",
    "order food online",
  ],
  openGraph: {
    title: `${brand.shortName} - Fresh Food Delivery in Busia`,
    description: "Order from your favorite cafés with live tracking and secure payments",
    type: "website",
    locale: "en_KE",
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.shortName} - Food Delivery`,
    description: "Fresh meals delivered fast with live tracking",
  },
  alternates: {
    canonical: "/",
  },
};

const heroHighlights = [
  "Fresh meals from trusted cafés",
  "Live tracking from prep to delivery",
  "Secure checkout with rewards",
];

const valueProps = [
  {
    title: "Curated Daily Menus",
    description:
      "Menus updated daily with dietary-friendly options, seasonal specials, and local favorites.",
    icon: Sparkles,
    color: "text-brand-emphasis",
  },
  {
    title: "Reliable Delivery",
    description:
      "Verified riders with optimized routes ensure your order arrives hot and on time, every time.",
    icon: Truck,
    color: "text-primary",
  },
  {
    title: "Transparent Experience",
    description:
      "Track every status update in real-time and communicate directly with your rider when needed.",
    icon: ShieldCheck,
    color: "text-brand-emphasis",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Browse & Choose",
    description:
      "Explore curated menus from partner cafés. Filter by dietary preferences, search favorites, and discover new dishes.",
    icon: "📱",
  },
  {
    step: "02",
    title: "Order & Pay",
    description:
      "Add items to your cart, apply promo codes, redeem loyalty points, and checkout securely with multiple payment options.",
    icon: "💳",
  },
  {
    step: "03",
    title: "Track Live",
    description:
      "Watch your order being prepared and follow your rider in real-time on an interactive map until delivery.",
    icon: "📍",
  },
];

const stats = [
  { value: "10K+", label: "Happy Customers" },
  { value: "50+", label: "Partner Cafés" },
  { value: "15min", label: "Avg Delivery Time" },
  { value: "4.8★", label: "Customer Rating" },
];

const categories = [
  { name: "Bowls & Mains", description: "Wholesome, hearty plates", count: "45+" },
  { name: "Pastries", description: "Baked fresh every morning", count: "30+" },
  { name: "Sips & Brews", description: "Coffee, juices, iced blends", count: "25+" },
  { name: "Small Bites", description: "Perfect to share or snack", count: "20+" },
];

const testimonials = [
  {
    quote:
      "My lunch arrives hot and on time every day. The live tracking keeps me informed the whole way. Best food delivery service in Busia!",
    author: "Mary A.",
    role: "Customer in Busia CBD",
    rating: 5,
  },
  {
    quote:
      "Our office orders three times a week—great variety and the riders are always professional. Highly recommend!",
    author: "Kevin O.",
    role: "Office Manager",
    rating: 5,
  },
  {
    quote:
      "Checkout is simple, support responds quickly, and the loyalty rewards are amazing. I've earned so many points!",
    author: "Noreen K.",
    role: "Repeat Customer",
    rating: 5,
  },
];

const features = [
  {
    icon: Clock,
    title: "Fast Delivery",
    description: "Average 15-minute delivery time with real-time tracking",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description: "Multiple payment options including M-Pesa with secure checkout",
  },
  {
    icon: Star,
    title: "Loyalty Rewards",
    description: "Earn points on every order and redeem for discounts",
  },
  {
    icon: Users,
    title: "Verified Riders",
    description: "All riders are background-checked and trained for safety",
  },
];

const faqs = [
  {
    q: "How do I place an order?",
    a: "Simply tap 'Start an order', browse our menu, choose your favorites, add delivery details, and confirm. You'll receive instant updates via SMS and in-app notifications.",
  },
  {
    q: "Can I track my delivery in real-time?",
    a: "Absolutely! Once your order is confirmed, you'll see a live timeline and interactive map showing your rider's location and estimated arrival time.",
  },
  {
    q: "Where do you deliver?",
    a: "We currently serve Busia and surrounding areas. Enter your address at checkout to see if we deliver to your location. We're expanding coverage regularly!",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept M-Pesa, mobile money, and card payments. All transactions are secure and encrypted for your safety.",
  },
  {
    q: "How do I earn loyalty points?",
    a: "You earn points on every order. 1 KES spent = 1 point. Redeem points for discounts on future orders. The more you order, the more you save!",
  },
  {
    q: "Can I order for someone else?",
    a: "Yes! Simply enter a different delivery address and contact number at checkout. Perfect for sending meals to family and friends.",
  },
];

export default function HomePage() {
  return (
    <SiteShell>
      <div className="flex-1">
        {/* Hero Section - Mobile Optimized */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-brand-surface via-background to-brand-muted/30 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
          <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
              {/* Hero Content */}
              <div className="space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm backdrop-blur-sm sm:px-4">
                  <Sparkles className="size-3.5 sm:size-4" aria-hidden />
                  <span>Delivered by {brand.shortName}</span>
                </div>
                <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
                  Fresh Food Delivered Fast to Your Door
                </h1>
                <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
                  Order from your favorite cafés in Busia. Track your delivery in real-time, earn
                  loyalty rewards, and enjoy fresh meals delivered by verified riders.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                  <Button
                    size="lg"
                    className="w-full shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
                    asChild
                  >
                    <Link href="/menu">
                      Start an Order
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full transition-all duration-300 hover:-translate-y-0.5 hover:border-primary sm:w-auto"
                    asChild
                  >
                    <Link href="/customers/signup">Create Account</Link>
                  </Button>
                </div>
                <ul className="flex flex-wrap justify-center gap-2 lg:justify-start">
                  {heroHighlights.map((item) => (
                    <li
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary shadow-sm sm:px-3 sm:text-sm"
                    >
                      <CheckCircle2 className="size-3.5" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Hero Image */}
              <div className="relative flex items-center justify-center">
                <div className="relative w-full max-w-lg">
                  <Image
                    src="/illustrations/delivery-hero.svg"
                    alt="Food delivery illustration showing a rider delivering fresh meals"
                    width={600}
                    height={600}
                    priority
                    className="h-auto w-full drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b border-border bg-background py-8 sm:py-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center sm:text-left">
                  <div className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Value Props */}
        <section className="border-b border-border bg-background py-12 sm:py-16 md:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:mb-12">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
                Everything You Need for a Great Delivery Experience
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                We&apos;ve built a platform that puts you first—from curated menus to reliable
                delivery and transparent tracking.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {valueProps.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.title}
                    className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <CardHeader className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
                      <div
                        className={`rounded-full bg-brand-muted p-3 ${item.color} transition-transform duration-300 group-hover:scale-110`}
                      >
                        <Icon className="size-6" />
                      </div>
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm leading-relaxed">
                        {item.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-b border-border bg-brand-surface/40 py-12 sm:py-16 md:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:mb-12">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
                How It Works
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Ordering delicious food has never been easier. Follow these three simple steps.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {howItWorks.map((step) => (
                <Card
                  key={step.step}
                  className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <CardHeader className="flex flex-col items-center gap-4 text-center">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-bold text-primary/20">{step.step}</span>
                      <span className="text-4xl">{step.icon}</span>
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="border-b border-border bg-background py-12 sm:py-16 md:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:mb-12">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
                Popular Categories
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Explore our wide selection of delicious meals and beverages
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((cat) => (
                <Card
                  key={cat.name}
                  className="group bg-gradient-to-br from-brand-muted/60 to-background transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <CardHeader className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                      {cat.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{cat.name}</CardTitle>
                      <span className="text-xs font-medium text-muted-foreground">{cat.count}</span>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Button variant="outline" size="lg" asChild>
                <Link href="/menu">
                  Browse Full Menu
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="border-b border-border bg-background py-12 sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left"
                  >
                    <div className="rounded-full bg-brand-muted p-3 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-b border-border bg-brand-surface/40 py-12 sm:py-16 md:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:mb-12">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                What Customers Say
              </p>
              <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
                Trusted by the Community
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <Card
                  key={t.author}
                  className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex gap-1">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="size-4 fill-brand-emphasis text-brand-emphasis" />
                      ))}
                    </div>
                    <p className="text-sm italic leading-relaxed text-muted-foreground">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="space-y-1 border-t border-border pt-4">
                      <p className="text-sm font-semibold text-foreground">{t.author}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA for Riders & Customers */}
        <section className="border-b border-border bg-background py-12 sm:py-16 md:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-emphasis">
                    For Riders
                  </span>
                  <CardTitle className="text-2xl sm:text-3xl">Join Our Rider Network</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm leading-relaxed">
                    Earn competitive payouts, work flexible hours, and be part of Busia&apos;s
                    fastest-growing delivery network. All riders are verified and trained for
                    safety.
                  </CardDescription>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>Flexible working hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>Competitive payouts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>Safety training & support</span>
                    </li>
                  </ul>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button size="sm" asChild>
                      <Link href="/riders/signup">Start Rider Onboarding</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/auth#rider">Rider Sign In</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-emphasis">
                    For Customers
                  </span>
                  <CardTitle className="text-2xl sm:text-3xl">Order with Confidence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm leading-relaxed">
                    Explore curated menus, earn loyalty rewards, and track your delivery in
                    real-time. Reorder your favorites with one tap and enjoy fresh meals delivered
                    fast.
                  </CardDescription>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>Live order tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>Loyalty rewards program</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>Secure payment options</span>
                    </li>
                  </ul>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button size="sm" asChild>
                      <Link href="/menu">Browse Menu</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/delivery">Track Order</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-b border-border bg-brand-surface/40 py-12 sm:py-16 md:py-20">
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:mb-12">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Everything you need to know about ordering from {brand.shortName}
              </p>
            </div>
            <div className="space-y-4">
              {faqs.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-border bg-card p-5 transition-all duration-300 open:shadow-md hover:shadow-md"
                >
                  <summary className="cursor-pointer list-none text-base font-semibold text-foreground outline-none transition-colors group-open:text-primary">
                    {item.q}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-br from-brand-muted/60 via-background to-brand-surface/40 py-12 sm:py-16 md:py-20">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <Card className="bg-gradient-to-br from-card to-brand-muted/30 shadow-xl transition-all duration-300 hover:shadow-2xl">
              <CardHeader className="space-y-4 text-center">
                <CardTitle className="text-2xl font-bold sm:text-3xl md:text-4xl">
                  Ready to Order? Your Favorite Cafés Are Just a Tap Away
                </CardTitle>
                <CardDescription className="mx-auto max-w-2xl text-base sm:text-lg">
                  Start your first order in minutes and enjoy fresh meals with complete transparency
                  from preparation to drop-off. Join thousands of satisfied customers in Busia.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="w-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
                  asChild
                >
                  <Link href="/menu">
                    Start an Order
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full transition-all duration-300 hover:-translate-y-0.5 hover:border-primary sm:w-auto"
                  asChild
                >
                  <Link href="/auth">Sign In</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
