import Link from "next/link";

import { Logo } from "@/components/logo";
import { siteConfig } from "@/config/site";

const columns = [
  { title: "Product", links: [{ href: "/#features", label: "Features" }, { href: "/#pricing", label: "What's included" }, { href: "/#faq", label: "FAQ" }] },
  { title: "Account", links: [{ href: "/sign-in", label: "Sign in" }, { href: "/sign-up", label: "Create account" }, { href: "/dashboard", label: "Dashboard" }] },
  { title: "Legal", links: [{ href: "/terms", label: "Terms of service" }, { href: "/privacy", label: "Privacy policy" }] },
];

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="grid content-start gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{siteConfig.description}</p>
        </div>
        {columns.map((col) => (
          <div key={col.title} className="grid content-start gap-3 text-sm">
            <span className="font-medium">{col.title}</span>
            {col.links.map((link) => (
              <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
