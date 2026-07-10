import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.62 0.17 250 / 0.14), transparent 70%)",
        }}
      />
      <p className="relative text-xs font-medium tracking-wide text-muted-foreground">
        404
      </p>
      <h1 className="relative text-2xl font-semibold tracking-tight">
        This page doesn&apos;t exist in the moderator.
      </h1>
      <Link
        href="/"
        className={cn(buttonVariants({ className: "h-11 px-6 text-base" }))}
      >
        Return Home
      </Link>
    </main>
  );
}
