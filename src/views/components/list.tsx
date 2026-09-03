import type { ReactNode, Ref } from "react";
import { ICON_FRAME_INSET } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";

type RowLayout = "row" | "column" | "split";

const ROW_FLEX = "flex items-center gap-3";

const LAYOUTS: Record<RowLayout, string> = {
  row: ROW_FLEX,
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

type RowPadding = "text" | "art" | "none";

export function ListRow({
  art,
  children,
  layout = "row",
  padding = "text",
  className,
}: {
  art?: ReactNode;
  children: ReactNode;
  layout?: RowLayout;
  padding?: RowPadding;
  className?: string;
}) {
  const rowLayout =
    layout === "row"
      ? ROW_FLEX
      : layout === "column"
        ? padding === "art"
          ? "flex flex-col gap-3"
          : LAYOUTS.column
        : LAYOUTS[layout];

  if (art) {
    return (
      <li className="flex items-stretch">
        <span className="flex aspect-square w-28 shrink-0 overflow-hidden border-r border-edge p-3">
          {art}
        </span>
        <div className={cn("min-w-0 grow px-4 py-3", ICON_FRAME_INSET, rowLayout, className)}>
          {children}
        </div>
      </li>
    );
  }

  return (
    <li
      className={cn(
        padding === "none" ? undefined : padding === "art" ? "p-4" : "px-4 py-3",
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
    <div className="min-w-0 flex-1 space-y-1">
      {label ? (
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">{label}</p>
      ) : null}
      <p className="truncate text-sm text-ink">{title}</p>
      {description ? (
        <div className="text-[11px] leading-relaxed text-ink-faint">{description}</div>
      ) : null}
    </div>
  );
}

export function ArtRow({
  art,
  title,
  description,
  trailing,
}: {
  art: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <ListRow padding="art">
      {art}
      <RowText title={title} description={description} />
      {trailing}
    </ListRow>
  );
}

export function ArtRowButton({
  art,
  divided = false,
  title,
  description,
  trailing,
  onClick,
  disabled = false,
  pressed,
  className,
}: {
  art: ReactNode;
  divided?: boolean;
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  className?: string;
}) {
  if (divided) {
    return (
      <ListRow padding="none">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-pressed={pressed}
          className={cn(
            "flex w-full items-stretch text-left transition-colors",
            ICON_FRAME_INSET,
            disabled && "opacity-60",
            className,
          )}
        >
          <span className="flex aspect-square w-28 shrink-0 overflow-hidden border-r border-edge p-3">
            {art}
          </span>
          <span className="flex min-w-0 grow items-center px-4 py-3">
            <RowText title={title} description={description} />
          </span>
          {trailing ? (
            <span className="flex shrink-0 items-center gap-3 px-4 py-3">{trailing}</span>
          ) : null}
        </button>
      </ListRow>
    );
  }

  return (
    <ListRow padding="none">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={pressed}
        className={cn(
          "flex w-full items-center gap-3 p-4 text-left transition-colors",
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
