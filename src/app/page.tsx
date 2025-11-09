import Image from "next/image";
import Link from "next/link";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { brand } from "@/config/brand";
import { SparklesIcon, StarIcon } from "lucide-react";

const heroHighlights = [
  "Fresh meals from trusted cafés",
  "Live tracking from prep to delivery",
  "Secure checkout with rewards",
];

const valueProps = [
  {
    title: `${brand.shortName} favourites`,
    description: "Menus curated daily, with dietary-friendly options and seasonal specials.",
    icon: "/illustrations/benefit-tracking.svg",
  },
  {
    title: "Reliable delivery",
    description: "Verified riders and optimised routes mean your order arrives right on time.",
    icon: "/illustrations/benefit-fast.svg",
  },
  {
    title: "Transparent experience",
    description: "Track every status update and communicate with your rider if you need to.",
    icon: "/illustrations/benefit-secure.svg",
  },
];

const howItWorks = [
  {
    img: "/illustrations/how-choose.svg",
    title: "Pick what you’re craving",
    description: "Scroll through fan favourites and new arrivals, then add them to your cart.",
  },
  {
    img: "/illustrations/how-cook.svg",
    title: "We prepare with care",
    description: "Partner cafés cook your meal fresh and package it carefully for the ride.",
  },
  {
    img: "/illustrations/how-deliver.svg",
    title: "Track delivery in real time",
    description: "Follow your verified rider on the map until the order reaches your door.",
  },
];

const categories = [
  { name: "Bowls & mains", description: "Wholesome, hearty plates" },
  { name: "Pastries", description: "Baked fresh every morning" },
  { name: "Sips & brews", description: "Coffee, juices, iced blends" },
  { name: "Small bites", description: "Perfect to share or snack" },
];

const testimonials = [
  {
    quote: "My lunch arrives hot and on time every day. Tracking keeps me in the loop the whole way.",
    author: "Mary A.",
    role: "Customer in Busia CBD",
  },
  {
    quote: "Our office orders three times a week—great variety and the riders are always professional.",
    author: "Kevin O.",
    role: "Office manager",
  },
  {
    quote: "Checkout is simple, and support was quick to respond when I needed help. Highly recommend.",
    author: "Noreen K.",
    role: "Repeat customer",
  },
];

const faqs = [
  {
    q: "How do I place an order?",
    a: "Tap Start an order, choose your favourites, add delivery details, and confirm. You’ll receive updates instantly.",
  },
  {
    q: "Can I track my rider?",
    a: "Absolutely. You’ll see a live timeline and map so you know exactly when to expect your delivery.",
  },
  {
    q: "Where do you deliver?",
    a: "We currently serve Busia and neighbouring areas. Availability appears after you enter your address at checkout.",
  },
];

