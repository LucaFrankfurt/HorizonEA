"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="text-lg font-semibold">Something went wrong</p>
      <p className="max-w-md text-sm text-muted-foreground">{error.message || "An unexpected error occurred."}</p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
