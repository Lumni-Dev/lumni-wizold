"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { playSound } from "@/controllers/sound";
import { useT } from "@/controllers/use-locale";
import { GAME_TAGLINE } from "@/shared/constants/game";
import { BRAND_ICON_PATH } from "@/shared/constants/site";
import {
  NAVIGATION,
  SETTINGS_LINK,
  STORE_LINK,
  TUTORIAL_LINK,
  type NavigationItem,
} from "@/shared/constants/navigation";
import { asideRepository } from "@/models/repositories/aside.repository";
import { cn } from "@/shared/utils/class-names";
import { CONTROL_HEIGHT } from "@/shared/constants/ui";
import { chipClass, ChipFrame } from "../components/chip";
import { MoonTracker } from "../components/moon-tracker";
import { FuryModeTracker } from "../components/fury-mode-tracker";
import { Tooltip } from "../components/tooltip";
import { NavIcon } from "../components/app-icon";

function Brand({ collapsed }: { collapsed: boolean }) {
  const t = useT();
  return (
    <Link
      href="/character"
      className={cn(
        "flex h-[74px] items-center gap-3 border-b border-edge",
        collapsed ? "justify-center px-0" : "px-3",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND_ICON_PATH} alt="" className="h-10 w-10 shrink-0 rounded-md" />
      {collapsed ? null : (
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[10px] uppercase leading-relaxed tracking-[0.16em] text-ink-faint">
            {t(GAME_TAGLINE)}
          </p>
        </div>
      )}
    </Link>
  );
}

function NavLink({
  item,
  active,
  collapsed,
  highlighted = false,
  badge = 0,
}: {
  item: NavigationItem;
  active: boolean;
  collapsed: boolean;
  highlighted?: boolean;
  badge?: number;
}) {
  const t = useT();
  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? t(item.label) : undefined}
      onClick={() => playSound("ui")}
      className={cn(
        "relative flex " + CONTROL_HEIGHT + " items-center border-b border-edge transition-colors",
        active ? "bg-surface-high" : "hover:bg-surface/70",
        highlighted ? "text-ember" : active ? "text-ink" : "text-ink-soft hover:text-ink",
      )}
    >
      <span
        className={cn(
          "flex " + CONTROL_HEIGHT + " shrink-0 items-center justify-center",
          collapsed ? "w-full" : "w-8 border-r border-edge",
        )}
      >
        <NavIcon href={item.href} />
      </span>
      {collapsed ? null : (
        <span className="min-w-0 truncate px-3 text-[10px] uppercase tracking-[0.16em]">
          {t(item.label)}
        </span>
      )}
      {badge > 0 ? (
        collapsed ? (
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-ember" />
        ) : (
          <span className="ml-auto mr-2 inline-flex h-4 min-w-4 shrink-0 items-center justify-center self-center rounded border border-ember/70 bg-ember px-1 font-mono text-[10px] font-bold tracking-normal text-base">
            {badge > 9 ? "9+" : badge}
          </span>
        )
      ) : null}
    </Link>
  );
  if (!collapsed) return link;
  return (
    <Tooltip block label={t(item.label)}>
      {link}
    </Tooltip>
  );
}

