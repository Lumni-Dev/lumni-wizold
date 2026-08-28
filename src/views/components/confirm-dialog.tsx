"use client";

import type { ReactNode } from "react";
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
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="primary" autoFocus onClick={onConfirm}>
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
