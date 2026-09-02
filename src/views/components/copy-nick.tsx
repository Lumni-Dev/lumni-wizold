"use client";

import { useState } from "react";
import { cn } from "@/shared/utils/class-names";
import { ActionIcon } from "./app-icon";
import { Tooltip } from "./tooltip";

export function CopyValue({
  value,
  noun,
  className,
}: {
  value: string;
  noun: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
    }
  }

  return (
    <Tooltip label={copied ? noun + " copiado" : "Copiar " + noun}>
      <button
        type="button"
        aria-label={"Copiar o " + noun + " " + value}
        onClick={copy}
        className={cn(
          "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-edge text-ink-faint transition-colors hover:border-edge-strong hover:text-highlight",
          className,
        )}
      >
        <ActionIcon action={copied ? "check" : "copy"} className="h-3 w-3" />
      </button>
    </Tooltip>
  );
}

export function CopyNick({ name, className }: { name: string; className?: string }) {
  return <CopyValue value={name} noun="nick" className={className} />;
}
