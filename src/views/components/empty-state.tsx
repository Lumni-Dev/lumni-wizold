export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex h-fit flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-edge p-8 text-center">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">{title}</p>
      {description ? <p className="max-w-sm text-xs text-ink-faint">{description}</p> : null}
    </div>
  );
}
