"use client";

import { NAME_MAX_LENGTH } from "@/shared/constants/game";
import { sanitizeName } from "@/shared/utils/text";
import { Field } from "./field";

interface HunterSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  accent?: boolean;
  label?: string;
}

export function HunterSearchField({
  value,
  onChange,
  className,
  accent,
  label,
}: HunterSearchFieldProps) {
  return (
    <Field
      loose
      accent={accent}
      label={label}
      className={className}
      aria-label="Buscar caçador pelo nome"
      placeholder="Buscar caçador pelo nome"
      value={value}
      maxLength={NAME_MAX_LENGTH}
      autoComplete="off"
      onChange={(event) => onChange(sanitizeName(event.target.value, NAME_MAX_LENGTH))}
    />
  );
}
