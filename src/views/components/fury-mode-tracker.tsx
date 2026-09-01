"use client";

import { useEffect, useId, useState } from "react";
import { useGame } from "@/controllers/game.context";

function furyClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(total / 60) + ":" + String(total % 60).padStart(2, "0");
}

export function FuryModeTracker() {
  const { character } = useGame();
  const filterId = useId().replace(/:/g, "");
  const [now, setNow] = useState(() => Date.now());

  const remaining = character?.furyUntil
    ? Math.max(0, Date.parse(character.furyUntil) - now)
    : 0;
  const active = remaining > 0;

  useEffect(() => {
    if (!character?.furyUntil) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [character?.furyUntil]);

  if (!active || !character) return null;

  const clock = furyClock(remaining);

  return (
    <div className="fury-electric-shell">
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id={filterId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02"
              numOctaves="2"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="4s"
                values="0.018;0.026;0.018"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div className="fury-electric-inner">
        <div className="fury-electric-outer">
          <div
            className="fury-electric-card"
            style={{ filter: "url(#" + filterId + ")" }}
          >
            <span aria-hidden="true" className="fury-electric-glow-1" />
            <span aria-hidden="true" className="fury-electric-glow-2" />
            <span aria-hidden="true" className="fury-electric-overlay-1" />
            <span aria-hidden="true" className="fury-electric-overlay-2" />
            <span aria-hidden="true" className="fury-electric-bg-glow" />
            <div className="fury-electric-content">
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink">Modo Fúria</p>
              <p className="font-mono text-[11px] text-ember">{clock}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
