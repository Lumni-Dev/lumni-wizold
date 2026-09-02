"use client";

import { useState, type ReactNode } from "react";
import { Button } from "./button";
import { Modal } from "./modal";

export function ConfirmDialog({
  open,
  title,
  description,
  children,
  detail,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  children?: ReactNode;
  detail?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<unknown>;
  onCancel: () => void;
}) {
  const [pending, setPending] = useState(false);

  const confirm = () => {
    const outcome = onConfirm();
    if (!(outcome instanceof Promise)) return outcome;
    setPending(true);
    return outcome.finally(() => setPending(false));
  };

  return (
    <Modal
      open={open}
      title={title}
      dismissible={!pending}
      onClose={onCancel}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" disabled={pending} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="primary" autoFocus onClick={confirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 p-4">
        <p className="text-xs leading-relaxed text-ink-faint">{description}</p>
        {children}
        {detail ? <p className="font-mono text-[11px] text-ink-soft">{detail}</p> : null}
      </div>
    </Modal>
  );
}
