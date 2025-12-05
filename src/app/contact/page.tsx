"use client";

import Link from "next/link";

import { ClockIcon, MailIcon, MapPinIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";

import { ContactForm } from "@/components/contact/contact-form";
import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { brand } from "@/config/brand";

const quickLinks = [
  {
    title: "Call the Café",
    subtitle: "Talk to our hospitality team",
    icon: <PhoneIcon className="size-5 text-primary" aria-hidden />,
    href: `tel:${brand.support.phone.replace(/\s+/g, "")}`,
    label: brand.support.phone,
  },
  {
    title: "WhatsApp support",
    subtitle: "Chat for live order help",
    icon: <MessageCircleIcon className="size-5 text-primary" aria-hidden />,
    href: "https://wa.me/254743793901",
    label: "Message Urban Café",
  },
  {
    title: "Email the crew",
    subtitle: "Send feedback or partnerships",
    icon: <MailIcon className="size-5 text-primary" aria-hidden />,
    href: `mailto:${brand.support.email}`,
    label: brand.support.email,
  },
];

export default function ContactPage() {
  return (
    <SiteShell>
      <section className="border-b border-border bg-brand-surface/60 py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/80 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm backdrop-blur">
            We’re here for you
          </span>
          <h1 className="text-4xl font-semibold text-foreground md:text-5xl">
            Let’s make your next Urban Café visit effortless.
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Whether you’re ordering breakfast for the office, tracking a rider, or planning a
            celebration, our team is a message away. Reach us anytime—we love hearing from our
            guests.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/menu">Start an order</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="#support">Talk to support</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="support" className="border-b border-border bg-background py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 md:grid-cols-3">
          {quickLinks.map((card) => (
            <Card key={card.title} className="h-full">
              <CardHeader className="space-y-3">
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-brand-muted">
                  {card.icon}
                </span>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-foreground">{card.title}</h2>
                  <p className="text-sm text-muted-foreground">{card.subtitle}</p>
                </div>
              </CardHeader>
              <CardContent>
                <a
                  href={card.href}
                  className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {card.label}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 lg:grid-cols-[1.3fr_0.7fr] xl:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Send us a note</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Share your question, celebration plans, or feedback and we&apos;ll reply within one
              business day.
            </p>
            <ContactForm />
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="space-y-2">
                <ClockIcon className="size-5 text-primary" aria-hidden />
                <h3 className="text-xl font-semibold text-foreground">Service hours</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Daily 7:00am – 9:00pm. Riders are on standby throughout peak breakfast and evening
                  slots.
                </p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="space-y-2">
                <MapPinIcon className="size-5 text-primary" aria-hidden />
                <h3 className="text-xl font-semibold text-foreground">Visit the café</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {brand.support.headquarters}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Stop by for signature roasts, limited-edition pastries, and a chat with our
                  baristas.
                </p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Need an admin account?</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Operations leads can request demo or trial access to manage staff invites and café
                  settings.
                </p>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/request">Request admin access</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
