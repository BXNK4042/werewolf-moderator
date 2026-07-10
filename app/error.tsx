"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.65 0.19 22 / 0.12), transparent 70%)",
        }}
      />
      <p className="relative text-xs font-medium tracking-wide text-destructive">
        Something went wrong
      </p>
      <h1 className="relative text-2xl font-semibold tracking-tight">
        An unexpected error occurred while running the game.
      </h1>
      <Button className="relative h-11 px-6 text-base" onClick={() => unstable_retry()}>
        Try again
      </Button>
    </main>
  );
}
