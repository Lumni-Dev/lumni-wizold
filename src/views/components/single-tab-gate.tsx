"use client";

import { useEffect, useSyncExternalStore } from "react";
import { singleTab } from "@/controllers/single-tab";
import { useT } from "@/controllers/use-locale";
import { Button } from "./button";
import { Modal } from "./modal";

export function SingleTabGate() {
  const t = useT();
  useEffect(() => {
    singleTab.start();
  }, []);
  const status = useSyncExternalStore(
    singleTab.subscribe,
    singleTab.status,
    singleTab.serverStatus,
  );

  return (
    <Modal
      open={status === "blocked"}
      title="One window at a time"
      onClose={() => {}}
      dismissible={false}
      footer={
        <Button variant="primary" size="medium" fullWidth onClick={() => singleTab.takeOver()}>
          Play here
        </Button>
      }
    >
      <div className="space-y-3 p-4">
        <p className="text-xs leading-relaxed text-ink-faint">
          {t(
            "The game is already open in another window or tab, including a private one. To keep your hunt tidy, only one window can stay active at a time.",
          )}
        </p>
        <p className="text-xs leading-relaxed text-ink-faint">
          {t(
            "Close the others, or tap Play here to bring the game to this window; the other one starts showing this same notice.",
          )}
        </p>
      </div>
    </Modal>
  );
}
