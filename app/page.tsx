import { Button } from "@/components/ui/button";
import { Moon } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <Moon className="size-12 text-primary" />
        <h1 className="text-3xl font-semibold tracking-tight">
          Werewolf Moderator
        </h1>
        <p className="max-w-sm text-muted-foreground">
          Ultimate Deluxe Edition. Guided night actions, full moderator control.
        </p>
      </div>
      {/* ponytail: disabled stub — lobby + role picker wired up in P2. */}
      <Button size="lg" disabled>
        New Game
      </Button>
    </main>
  );
}
