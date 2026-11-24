import { redirect } from "next/navigation";

import { Logo } from "@/components/logo";
import { getSession } from "@/lib/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Verified on the server (not just the cookie), so a stale cookie can't cause a redirect loop.
  if (await getSession()) redirect("/dashboard");
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,oklch(1_0_0/0.25),transparent_55%),radial-gradient(circle_at_80%_85%,oklch(0_0_0/0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(1_0_0/0.07)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.07)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-primary-foreground">
          <blockquote className="grid max-w-md gap-4">
            <p className="text-2xl leading-snug font-medium">
              “We send invoices the day a project ends and most are paid within a week. The payment link does the chasing for us.”
            </p>
            <footer className="text-sm opacity-80">Maya Lin · Founder, Northwind Studio</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
