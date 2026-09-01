import type { InputHTMLAttributes } from "react";
import { CONTROL_HEIGHT } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  numeric?: boolean;
}

export function Field({
  label,
  hint,
  numeric = false,
  className,
  onChange,
  ...rest
}: FieldProps) {
  return (
    <label className="block space-y-2">
      {label ? (
        <span className="block text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          {label}
        </span>
      ) : null}
      <input
        className={cn(
          CONTROL_HEIGHT +
            " w-full rounded-md border border-edge bg-surface px-3 text-xs text-ink transition-colors",
          "placeholder:text-ink-faint focus:border-edge-strong focus:outline-none",
          className,
        )}
        {...rest}
        type={numeric ? "text" : rest.type}
        inputMode={numeric ? "numeric" : rest.inputMode}
        onChange={(event) => {
          if (numeric) event.target.value = event.target.value.replace(/\D/g, "");
          onChange?.(event);
        }}
      />
      {hint ? <span className="block text-[10px] text-ink-faint">{hint}</span> : null}
    </label>
  );
}
