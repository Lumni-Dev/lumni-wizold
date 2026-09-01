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
type RowAlign = "start" | "center";

function artRowAlign(align: RowAlign): string {
  return align === "start" ? "items-start" : "items-center";
}

export function ListRow({
  children,
  layout = "row",
  padding = "text",
  align = "center",
  className,
}: {
  children: ReactNode;
  layout?: RowLayout;
  padding?: RowPadding;
  align?: RowAlign;
  className?: string;
}) {
  const rowLayout =
    layout === "row"
      ? padding === "art"
        ? "flex gap-3 " + artRowAlign(align)
        : ROW_LAYOUT.text
      : layout === "column"
        ? padding === "art"
          ? "flex flex-col gap-3"
          : LAYOUTS.column
      : LAYOUTS[layout];

  return (
    <li
      className={cn(
        padding === "art" ? "p-4" : "px-4 py-3",
        ICON_FRAME_INSET,
        rowLayout,
        className,
      )}
    >
      {children}
    </li>
  );
}

export function RowText({
  label,
  title,
  description,
}: {
  label?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1">
      {label ? (
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">{label}</p>
      ) : null}
      <p className="truncate text-sm text-ink">{title}</p>
      {description ? <div className="text-[11px] text-ink-faint">{description}</div> : null}
    </div>
  );
}

export function ArtRow({
  art,
  title,
  description,
  trailing,
  align = "center",
}: {
  art: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  align?: RowAlign;
}) {
  return (
    <ListRow padding="art" align={align}>
      {art}
      <RowText title={title} description={description} />
      {trailing}
    </ListRow>
  );
}

export function ArtRowButton({
  art,
  title,
  description,
  trailing,
  align = "center",
  onClick,
  disabled = false,
  pressed,
  className,
}: {
  art: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  align?: RowAlign;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  className?: string;
}) {
  return (
    <ListRow padding="art" align={align} className="p-0">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={pressed}
        className={cn(
          "flex w-full gap-3 p-4 text-left transition-colors",
          align === "start" ? "items-start" : "items-center",
          ICON_FRAME_INSET,
          disabled && "opacity-60",
          className,
        )}
      >
        {art}
        <RowText title={title} description={description} />
        {trailing}
      </button>
    </ListRow>
  );
}
