"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { playSound } from "@/controllers/sound";
import { GAME_TAGLINE } from "@/shared/constants/game";
import {
  NAVIGATION,
  SETTINGS_LINK,
  STORE_LINK,
  type NavigationItem,
} from "@/shared/constants/navigation";
import { cn } from "@/shared/utils/class-names";
import { CONTROL_HEIGHT } from "@/shared/constants/ui";
import { chipClass, ChipFrame } from "../components/chip";
import { MoonTracker } from "../components/moon-tracker";
import { FuryModeTracker } from "../components/fury-mode-tracker";
import { NavIcon } from "../components/app-icon";

function Brand() {
  return (
    <Link
      href="/character"
      className="flex h-[74px] items-center gap-3 border-b border-edge px-3"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.png" alt="" className="h-10 w-10 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[10px] uppercase leading-relaxed tracking-[0.16em] text-ink-faint">
          {GAME_TAGLINE}
        </p>
      </div>
    </Link>
  );
}

function NavLink({
  item,
  active,
  highlighted = false,
  badge = 0,
}: {
  item: NavigationItem;
  active: boolean;
  highlighted?: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={() => playSound("ui")}
      className={cn(
        "relative flex " + CONTROL_HEIGHT + " items-center rounded-md border transition-colors",
        active
          ? "border-edge-strong bg-surface-high"
          : "border-edge hover:border-edge-strong hover:bg-surface/70",
        highlighted ? "text-ember" : active ? "text-ink" : "text-ink-soft hover:text-ink",
      )}
    >
      <span className={"flex " + CONTROL_HEIGHT + " w-8 shrink-0 items-center justify-center border-r border-edge"}>
        <NavIcon href={item.href} />
      </span>
      <span className="min-w-0 truncate px-3 text-[10px] uppercase tracking-[0.16em]">
        {item.label}
      </span>
      {badge > 0 ? (
        <span className="ml-auto mr-2 inline-flex h-4 min-w-4 shrink-0 items-center justify-center self-center rounded border border-ember bg-ember px-1 font-mono text-[10px] font-bold tracking-normal text-base">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

export function Sidebar({ tavernUnread = 0 }: { tavernUnread?: number }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-edge bg-surface/40 backdrop-blur lg:flex">
      <Brand />

      <nav className="flex-1 overflow-y-auto p-3" aria-label="Páginas do jogo">
        <ul className="space-y-3">
          {NAVIGATION.map((item) => (
            <li key={item.href}>
              <NavLink
                item={item}
                active={pathname === item.href}
                badge={item.href === "/tavern" ? tavernUnread : 0}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-edge p-3">
        <MoonTracker />
        <FuryModeTracker />
        <NavLink item={STORE_LINK} active={pathname === STORE_LINK.href} highlighted />
        <NavLink item={SETTINGS_LINK} active={pathname === SETTINGS_LINK.href} />
      </div>
    </aside>
  );
}

export function MobileNavigation({ tavernUnread = 0 }: { tavernUnread?: number }) {
  const pathname = usePathname();
  const links = [...NAVIGATION, STORE_LINK, SETTINGS_LINK];
  const trackRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const active = trackRef.current?.querySelector('[aria-current="page"]');
    active?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <nav
      ref={trackRef}
      aria-label="Páginas do jogo"
      className="flex h-14 items-center gap-2 overflow-x-auto border-b border-edge bg-surface/40 px-3 backdrop-blur lg:hidden"
    >
      {links.map((item) => {
        const active = pathname === item.href;
        const badge = item.href === "/tavern" ? tavernUnread : 0;
        return (
          <ChipFrame key={item.href} active={active}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={chipClass(active)}
            >
              {item.label}
              {badge > 0 ? (
                <span className="ml-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-ember bg-ember px-2 font-mono text-[10px] font-bold tracking-normal text-base">
                  {badge > 9 ? "9+" : badge}
                </span>
              ) : null}
            </Link>
          </ChipFrame>
        );
      })}
    </nav>
  );
}
