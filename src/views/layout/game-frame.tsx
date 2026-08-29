"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useGame } from "@/controllers/game.context";
import { useTavernAlert } from "@/controllers/use-tavern-alert";
import { Spinner } from "../components/spinner";
import { GameFooter } from "./game-footer";
import { Toast } from "./toast";
import { MobileNavigation, Sidebar } from "./sidebar";
import { ResourceBar } from "./resource-bar";

function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-ink-faint">
      <Spinner size="medium" />
      <p className="heading text-[11px]">Carregando...</p>
    </div>
  );
}

export function GameFrame({ children }: { children: ReactNode }) {
  const { ready, character } = useGame();
  const router = useRouter();
  const pathname = usePathname();
  useTavernAlert(!pathname.startsWith("/tavern"));

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
