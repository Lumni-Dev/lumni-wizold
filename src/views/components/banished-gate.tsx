"use client";

import { useT } from "@/controllers/use-locale";
import { Button } from "./button";
import { Modal } from "./modal";

export function BanishedGate({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  return (
    <Modal
      open={open}
      title="Account banned"
      onClose={onClose}
      dismissible={false}
      footer={
        <Button variant="primary" size="medium" fullWidth onClick={onClose}>
          Understood
        </Button>
      }
    >
      <div className="space-y-3 p-4">
        <p className="text-xs leading-relaxed text-ink-faint">
          {t("This account was banned for infringing the platform's guidelines.")}
        </p>
        <p className="text-xs leading-relaxed text-ink-faint">
          {t("Access to the game is blocked and the session will be ended.")}
        </p>
      </div>
    </Modal>
  );
}
