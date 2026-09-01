"use client";

import { useGame } from "@/controllers/game.context";
import { Button } from "./button";
import { Modal } from "./modal";

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
          Ao atualizar, a página recarrega limpando o cache, para você jogar sempre na versão mais
          recente.
        </p>
      </div>
    </Modal>
  );
}
