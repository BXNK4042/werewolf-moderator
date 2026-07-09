"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/hooks/use-game";
import { resetSetup } from "@/lib/game/setup";
import { loadGame } from "@/lib/game/storage";

export default function Home() {
  const router = useRouter();
  const { setState } = useGame();
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    setHasSaved(loadGame() !== null);
  }, []);

  const newGame = () => {
    setState(resetSetup());
    router.push("/play");
  };

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
      <div className="flex flex-col gap-2">
        <Button size="lg" onClick={newGame}>
          New Game
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => router.push("/play")}
          disabled={!hasSaved}
        >
          Continue
        </Button>
      </div>
    </main>
  );
}
