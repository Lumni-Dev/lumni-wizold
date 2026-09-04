"use client";

import { useEffect, useSyncExternalStore } from "react";
import { singleTab } from "@/controllers/single-tab";
import { Button } from "./button";
import { Modal } from "./modal";

export function SingleTabGate() {
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
      title="Uma janela por vez"
      onClose={() => {}}
      dismissible={false}
      footer={
        <Button variant="primary" size="medium" fullWidth onClick={() => singleTab.takeOver()}>
          Jogar aqui
        </Button>
      }
    >
      <div className="space-y-3 p-4">
        <p className="text-xs leading-relaxed text-ink-faint">
          O jogo já está aberto em outra janela ou aba, incluindo uma anônima. Para não bagunçar a
          sua caçada, só uma janela pode ficar ativa por vez.
        </p>
        <p className="text-xs leading-relaxed text-ink-faint">
          Feche as outras, ou toque em Jogar aqui para trazer o jogo para esta janela; a outra passa
          a mostrar este mesmo aviso.
        </p>
      </div>
    </Modal>
  );
}
