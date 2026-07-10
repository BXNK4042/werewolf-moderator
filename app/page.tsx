"use client";

import { useRouter } from "next/navigation";
import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/hooks/use-game";

export default function Home() {
  const router = useRouter();
  const { dispatch } = useGame();

  const newGame = () => {
    dispatch({ type: "resetSetup" });
    router.push("/play");
  };

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[38%] size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.62 0.17 250 / 0.18), transparent 70%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-4">
        <Moon className="size-16 text-primary drop-shadow-[0_0_24px_oklch(0.62_0.17_250/0.5)]" />
        <h1 className="max-w-md text-4xl font-semibold tracking-tight sm:text-5xl">
          Werewolf Moderator
        </h1>
        <p className="max-w-sm text-pretty text-muted-foreground">
          Ultimate Deluxe Edition. Guided night actions, full moderator control.
        </p>
      </div>
      <div className="relative flex flex-col gap-2">
        <Button className="h-11 px-6 text-base" onClick={newGame}>
          New Game
        </Button>
        <Button
          className="h-11 px-6 text-base"
          variant="outline"
          onClick={() => router.push("/play")}
        >
          Continue
        </Button>
      </div>
    </main>
  );
}
