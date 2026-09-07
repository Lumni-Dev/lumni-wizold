"use client";

import { useGame } from "@/controllers/game.context";
import { GAME_VERSION } from "@/shared/constants/version";
import { Button } from "./button";
import { DataRow } from "./data-row";
import { Modal } from "./modal";

export function UpdateGate() {
  const { updateAvailable, updateVersion, applyUpdate } = useGame();
  return (
    <Modal
      open={updateAvailable}
      title="Update available"
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
        <div className="divide-y divide-line rounded-md border border-line">
          <DataRow label="Current version" value={"v" + GAME_VERSION} />
          {updateVersion ? <DataRow label="New version" value={"v" + updateVersion} /> : null}
        </div>
        <p className="text-xs leading-relaxed text-ink-faint">
          Ao atualizar, a página recarrega limpando o cache. Se você estiver caçando, treinando,
          minerando ou forjando, o trabalho retoma de onde parou.
        </p>
      </div>
    </Modal>
  );
}
