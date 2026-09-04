"use client";

import { Button } from "./button";
import { Modal } from "./modal";

export function BanishedGate({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      title="Conta banida"
      onClose={onClose}
      dismissible={false}
      footer={
        <Button variant="primary" size="medium" fullWidth onClick={onClose}>
          Entendi
        </Button>
      }
    >
      <div className="space-y-3 p-4">
        <p className="text-xs leading-relaxed text-ink-faint">
          Esta conta foi banida por infringir as diretrizes da plataforma.
        </p>
        <p className="text-xs leading-relaxed text-ink-faint">
          O acesso ao jogo está bloqueado e a sessão será encerrada.
        </p>
      </div>
    </Modal>
  );
}