export default function HomePage(): JSX.Element {
  return (
    <SiteShell>
      <div className="flex-1 space-y-12 pb-16">
        <section className="relative overflow-hidden border-b border-border bg-brand-surface/60 py-16">
          <div className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-gradient-to-b from-primary/20 to-transparent" />
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 md:grid-cols-[1.05fr_0.95fr] md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/80 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm backdrop-blur">
                <SparklesIcon className="size-4" aria-hidden />
                Delivered by {brand.shortName}
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-tight text-foreground md:text-5xl">
                Where Busia’s favourite cafés meet fast, transparent delivery.
              </h1>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                Explore local menus, customise your order, and follow every update in real time. Fresh food, happy riders, delighted customers.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" className="shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-lg" asChild>
                  <Link href="/menu">Start an order</Link>
                </Button>
                <Button variant="secondary" size="lg" className="transition duration-300 hover:-translate-y-0.5" asChild>
                  <Link href={{ pathname: "/customers/signup" }}>Create account</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="transition duration-300 hover:-translate-y-0.5 hover:border-primary"
                  asChild
                >
                  <Link href={{ pathname: "/riders/signup" }}>Become a rider</Link>
                </Button>
                <Button variant="ghost" size="lg" className="transition duration-300 hover:-translate-y-0.5 hover:bg-muted" asChild>
                  <Link href="/delivery">Track order</Link>
                </Button>
              </div>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                {heroHighlights.map((item) => (
                  <li
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary shadow-sm"
                  >
                    <StarIcon className="size-4" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative flex h-full items-center justify-center">
              <Image
                src="/illustrations/delivery-hero.svg"
                alt="Illustration of a delivery rider with a warm meal"
                width={520}
                height={520}
                priority
                className="h-auto w-full max-w-xl drop-shadow-2xl"
              />
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-background py-12">
          <div className="mx-auto w-full max-w-6xl px-4">
            <h2 className="mb-10 text-center text-3xl font-semibold text-foreground md:text-4xl">
              Everything you expect from a delivery experience
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {valueProps.map((item) => (
                <Card key={item.title} className="transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader className="flex flex-col items-center gap-4">
                    <Image src={item.icon} alt={item.title} width={72} height={72} />
                    <h3 className="text-xl font-semibold text-card-foreground">{item.title}</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-brand-surface/60 py-12">
          <div className="mx-auto w-full max-w-6xl px-4">
            <h2 className="mb-10 text-center text-3xl font-semibold text-foreground md:text-4xl">
              How it works
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {howItWorks.map((step, index) => (
                <Card key={step.title} className="transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader className="flex flex-col items-center gap-4">
                    <span className="rounded-full bg-brand-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-emphasis">
                      Step {index + 1}
                    </span>
                    <Image src={step.img} alt={step.title} width={72} height={72} />
                    <h3 className="text-xl font-semibold text-card-foreground">{step.title}</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-background py-12">
          <div className="mx-auto w-full max-w-6xl px-4">
            <h2 className="mb-8 text-center text-3xl font-semibold text-foreground md:text-4xl">
              Popular categories
            </h2>
            <div className="grid gap-6 md:grid-cols-4">
              {categories.map((cat) => (
                <Card
                  key={cat.name}
                  className="bg-gradient-to-br from-brand-muted/60 to-background transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <CardHeader className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">{cat.description}</p>
                    <h3 className="text-lg font-semibold text-foreground">{cat.name}</h3>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Button variant="outline" size="lg" asChild>
                <Link href="/menu">Browse the full menu</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-background py-12">
          <div className="mx-auto w-full max-w-6xl px-4">
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">What customers say</p>
              <h2 className="text-3xl font-semibold text-foreground md:text-4xl">Trusted by the community</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <Card key={t.author} className="transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="space-y-4 pt-6 text-sm text-muted-foreground">
                    <p className="italic">“{t.quote}”</p>
                    <div className="space-y-1 text-sm font-semibold text-card-foreground">
                      <p>{t.author}</p>
                      <p className="font-normal text-muted-foreground">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-brand-surface/60 py-16">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-2">
            <Card className="transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-emphasis">Riders</span>
                <h2 className="text-3xl font-semibold text-foreground">Verified rider network</h2>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Submit your KYC details and motorbike documents. Once approved, you’ll receive real-time jobs, navigation assistance, and treasury-backed payouts.
                </p>
                <ul className="space-y-2">
                  <li>• National ID, proof of residency, and updated bike photo required</li>
                  <li>• Rider training and safety briefing before going live</li>
                  <li>• Reliable payouts with support from CodeVertex IT Solutions</li>
                </ul>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button size="sm" asChild>
                    <Link href={{ pathname: "/riders/signup" }}>Start rider onboarding</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/auth#rider">Rider sign in</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-emphasis">Customers</span>
                <h2 className="text-3xl font-semibold text-foreground">Order with confidence</h2>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Explore curated menus, earn loyalty rewards, and keep tabs on your delivery with live updates. Reorder your favourites in a tap.
                </p>
                <ul className="space-y-2">
                  <li>• Dietary tags and seasonal specials highlighted for quick browsing</li>
                  <li>• Live order status, rider details, and map tracking</li>
                  <li>• Secure payment with digital receipts sent automatically</li>
                </ul>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button size="sm" asChild>
                    <Link href="/menu">Browse the menu</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/delivery">See delivery timeline</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-t border-border bg-brand-surface/60 py-12">
          <div className="mx-auto w-full max-w-4xl px-4">
            <h2 className="mb-8 text-center text-3xl font-semibold text-foreground md:text-4xl">Frequently asked</h2>
            <div className="space-y-4">
              {faqs.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-3xl border border-border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg  "
                >
                  <summary className="cursor-pointer list-none text-base font-semibold text-foreground outline-none transition group-open:text-primary">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4">
          <Card className="mx-auto w-full max-w-5xl bg-gradient-to-br from-brand-muted/60 to-background px-6 py-10 shadow-soft transition duration-300 hover:shadow-lg">
            <CardHeader className="space-y-4 text-center">
              <h2 className="text-3xl font-semibold text-card-foreground md:text-4xl">
                Ready to order? Your favourite cafés are just a tap away.
              </h2>
              <p className="text-sm text-muted-foreground">
                Start your first order in minutes and enjoy fresh meals with complete transparency from preparation to drop-off.
              </p>
            </CardHeader>
            <CardContent className="flex flex-wrap justify-center gap-3">
              <Button size="lg" className="hover:-translate-y-0.5 hover:shadow-lg" asChild>
                <Link href="/menu">Start an order</Link>
              </Button>
              <Button variant="outline" size="lg" className="hover:-translate-y-0.5 hover:border-brand-emphasis" asChild>
                <Link href="/auth">Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </SiteShell>
  );
}
