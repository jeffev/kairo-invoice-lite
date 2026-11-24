import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  CreditCard,
  FileText,
  Link2,
  Receipt,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";

import { InvoicePreview } from "@/components/marketing/invoice-preview";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

const features = [
  { icon: FileText, title: "Professional invoices", text: "Your logo-free, clean layout with line items, discounts, tax and notes. PDF generated on the server, identical every time." },
  { icon: Link2, title: "Shareable invoice page", text: "Every invoice gets a secure page where the client can view it and download the PDF." },
  { icon: Send, title: "Send and track", text: "Email the invoice with the PDF attached and see when it was opened, paid or went overdue." },
  { icon: Bell, title: "Overdue at a glance", text: "Invoices past their due date are flagged automatically and listed on the dashboard." },
  { icon: Receipt, title: "Clients and items", text: "Keep client details and a price catalog, so a new invoice takes a minute." },
  { icon: RefreshCw, title: "Open source", text: "MIT licensed. Fork it, change it, ship it. A full version with payments and more is available." },
];

const steps = [
  { icon: FileText, title: "Create", text: "Pick a client, add lines from your catalog, set the due date." },
  { icon: Send, title: "Send", text: "One click emails the PDF and a payment link to the client." },
  { icon: CreditCard, title: "Get paid", text: "Clients pay with the details on the invoice; mark it as paid in a click." },
];

const included = [
  "Next.js 16 App Router, React 19, TypeScript",
  "Tailwind CSS 4 and shadcn/ui, light and dark theme",
  "Better Auth: email + password, Google and GitHub",
  "Drizzle ORM with SQLite locally and Turso in production",
  "Server-rendered PDF invoices with @react-pdf/renderer",
  "Transactional emails built with React Email and sent by Resend",
  "Demo mode that runs with zero API keys",
];

const faqs = [
  { q: "Do I need any API keys to try it?", a: "No. Without a Resend key emails are printed to the server console, so every flow works right after npm install." },
  { q: "Is it multi-tenant?", a: "Each account gets its own workspace with clients, invoices and settings." },
  { q: "Can clients pay by card?", a: "Not in the Lite version: clients pay with the payment details printed on the invoice and you mark it as paid. The full Kairo Invoice adds Stripe payment links, deposits, partial payments, estimates, a client portal, recurring invoices, reminders, expenses and reports." },
  { q: "How are amounts stored?", a: "As integers in the smallest currency unit, with quantities at two decimals. Totals are computed by one shared function used by the form, the server, the PDF and the emails." },
  { q: "Where does it run?", a: "Anywhere Node.js runs. Vercel with the Turso integration is the one-click path." },
  { q: "Can I change the invoice design?", a: "Yes. The PDF is a React component (lib/pdf.tsx) and the web version is another (components/invoices/invoice-sheet.tsx). Both use the same data." },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[36rem] max-w-4xl rounded-full bg-[radial-gradient(closest-side,var(--brand-glow),transparent)] blur-2xl" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:pt-24">
          <div className="grid gap-6">
            <Badge variant="secondary" className="w-fit gap-1.5 rounded-full px-3 py-1">
              <ShieldCheck className="size-3.5 text-primary" />
              Free and open source
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Invoices that <span className="text-primary">get paid</span>.
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">{siteConfig.description}</p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start free <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">See features</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">No credit card required · Sample data included</p>
          </div>
          <InvoicePreview />
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-4 py-8 text-sm font-semibold tracking-wide text-muted-foreground/70 uppercase sm:px-6">
          {["Northwind", "Lumen", "Acme Corp", "Globex", "Initech", "Hooli"].map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <SectionHeading eyebrow="Features" title="Everything between “project done” and “money in the bank”" text="Invoicing, sending and tracking in one small app." />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <CardTitle>{f.title}</CardTitle>
                <CardDescription className="leading-relaxed">{f.text}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <SectionHeading eyebrow="How it works" title="From draft to paid in three steps" />
          <ol className="mt-14 grid gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="grid justify-items-center gap-3 text-center">
                <div className="relative flex size-14 items-center justify-center rounded-2xl border bg-background shadow-sm">
                  <s.icon className="size-6 text-primary" />
                  <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</span>
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="max-w-xs text-sm text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What's included */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="grid gap-4">
            <span className="text-sm font-medium text-primary">Built on a modern stack</span>
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">A complete application, not a UI kit</h2>
            <p className="text-muted-foreground">
              Authentication, database, PDF generation and emails are wired together and tested. Add your keys and go live.
            </p>
            <Button className="w-fit" asChild>
              <Link href="/sign-up">
                Try the demo <ArrowRight />
              </Link>
            </Button>
          </div>
          <ul className="grid gap-3 rounded-2xl border bg-card p-6 text-sm">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Lite vs full */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-24 sm:px-6 md:grid-cols-3">
          {[
            { icon: FileText, title: "Small on purpose", text: "Invoices, clients, items, PDF and email. Easy to read, easy to change." },
            { icon: Receipt, title: "Your data, your server", text: "SQLite locally, Turso in production. No third party needed to send an invoice." },
            { icon: BarChart3, title: "Room to grow", text: "Need card payments, estimates or reports? The full Kairo Invoice adds them." },
          ].map((r) => (
            <div key={r.title} className="grid gap-2">
              <r.icon className="size-5 text-primary" />
              <h3 className="font-semibold">{r.title}</h3>
              <p className="text-sm text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-24 sm:px-6">
        <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-16">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,oklch(1_0_0/0.2),transparent_50%)]" />
          <div className="relative mx-auto grid max-w-2xl gap-5">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Send your first invoice in two minutes</h2>
            <p className="opacity-90">Create an account, load the sample data and explore every screen.</p>
            <div>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/sign-up">
                  Get started free <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto grid max-w-2xl gap-3 text-center">
      <span className="text-sm font-medium text-primary">{eyebrow}</span>
      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {text && <p className="text-muted-foreground">{text}</p>}
    </div>
  );
}
