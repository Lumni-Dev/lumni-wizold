import type { InputHTMLAttributes } from "react";
import { CONTROL_HEIGHT, LOOSE_CONTROL_SURFACE } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { CornerAccents } from "./corner-accents";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  numeric?: boolean;
  loose?: boolean;
  accent?: boolean;
}

export function Field({
  label,
  hint,
  numeric = false,
  loose: _loose,
  accent = false,
  className,
  onChange,
  maxLength,
  ...rest
}: FieldProps) {
  return (
    <label className="block space-y-2">
      {label ? (
        <span className="block text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          {label}
        </span>
      ) : null}
      <span className="relative block">
        <input
          className={cn(
            CONTROL_HEIGHT + " w-full rounded-md px-3 text-xs text-ink",
            LOOSE_CONTROL_SURFACE +
              " placeholder:text-ink-faint focus:border-edge-strong focus:outline-none",
            className,
          )}
          {...rest}
          maxLength={maxLength}
          type={numeric ? "text" : rest.type}
          inputMode={numeric ? "numeric" : rest.inputMode}
          onChange={(event) => {
            if (numeric) {
              let value = event.target.value.replace(/\D/g, "");
              if (maxLength !== undefined) value = value.slice(0, maxLength);
              event.target.value = value;
            }
            onChange?.(event);
          }}
        />
        {accent ? <CornerAccents scale="icon" inside /> : null}
      </span>
      {hint ? <span className="block text-[10px] text-ink-faint">{hint}</span> : null}
    </label>
  );
}
