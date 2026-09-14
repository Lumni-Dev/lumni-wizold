"use client";

import { useEffect, useState, type ReactNode } from "react";
import { setSleeping } from "@/controllers/idle.store";
import { useT } from "@/controllers/use-locale";
import { hadSession } from "@/models/repositories/session-hint.repository";
import { IDLE_SLEEP_MS } from "@/shared/constants/polling";
import { Button } from "./button";
import { Modal } from "./modal";

const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"];
const IDLE_MINUTES = Math.round(IDLE_SLEEP_MS / 60_000);

// A tab left open with nobody at it keeps every heartbeat, poll and loop
// running, and on a free plan that alone spends the month's CPU. After
// IDLE_SLEEP_MS without a gesture the whole game tree under this gate is
// unmounted (every timer dies with its effect, the tavern stream closes on its
// last unsubscribe) and one modal stays; continuing reloads the page, which
// boots the run again from the server, where nothing was lost. The clock only
// arms on a device that has a session: the landing and the login have no
// heartbeats to spare.
export function IdleGate({ children }: { children: ReactNode }) {
  const [asleep, setAsleep] = useState(false);
  const t = useT();

  useEffect(() => {
    if (asleep) return;
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        // Checked here and not at mount: the door is crossed client-side,
        // so the session appears after this gate is already mounted.
        if (!hadSession()) {
          arm();
          return;
        }
        setSleeping(true);
        setAsleep(true);
      }, IDLE_SLEEP_MS);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") arm();
    };
    for (const name of ACTIVITY_EVENTS) window.addEventListener(name, arm, { passive: true });
    document.addEventListener("visibilitychange", onVisible);
    arm();
    return () => {
      window.clearTimeout(timer);
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, arm);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [asleep]);

  if (!asleep) return <>{children}</>;

  const resume = () => window.location.reload();
  return (
    <Modal
      open
      title="Session on hold"
      onClose={resume}
      dismissible={false}
      footer={
        <Button variant="primary" size="medium" fullWidth onClick={resume}>
          Continue
        </Button>
      }
    >
      <div className="space-y-3 p-4">
        <p className="text-xs leading-relaxed text-ink-faint">
          {t(
            "The game went to sleep after " +
              IDLE_MINUTES +
              " minutes without anyone touching it, to spare the server.",
          )}
        </p>
        <p className="text-xs leading-relaxed text-ink-faint">
          {t("Nothing was lost: the run is saved on the server and continues where it stopped.")}
        </p>
      </div>
    </Modal>
  );
}
