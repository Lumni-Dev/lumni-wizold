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
    tl: "rounded-tl-lg border-l border-t",
    tr: "rounded-tr-lg border-r border-t",
    bl: "rounded-bl-lg border-b border-l",
    br: "rounded-br-lg border-b border-r",
  },
  icon: {
    tl: "rounded-tl-md border-l border-t",
    tr: "rounded-tr-md border-r border-t",
    bl: "rounded-bl-md border-b border-l",
    br: "rounded-br-md border-b border-r",
  },
};

const OFFSETS: Record<"outside" | "inside", Record<string, string>> = {
  outside: {
    tl: "left-0 top-0",
    tr: "right-0 top-0",
    bl: "bottom-0 left-0",
    br: "bottom-0 right-0",
  },
  inside: {
    tl: "-left-px -top-px",
    tr: "-right-px -top-px",
    bl: "-bottom-px -left-px",
    br: "-bottom-px -right-px",
  },
};

export function CornerAccents({
  scale = "section",
  inside = false,
}: {
  scale?: AccentScale;
  inside?: boolean;
}) {
  return (
    <>
      {Object.entries(CORNERS[scale]).map(([key, spot]) => (
        <span
          key={key}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute border-ember",
            SIZES[scale],
            spot,
            OFFSETS[inside ? "inside" : "outside"][key],
          )}
        />
      ))}
    </>
  );
}
