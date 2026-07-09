"use client";

import { Lobby } from "@/components/game/lobby";
import { useGame } from "@/lib/hooks/use-game";

export default function PlayPage() {
  const { state } = useGame();
  if (state.phase === "setup") return <Lobby />;
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-xl font-semibold">Moderator board</h1>
      {/* ponytail: P4 builds the board (status bar, player grid, night wizard). */}
      <p className="text-sm text-muted-foreground">Coming in P4.</p>
    </main>
  );
}
