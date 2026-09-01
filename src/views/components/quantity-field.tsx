import { Field } from "./field";
import { cn } from "@/shared/utils/class-names";

interface QuantityFieldProps {
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  className?: string;
  "aria-label"?: string;
}

export function QuantityField({
  value,
  onChange,
  hint,
  className,
  "aria-label": ariaLabel,
}: QuantityFieldProps) {
  return (
    <Field
      numeric
      label="Quantidade"
      hint={hint}
      aria-label={ariaLabel ?? "Quantidade"}
      maxLength={10}
      className={cn("font-mono", className)}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
