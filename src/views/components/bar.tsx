"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/shared/utils/class-names";
import { formatNumber, percentage } from "@/shared/utils/format";

const STEP_MS = 450;
const LAP_MS = 250;
const REST_MS = 150;
const RESUME_MS = 350;

type BarTone = "light" | "blood" | "ember" | "fury" | "vigor";

const FILLS: Record<BarTone, string> = {
  light: "bg-ember",
  blood: "bg-blood",
  ember: "bg-ember",
  fury: "bg-fury",
  vigor: "bg-vigor",
};

interface BarProps {
  label: ReactNode;
  current: number;
  maximum: number;
  wraps?: boolean;
  tone?: BarTone;
  glows?: boolean;
  jolt?: number;
  className?: string;
}

interface BarPaint {
  value: number;
  instant: boolean;
  speed?: number;
}

export function Bar({
  label,
  current,
  maximum,
  wraps = false,
  tone = "light",
  glows = false,
  jolt = 0,
  className,
}: BarProps) {
  const target = percentage(current, maximum);
  const [paint, setPaint] = useState<BarPaint>({ value: target, instant: false });
  const previous = useRef(target);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (!jolt) return;
    const timers = [
      window.setTimeout(() => setShaking(true), 0),
      window.setTimeout(() => setShaking(false), 380),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [jolt]);

  useEffect(() => {
    const from = previous.current;
    previous.current = target;
    if (target === from) return;

    const timers: number[] = [];
    const at = (delay: number, next: BarPaint) =>
      timers.push(window.setTimeout(() => setPaint(next), delay));

    if (target > from || !wraps) {
      at(0, { value: target, instant: false });
    } else {
      at(0, { value: 100, instant: false, speed: LAP_MS });
      at(LAP_MS, { value: 0, instant: true });
      at(LAP_MS + REST_MS, { value: target, instant: false, speed: RESUME_MS });
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [target, wraps]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">{label}</span>
        <span className="font-mono text-[11px] text-ink-soft">
          {formatNumber(current)}
          <span className="text-ink-faint">/{formatNumber(maximum)}</span>
        </span>
      </div>
      <div
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full border border-ember/45 bg-charcoal",
          shaking && "bar-shake",
        )}
      >
        <div
          className={cn(
            "striped absolute inset-y-0 left-0 overflow-hidden rounded-full transition-[width] ease-out",
            FILLS[tone],
          )}
          style={{
            width: paint.value + "%",
            transitionDuration: (paint.instant ? 0 : (paint.speed ?? STEP_MS)) + "ms",
          }}
        >
          {glows ? <div className="bar-glow absolute inset-0" /> : null}
        </div>

        <span className="pointer-events-none absolute -inset-px rounded-full border border-ember/0 [border-left-color:var(--color-ember)] [border-right-color:var(--color-ember)]" />
      </div>
    </div>
  );
}
