import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Not Found</h1>
      <p className="text-muted-foreground">
        This page doesn&apos;t exist in the moderator.
      </p>
      <Link href="/" className={cn(buttonVariants())}>
        Return Home
      </Link>
    </main>
  );
}