function TutorialButton({
  active,
  collapsed,
  onClick,
}: {
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const t = useT();
  const button = (
    <button
      type="button"
      onClick={() => {
        playSound("ui");
        onClick();
      }}
      aria-pressed={active}
      aria-label={collapsed ? t(TUTORIAL_LINK.label) : undefined}
      className={cn(
        "relative flex w-full " + CONTROL_HEIGHT + " items-center border-b border-edge transition-colors",
        active
          ? "bg-surface-high text-ink"
          : "text-ink-soft hover:bg-surface/70 hover:text-ink",
      )}
    >
      <span
        className={cn(
          "flex " + CONTROL_HEIGHT + " shrink-0 items-center justify-center",
          collapsed ? "w-full" : "w-8 border-r border-edge",
        )}
      >
        <NavIcon href="tutorial" />
      </span>
      {collapsed ? null : (
        <span className="min-w-0 truncate px-3 text-[10px] uppercase tracking-[0.16em]">
          {t(TUTORIAL_LINK.label)}
        </span>
      )}
    </button>
  );
  if (!collapsed) return button;
  return (
    <Tooltip block label={t(TUTORIAL_LINK.label)}>
      {button}
    </Tooltip>
  );
}

function CollapseButton({ collapsed }: { collapsed: boolean }) {
  const t = useT();
  const label = collapsed ? "Expand menu" : "Collapse menu";
  const button = (
    <button
      type="button"
      onClick={() => {
        playSound("ui");
        asideRepository.setCollapsed(!collapsed);
      }}
      aria-label={t(label)}
      className={cn(
        "relative flex w-full " + CONTROL_HEIGHT + " items-center border-b border-edge text-ink-soft transition-colors hover:bg-surface/70 hover:text-ink",
      )}
    >
      <span
        className={cn(
          "flex " + CONTROL_HEIGHT + " shrink-0 items-center justify-center",
          collapsed ? "w-full" : "w-8 border-r border-edge",
        )}
      >
        {collapsed ? (
          <ChevronRight aria-hidden strokeWidth={1.75} className="h-4 w-4" />
        ) : (
          <ChevronLeft aria-hidden strokeWidth={1.75} className="h-4 w-4" />
        )}
      </span>
      {collapsed ? null : (
        <span className="min-w-0 truncate px-3 text-[10px] uppercase tracking-[0.16em]">
          {t(label)}
        </span>
      )}
    </button>
  );
  if (!collapsed) return button;
  return (
    <Tooltip block label={t(label)}>
      {button}
    </Tooltip>
  );
}

export function Sidebar({
  tavernUnread = 0,
  tutorialOpen = false,
  onOpenTutorial,
}: {
  tavernUnread?: number;
  tutorialOpen?: boolean;
  onOpenTutorial: () => void;
}) {
  const pathname = usePathname();
  const t = useT();
  const collapsed = useSyncExternalStore(
    asideRepository.subscribe,
    asideRepository.collapsed,
    asideRepository.serverSnapshot,
  );

  return (
    <aside
      className={cn(
        "sticky top-2.5 my-2.5 ml-2.5 hidden h-[calc(100svh-1.25rem)] shrink-0 flex-col overflow-hidden rounded-lg border border-edge bg-surface/40 backdrop-blur transition-[width] duration-200 lg:flex",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <Brand collapsed={collapsed} />

      <nav className="flex-1 overflow-y-auto" aria-label={t("Game pages")}>
        <ul>
          {NAVIGATION.map((item) => (
            <li key={item.href}>
              <NavLink
                item={item}
                active={pathname === item.href}
                collapsed={collapsed}
                badge={item.href === "/tavern" ? tavernUnread : 0}
              />
            </li>
          ))}
          <li>
            <TutorialButton active={tutorialOpen} collapsed={collapsed} onClick={onOpenTutorial} />
          </li>
        </ul>
      </nav>

      <div className="border-t border-edge">
        <MoonTracker flush iconOnly={collapsed} />
        <FuryModeTracker iconOnly={collapsed} />
        <NavLink
          item={STORE_LINK}
          active={pathname === STORE_LINK.href}
          collapsed={collapsed}
          highlighted
        />
        <NavLink
          item={SETTINGS_LINK}
          active={pathname === SETTINGS_LINK.href}
          collapsed={collapsed}
        />
        <CollapseButton collapsed={collapsed} />
      </div>
    </aside>
  );
}

export function MobileNavigation({
  tavernUnread = 0,
  tutorialOpen = false,
  onOpenTutorial,
}: {
  tavernUnread?: number;
  tutorialOpen?: boolean;
  onOpenTutorial: () => void;
}) {
  const pathname = usePathname();
  const t = useT();
  const links = [...NAVIGATION, STORE_LINK, SETTINGS_LINK];
  const trackRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const active = trackRef.current?.querySelector('[aria-current="page"]');
    active?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <nav
      ref={trackRef}
      aria-label={t("Game pages")}
      className="mx-2.5 mt-2.5 flex h-14 items-center gap-2 overflow-x-auto rounded-lg border border-edge bg-surface/40 px-3 backdrop-blur lg:hidden"
    >
      {links.map((item) => {
        const active = pathname === item.href;
        const badge = item.href === "/tavern" ? tavernUnread : 0;
        const chip = (
          <ChipFrame active={active}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={chipClass(active)}
            >
              {t(item.label)}
              {badge > 0 ? (
                <span className="ml-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-ember bg-ember px-2 font-mono text-[10px] font-bold tracking-normal text-base">
                  {badge > 9 ? "9+" : badge}
                </span>
              ) : null}
            </Link>
          </ChipFrame>
        );
        if (item.href !== "/wiki") {
          return (
            <span key={item.href} className="shrink-0">
              {chip}
            </span>
          );
        }
        return (
          <span key={item.href} className="contents">
            {chip}
            <ChipFrame active={tutorialOpen}>
              <button
                type="button"
                aria-pressed={tutorialOpen}
                onClick={() => {
                  playSound("ui");
                  onOpenTutorial();
                }}
                className={chipClass(tutorialOpen)}
              >
                {t(TUTORIAL_LINK.label)}
              </button>
            </ChipFrame>
          </span>
        );
      })}
    </nav>
  );
}
