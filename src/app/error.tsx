"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="text-sm font-medium text-primary">Error</span>
      <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-sm text-muted-foreground">An unexpected error occurred. Please try again.</p>
      <Button onClick={() => retry()}>Try again</Button>
    </main>
  );
}
