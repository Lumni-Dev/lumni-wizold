"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useGame } from "@/controllers/game.context";
import { useTavernAlert } from "@/controllers/use-tavern-alert";
import { backgroundRepository } from "@/models/repositories/background.repository";
import { LiveBackdrop } from "../components/live-backdrop";
import { Spinner } from "../components/spinner";
import { GameFooter } from "./game-footer";
import { GameCorner } from "./game-corner";
import { MoonTracker } from "../components/moon-tracker";
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
  const inTavern = pathname.startsWith("/tavern");
  const tavernUnread = useTavernAlert(!inTavern);
  const asideUnread = inTavern ? 0 : tavernUnread;
  const animatedBackground = useSyncExternalStore(
    backgroundRepository.subscribe,
    backgroundRepository.enabled,
    backgroundRepository.serverSnapshot,
  );

  useEffect(() => {
    if (ready && !character) router.replace("/");
  }, [ready, character, router]);

  if (!ready || !character) return <Loading />;

  return (
    <>
      {animatedBackground ? <LiveBackdrop /> : null}
      <div className="relative z-10 flex min-h-screen">
        <Sidebar tavernUnread={asideUnread} />
        <div className="flex min-h-screen w-full min-w-0 flex-col">
          <div className="sticky top-0 z-20">
            <ResourceBar />
          </div>
          <MobileNavigation tavernUnread={asideUnread} />
          <div className="border-b border-edge px-3 py-2 lg:hidden">
            <MoonTracker />
          </div>
          <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 md:p-8">{children}</main>
          <GameFooter />
        </div>
      </div>
      <GameCorner />
    </>
  );
}
