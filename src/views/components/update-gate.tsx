"use client";

import { useGame } from "@/controllers/game.context";
import { Button } from "./button";
import { Modal } from "./modal";

// The forced-update prompt. It cannot be dismissed to keep playing: Escape and the
// backdrop are off, so the only way out, the close button or "Atualizar agora",
// reloads the page clearing the cache. A player on a stale build always lands on
// the fresh one.
export function UpdateGate() {
  const { updateAvailable, applyUpdate } = useGame();
  return (
    <Modal
      open={updateAvailable}
      title="Atualização disponível"
      onClose={applyUpdate}
      dismissible={false}
      footer={
        <Button variant="primary" size="medium" fullWidth onClick={applyUpdate}>
          Atualizar agora
        </Button>
      }
    >
      <div className="space-y-3 p-4">
        <p className="text-xs leading-relaxed text-ink-faint">
          Uma nova versão do jogo já está disponível.
        </p>
        <p className="text-xs leading-relaxed text-ink-faint">
          Ao fechar, a página recarrega limpando o cache, para você jogar sempre na versão mais
          recente.
        </p>
      </div>
    </Modal>
  );
}
