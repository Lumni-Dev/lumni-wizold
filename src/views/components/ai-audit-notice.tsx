import { AI_AUDIT_NOTICE } from "@/shared/constants/moderation";

export function AiAuditNotice({ text = AI_AUDIT_NOTICE }: { text?: string }) {
  return <p className="text-[11px] leading-relaxed text-ink-faint">{text}</p>;
}
