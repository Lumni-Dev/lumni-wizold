import type { ReactNode, Ref } from "react";
import { ICON_FRAME_INSET } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";

type RowLayout = "row" | "column" | "split";

const ROW_LAYOUT: Record<RowPadding, string> = {
  text: "flex items-center gap-3",
  art: "flex items-start gap-3",
};

const LAYOUTS: Record<RowLayout, string> = {
  row: ROW_LAYOUT.text,
  column: "space-y-1",
  split: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
};

export function List({
  children,
  ref,
  className,
}: {
  children: ReactNode;
  ref?: Ref<HTMLUListElement>;
  className?: string;
}) {
  return (
    <ul ref={ref} className={cn("divide-y divide-edge", className)}>
      {children}
    </ul>
  );
}

type RowPadding = "text" | "art";

export function ListRow({
  children,
  layout = "row",
  padding = "text",
  className,
}: {
  children: ReactNode;
  layout?: RowLayout;
  padding?: RowPadding;
  className?: string;
}) {
  return (
    <li
      className={cn(
        padding === "art" ? "p-4" : "px-4 py-3",
        ICON_FRAME_INSET,
        layout === "row" ? ROW_LAYOUT[padding] : LAYOUTS[layout],
        className,
      )}
    >
      {children}
    </li>
  );
}

export function RowText({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm text-ink">{title}</p>
      {description ? <p className="text-[11px] text-ink-faint">{description}</p> : null}
    </div>
  );
}
