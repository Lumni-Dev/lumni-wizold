"use client";

import { useState, type ReactNode } from "react";
import { formatReais } from "@/shared/utils/format";
import { formatCpf, isFullName, isValidCpf } from "@/shared/utils/document";
import { Button } from "./button";
import { Field } from "./field";
import { Modal } from "./modal";
import { PixQr } from "./pix-qr";

export interface PayerIdentity {
  name: string;
  cpf: string;
  pixKey: string;
}

const EMPTY: PayerIdentity = { name: "", cpf: "", pixKey: "" };

export function PaymentModal({
  open,
  title,
  mode,
  amountCents,
  amountLabel,
  detail,
  note,
  confirmLabel,
  qrValue,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  mode: "charge" | "payout";
  amountCents: number;
  amountLabel: string;
  detail?: ReactNode;
  note: string;
  confirmLabel: string;
  qrValue?: string;
  onClose: () => void;
  onConfirm: (payer: PayerIdentity) => void | Promise<unknown>;
}) {
  const [payer, setPayer] = useState<PayerIdentity>(EMPTY);

  const close = () => {
    setPayer(EMPTY);
    onClose();
  };

  const confirm = () => {
    const outcome = onConfirm(payer);
    if (outcome instanceof Promise) return outcome.finally(() => setPayer(EMPTY));
    setPayer(EMPTY);
    return outcome;
  };

  const needsPix = mode === "payout";
  const ready =
    isFullName(payer.name) &&
    isValidCpf(payer.cpf) &&
    (!needsPix || payer.pixKey.trim().length >= 5);

  return (
    <Modal
      open={open}
      title={title}
      onClose={close}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={close}>
            Cancelar
          </Button>
          <Button variant="primary" disabled={!ready} onClick={confirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {detail}

      <div className="space-y-3 p-4">
        {qrValue ? <PixQr value={qrValue} /> : null}

        <div className="rounded-md border border-edge bg-surface-high/40 px-4 py-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">{amountLabel}</p>
          <p className="mt-1 font-mono text-lg text-ember">{formatReais(amountCents)}</p>
        </div>

        <Field
          label="Nome completo"
          placeholder="Como está no documento"
          maxLength={80}
          autoComplete="off"
          value={payer.name}
          onChange={(event) => setPayer({ ...payer, name: event.target.value })}
        />
        <Field
          label="CPF"
          placeholder="000.000.000-00"
          inputMode="numeric"
          maxLength={14}
          autoComplete="off"
          value={payer.cpf}
          onChange={(event) => setPayer({ ...payer, cpf: formatCpf(event.target.value) })}
        />
        {needsPix ? (
          <Field
            label="Chave Pix"
            placeholder="e-mail, CPF ou chave aleatória"
            maxLength={77}
            autoComplete="off"
            value={payer.pixKey}
            onChange={(event) => setPayer({ ...payer, pixKey: event.target.value })}
          />
        ) : null}

        <p className="text-xs leading-relaxed text-ink-faint">{note}</p>
      </div>
    </Modal>
  );
}
