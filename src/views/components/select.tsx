"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { playClick } from "@/controllers/sound";
import { CONTROL_HEIGHT, GLASS_CONTROL, GLASS_CONTROL_ACTIVE, GLASS_SECTION } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { ChipFrame } from "./chip";

function selectTriggerClass(active: boolean, className?: string): string {
  return cn(
    "inline-flex " + CONTROL_HEIGHT + " shrink-0 items-center rounded-md border px-3",
    "text-[10px] uppercase tracking-[0.16em] transition-colors",
    active
      ? "border-edge " + GLASS_CONTROL_ACTIVE + " text-ink"
      : "border-edge " + GLASS_CONTROL + " text-ink-soft hover:border-edge-strong hover:bg-surface-high/50 hover:text-ink",
    className,
  );
}
export interface SelectOption {
  value: string;
  label: string;
}
interface SelectProps {
  label?: string;
  placeholder: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  compact?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}
const TYPE_RESET_MS = 800;
export function Select({
  label,
  placeholder,
  value,
  options,
  onChange,
  compact = false,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typedRef = useRef({ text: "", at: 0 });
  const baseId = useId();
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  useEffect(() => {
    if (!open || highlighted < 0) return;
    listRef.current
      ?.querySelector('[data-index="' + highlighted + '"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [open, highlighted]);
  const show = () => {
    setHighlighted(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };
  const pick = (index: number) => {
    const option = options[index];
    if (!option || option.value === value) {
      setOpen(false);
      return;
    }
    playClick();
    onChange(option.value);
    setOpen(false);
  };
  const jumpTo = (typed: string) => {
    const now = Date.now();
    const previous = now - typedRef.current.at < TYPE_RESET_MS ? typedRef.current.text : "";
    const text = previous + typed.toLowerCase();
    typedRef.current = { text, at: now };
    const index = options.findIndex((option) => option.label.toLowerCase().startsWith(text));
    if (index < 0) return;
    if (open) setHighlighted(index);
    else pick(index);
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && !open) {
      event.preventDefault();
      show();
      return;
    }
    if (event.key === "Enter" && open) {
      event.preventDefault();
      pick(highlighted);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        show();
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setHighlighted((current) => Math.min(options.length - 1, Math.max(0, current + step)));
      return;
    }
    if (event.key === "Home" && open) {
      event.preventDefault();
      setHighlighted(0);
      return;
    }
    if (event.key === "End" && open) {
      event.preventDefault();
      setHighlighted(options.length - 1);
      return;
    }
    if (event.key.length === 1 && /[\p{L}\p{N}]/u.test(event.key)) {
      jumpTo(event.key);
    }
  };
  return (
    <div className={cn("block space-y-2", className)}>
      {label ? (
        <span className="block text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          {label}
        </span>
      ) : null}

      <div ref={rootRef} className="relative">
        {compact ? (
          <ChipFrame active={open} className="w-full min-w-0">
            <button
              type="button"
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-controls={baseId + "-list"}
              aria-activedescendant={
                open && highlighted >= 0 ? baseId + "-" + highlighted : undefined
              }
              aria-label={ariaLabel ?? label ?? placeholder}
              disabled={disabled}
              onClick={() => (open ? setOpen(false) : show())}
              onKeyDown={onKeyDown}
              className={cn(
                selectTriggerClass(open || Boolean(selected)),
                "w-full min-w-0 shrink justify-between gap-2",
                disabled && "opacity-60",
              )}
            >
              <span className="truncate">{selected ? selected.label : placeholder}</span>
              <ChevronDown
                aria-hidden
                className={cn(
                  "size-3 shrink-0 text-ink-faint transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>
          </ChipFrame>
        ) : (
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={baseId + "-list"}
            aria-activedescendant={
              open && highlighted >= 0 ? baseId + "-" + highlighted : undefined
            }
            aria-label={ariaLabel ?? label ?? placeholder}
            disabled={disabled}
            onClick={() => (open ? setOpen(false) : show())}
            onKeyDown={onKeyDown}
            className={cn(
              selectTriggerClass(open || Boolean(selected)),
              "w-full min-w-0 justify-between gap-2",
              disabled && "opacity-60",
            )}
          >
            <span className="truncate">{selected ? selected.label : placeholder}</span>
            <ChevronDown
              aria-hidden
              className={cn(
                "size-3 shrink-0 text-ink-faint transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        )}

        {open ? (
          <ul
            ref={listRef}
            id={baseId + "-list"}
            role="listbox"
            className={cn(
              "absolute inset-x-0 top-full z-40 mt-1 max-h-56 overflow-y-auto rounded-md",
              "border border-edge " + GLASS_SECTION + " py-1",
              "shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)]",
            )}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                id={baseId + "-" + index}
                data-index={index}
                role="option"
                aria-selected={option.value === value}
                onMouseEnter={() => setHighlighted(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(index)}
                className={cn(
                  "flex " + CONTROL_HEIGHT + " cursor-pointer items-center px-4",
                  "text-[10px] uppercase tracking-[0.16em] transition-colors",
                  index === highlighted || option.value === value
                    ? GLASS_CONTROL_ACTIVE + " text-ink"
                    : "text-ink-soft hover:bg-surface-high/50 hover:text-ink",
                )}
              >
                {option.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
