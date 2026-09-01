import { AI_AUDIT_NOTICE } from "@/shared/constants/moderation";

export function AiAuditNotice() {
  return <p className="text-[11px] leading-relaxed text-ink-faint">{AI_AUDIT_NOTICE}</p>;
}
