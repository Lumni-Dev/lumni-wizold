"use client";

export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="text-left text-[10px] uppercase tracking-[0.16em] text-ink-faint transition-colors hover:text-ink"
    >
      Volte ao topo
    </button>
  );
}
