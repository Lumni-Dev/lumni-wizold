"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { playSound } from "@/controllers/sound";
import { GAME_NAME, GAME_TAGLINE } from "@/shared/constants/game";
import {
  NAVIGATION,
  SETTINGS_LINK,
  STORE_LINK,
  type NavigationItem,
} from "@/shared/constants/navigation";
import { cn } from "@/shared/utils/class-names";
import { chipClass } from "../components/chip";
import { MoonTracker } from "../components/moon-tracker";
import { NavIcon } from "../components/app-icon";

function Brand() {
  return (
    <Link
      href="/character"
      className="flex h-16 flex-col justify-center gap-1 border-b border-edge px-3"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/ui/logo.webp?v=1" alt={GAME_NAME} className="h-6 w-auto self-start" />
      <p className="text-[10px] tracking-[0.16em] text-ink-faint">{GAME_TAGLINE}</p>
    </Link>
  );
}

function NavLink({
  item,
  active,
  highlighted = false,
}: {
  item: NavigationItem;
  active: boolean;
  highlighted?: boolean;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={() => playSound("ui")}
      className={cn(
        "relative flex items-center rounded-md border transition-colors",
        active
          ? "border-edge-strong bg-surface-high"
          : "border-edge hover:border-edge-strong hover:bg-surface/70",
        highlighted ? "text-ember" : active ? "text-ink" : "text-ink-soft hover:text-ink",
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center border-r border-edge">
        <NavIcon href={item.href} />
      </span>
      <span className="min-w-0 truncate px-3 text-[10px] uppercase tracking-[0.16em]">
        {item.label}
      </span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-edge bg-charcoal/70 backdrop-blur lg:flex">
      <Brand />

      <nav className="flex-1 overflow-y-auto p-3" aria-label="Páginas do jogo">
        <ul className="space-y-3">
          {NAVIGATION.map((item) => (
            <li key={item.href}>
              <NavLink item={item} active={pathname === item.href} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-edge p-3">
        <MoonTracker />
        <NavLink item={STORE_LINK} active={pathname === STORE_LINK.href} highlighted />
        <NavLink item={SETTINGS_LINK} active={pathname === SETTINGS_LINK.href} />
      </div>
    </aside>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  const links = [...NAVIGATION, STORE_LINK, SETTINGS_LINK];

  return (
    <nav
      aria-label="Páginas do jogo"
      className="flex gap-2 overflow-x-auto border-b border-edge bg-charcoal/80 p-3 backdrop-blur lg:hidden"
    >
      {links.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={chipClass(active)}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
