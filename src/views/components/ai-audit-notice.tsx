"use client";

import { useT } from "@/controllers/use-locale";
import { AI_AUDIT_NOTICE } from "@/shared/constants/moderation";

export function AiAuditNotice({ text = AI_AUDIT_NOTICE }: { text?: string }) {
  const t = useT();
  return <p className="text-[11px] leading-relaxed text-ink-faint">{t(text)}</p>;
}
