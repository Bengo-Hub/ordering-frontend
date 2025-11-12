import {
  CoffeeIcon,
  HeartHandshakeIcon,
  MapPinIcon,
  SparklesIcon,
  UtensilsIcon,
} from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { brand } from "@/config/brand";

const highlights = [
  {
    title: "Handcrafted daily",
    description:
      "Our baristas and kitchen teams prepare every order fresh, highlighting local ingredients and seasonal specials.",
    icon: <CoffeeIcon className="size-6 text-primary" aria-hidden />,
  },
  {
    title: "Customers at the center",
    description:
      "We design every touchpoint—from browsing to delivery updates—to feel warm, transparent, and reliable.",
    icon: <HeartHandshakeIcon className="size-6 text-primary" aria-hidden />,
  },
  {
    title: "Made for Busia",
    description:
      "Urban Café started on Oginga Road. We continue to grow with the community we call home.",
    icon: <MapPinIcon className="size-6 text-primary" aria-hidden />,
  },
];

const commitments = [
  {
    title: "For our guests",
    copy: [
      "Clear menus with dietary tags",
      "Delivery ETAs you can trust",
      "Rewards that thank you for coming back",
    ],
  },
  {
    title: "For our riders",
    copy: [
      "Fair payouts and predictable shifts",
      "In-app navigation and safety guidance",
      "Dedicated support from the ops desk",
    ],
  },
  {
    title: "For our city",
    copy: [
      "Partnering with local suppliers",
      "Highlighting Kenyan coffee culture",
      "Investing in greener delivery routes",
    ],
  },
];

const experiences = [
  {
    step: "Sip & savour",
    description:
      "Start with signature brews, slow breakfasts, and pastries crafted in-house for the morning rush.",
  },
  {
    step: "Gather & celebrate",
    description:
      "Order for the office, host an intimate brunch, or plan celebrations with curated bundles and catering.",
  },
  {
    step: "Relax & repeat",
    description:
      "Earn loyalty rewards, save favourites, and let our verified riders bring the café to your door again and again.",
  },
];

export default function AboutPage(): JSX.Element {
  return (
    <SiteShell>
      <section className="border-b border-border bg-brand-surface/60 py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/80 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm backdrop-blur">
            Our story
          </span>
          <h1 className="text-4xl font-semibold text-foreground md:text-5xl">
            Urban Café is Busia’s living room.
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            From the first espresso we pulled to today’s delivery routes, {brand.shortName} is built
            to keep Busia energised. We combine thoughtful food, verified riders, and people-first
            service so every order feels like a personal visit to the café.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <a href="/menu">Browse the menu</a>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <a href="/delivery">See delivery timeline</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-3">
          {highlights.map((item) => (
            <Card key={item.title} className="h-full">
              <CardHeader className="flex flex-col items-start gap-4">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand-muted">
                  {item.icon}
                </span>
                <h2 className="text-2xl font-semibold text-foreground">{item.title}</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-b border-border bg-brand-surface/60 py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            A day with Urban Café
          </span>
          <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
            From first pour to evening unwinds
          </h2>
          <p className="mx-auto max-w-3xl text-sm text-muted-foreground">
            Whether you drop by the café, order from home, or curate a surprise for friends, our
            teams shape the experience with the same care.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {experiences.map((experience) => (
              <Card key={experience.step} className="h-full">
                <CardHeader className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {experience.step}
                  </p>
                  <SparklesIcon className="size-5 text-primary" aria-hidden />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{experience.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto w-full max-w-5xl space-y-8 px-4 text-center md:text-left">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Our commitments
            </span>
            <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
              We grow with the people around us
            </h2>
            <p className="text-sm text-muted-foreground md:max-w-3xl">
              Every cup served, delivery completed, and playlist curated is a promise to our guests,
              team members, and neighbours. Here’s how we honour that promise.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {commitments.map((commitment) => (
              <Card key={commitment.title} className="h-full">
                <CardHeader>
                  <h3 className="text-xl font-semibold text-foreground">{commitment.title}</h3>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {commitment.copy.map((line) => (
                    <div key={line} className="flex items-start gap-2">
                      <UtensilsIcon className="mt-0.5 size-4 text-primary" aria-hidden />
                      <span>{line}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card px-6 py-6">
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary/80">
                Ready for your next visit?
              </p>
              <h3 className="text-2xl font-semibold text-foreground">
                Taste the difference at {brand.shortName}
              </h3>
              <p className="text-sm text-muted-foreground md:max-w-2xl">
                Order online for doorstep delivery or stop by our café to say hello. We can’t wait
                to serve you.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <a href="/menu">Start an order</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="/contact">Talk to us</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
