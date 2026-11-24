"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { loadSampleDataAction } from "@/actions/demo";
import { Button } from "@/components/ui/button";

export function SampleDataButton() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const r = await loadSampleDataAction();
        setPending(false);
        if (!r.ok) return void toast.error(r.error);
        toast.success("Sample data loaded");
        router.refresh();
      }}
    >
      {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
      Load sample data
    </Button>
  );
}
