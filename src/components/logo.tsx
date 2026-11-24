import Link from "next/link";
import { FileCheck2 } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <FileCheck2 className="size-4" />
      </span>
      {siteConfig.name}
    </Link>
  );
}
