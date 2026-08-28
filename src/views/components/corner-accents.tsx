"use client";

import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@/shared/utils/class-names";

const Nested = createContext(false);

export function useNested(): boolean {
  return useContext(Nested);
}

export function MarkNested({ children }: { children: ReactNode }) {
  return <Nested.Provider value={true}>{children}</Nested.Provider>;
}

type AccentScale = "section" | "icon";

const SIZES: Record<AccentScale, string> = {
  section: "h-4 w-4",
  icon: "h-2.5 w-2.5",
};

const CORNERS: Record<AccentScale, Record<string, string>> = {
  section: {
    tl: "-left-px -top-px rounded-tl-lg border-l-2 border-t-2",
    tr: "-right-px -top-px rounded-tr-lg border-r-2 border-t-2",
    bl: "-bottom-px -left-px rounded-bl-lg border-b-2 border-l-2",
    br: "-bottom-px -right-px rounded-br-lg border-b-2 border-r-2",
  },
  icon: {
    tl: "-left-px -top-px rounded-tl-md border-l-2 border-t-2",
    tr: "-right-px -top-px rounded-tr-md border-r-2 border-t-2",
    bl: "-bottom-px -left-px rounded-bl-md border-b-2 border-l-2",
    br: "-bottom-px -right-px rounded-br-md border-b-2 border-r-2",
  },
};

export function CornerAccents({ scale = "section" }: { scale?: AccentScale }) {
  return (
    <>
      {Object.entries(CORNERS[scale]).map(([key, spot]) => (
        <span
          key={key}
          aria-hidden="true"
          className={cn("pointer-events-none absolute border-ember", SIZES[scale], spot)}
        />
      ))}
    </>
  );
}
