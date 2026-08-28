"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useGame } from "@/controllers/game.context";
import { GameFooter } from "./game-footer";
import { Toast } from "./toast";
import { MobileNavigation, Sidebar } from "./sidebar";
import { ResourceBar } from "./resource-bar";

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="heading text-[11px] text-ink-faint">Abrindo a noite...</p>
    </div>
  );
}

export function GameFrame({ children }: { children: ReactNode }) {
  const { ready, character } = useGame();
  const router = useRouter();

  useEffect(() => {
    if (ready && !character) router.replace("/");
  }, [ready, character, router]);

  if (!ready || !character) return <Loading />;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen w-full min-w-0 flex-col">
        <ResourceBar />
        <MobileNavigation />
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 md:p-8">{children}</main>
        <GameFooter />
      </div>
      <Toast />
    </div>
  );
}
