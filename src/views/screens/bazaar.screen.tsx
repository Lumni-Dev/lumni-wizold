"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { listBoard, listSellable } from "@/controllers/bazaar.controller";
import {
  BAZAAR_FEE_RATIO,
  feeOf,
  MIN_LISTING_CENTS,
  MIN_WITHDRAW_CENTS,
  sellerNet,
} from "@/models/rules/bazaar";
import { enhancedName } from "@/models/rules/forge";
import { formatNumber, formatReais, parseReais } from "@/shared/utils/format";
import { clampPage, pageCount, pageOf } from "@/shared/utils/pagination";
import { Button } from "../components/button";
import { ConfirmDialog } from "../components/confirm-dialog";
import { EmptyState } from "../components/empty-state";
import { Field } from "../components/field";
import { ItemIcon } from "../components/item-icon";
import { List, ListRow, RowText } from "../components/list";
import { Modal } from "../components/modal";
import { PaymentModal } from "../components/payment-modal";
import { Pagination } from "../components/pagination";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
import { PageHeader } from "../layout/page-header";

const PAGE_SIZE = 9;

const FEE_LABEL = Math.round(BAZAAR_FEE_RATIO * 100) + "%";

type Flow =
  | { kind: "announce"; itemId: string | null; quantity: string; price: string }
  | { kind: "buy"; listingId: string; quantity: string }
  | { kind: "withdraw"; pixKey: string };

export function BazaarScreen() {
  const {
    state,
    character,
    announceListing,
    cancelListing,
    purchaseListing,
    requestWithdraw,
    confirmPayment,
  } = useGame();
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) return;
    window.history.replaceState(null, "", "/bazaar");
    void confirmPayment(sessionId);
  }, [confirmPayment]);
  const [page, setPage] = useState(1);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const board = useMemo(() => listBoard(state), [state]);
  const sellable = useMemo(() => listSellable(state), [state]);

  if (!character) return null;

  const currentPage = clampPage(page, board.length, PAGE_SIZE);
  const pages = pageCount(board.length, PAGE_SIZE);
  const onPage = pageOf(board, currentPage, PAGE_SIZE);

  const announcing =
    flow?.kind === "announce" && flow.itemId
      ? (sellable.find((entry) => entry.item.id === flow.itemId) ?? null)
      : null;
  const buying =
    flow?.kind === "buy"
      ? (board.find((entry) => entry.listing.id === flow.listingId) ?? null)
      : null;

  const askedCents = flow?.kind === "announce" ? parseReais(flow.price) : null;
  const askedQuantity =
    flow?.kind === "announce" && announcing
      ? Math.max(1, Math.min(announcing.quantity, Math.floor(Number(flow.quantity)) || 1))
      : 1;
  const buyQuantity =
    flow?.kind === "buy" && buying
      ? Math.max(1, Math.min(buying.available, Math.floor(Number(flow.quantity)) || 1))
      : 1;
  const buyTotal = buying ? buying.listing.priceCents * buyQuantity : 0;

  return (
    <>
      <PageHeader
        title="Bazar"
        description="Onde o que saiu da bigorna troca de dono por dinheiro de verdade. Só peça forjada e fragmento entram: o que o mercado vende, o mercado resolve."
        action={
          <Button
            variant="primary"
            onClick={() => setFlow({ kind: "announce", itemId: null, quantity: "1", price: "" })}
          >
            Anunciar
          </Button>
        }
      />

      <Panel
        title="Alforje"
        description={
          "A bolsa de couro onde cai o dinheiro das suas vendas, já sem a parte da casa. O saque " +
          "sai a partir de " +
          formatReais(MIN_WITHDRAW_CENTS) +
          "."
        }
        action={<Tag tone="neutral">{formatReais(state.wallet.cents)}</Tag>}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-ink-faint">
              {state.wallet.cents >= MIN_WITHDRAW_CENTS
                ? "Disponível para saque."
                : "O saldo cresce quando um anúncio seu é vendido."}
            </span>
            <Button
              variant="outline"
              disabled={state.wallet.cents < MIN_WITHDRAW_CENTS}
              onClick={() => setFlow({ kind: "withdraw", pixKey: "" })}
            >
              Solicitar saque
            </Button>
          </div>
        }
      >
        <p className="text-xs leading-relaxed text-ink-faint">
          A casa fica com {FEE_LABEL} de cada venda e o resto entra aqui. O anúncio fica no quadro
          até outro caçador pagar por ele no checkout do Stripe. O saque desta versão é de
          demonstração: o pedido fica registrado e nada é transferido ainda.
        </p>
      </Panel>

      {board.length === 0 ? (
        <EmptyState
          title="Quadro vazio"
          description="Nenhum anúncio no momento. Forje uma peça ou minere fragmentos e anuncie."
        />
      ) : (
        <Panel
          title="Anúncios"
          description="O quadro inteiro: os seus primeiro, depois os dos outros caçadores."
          padding="none"
        >
          <List>
            {onPage.map((entry) => (
              <ListRow key={entry.listing.id} padding="art">
                <ItemIcon item={entry.item} />
                <RowText
                  title={enhancedName(entry.item.name, entry.listing.enhancement)}
                  description={
                    <>
                      <Link
                        href={entry.mine ? "/character" : "/ranking/" + entry.listing.sellerId}
                        className="transition-colors hover:text-highlight"
                      >
                        {entry.mine ? "Seu anúncio" : "por " + entry.listing.sellerName}
                      </Link>
                      {entry.mine
                        ? " · " +
                          formatReais(entry.listing.priceCents) +
                          (entry.available > 1 ? " cada" : "")
                        : null}
                    </>
                  }
                />
                {entry.available > 1 ? (
                  <span className="font-mono text-xs text-ink-soft">
                    x{formatNumber(entry.available)}
                  </span>
                ) : null}
                {entry.mine ? (
                  <Button variant="outline" onClick={() => setCancelling(entry.listing.id)}>
                    Remover
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() =>
                      setFlow({
                        kind: "buy",
                        listingId: entry.listing.id,
                        quantity: "1",
                      })
                    }
                  >
                    Comprar {formatReais(entry.listing.priceCents)}
                  </Button>
                )}
              </ListRow>
            ))}
          </List>
        </Panel>
      )}

      <Pagination page={currentPage} pages={pages} onChange={setPage} />

      <Modal
        open={flow?.kind === "announce"}
        title="Anunciar"
        onClose={() => setFlow(null)}
        footer={
          flow?.kind === "announce" && announcing ? (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() =>
                  setFlow({ kind: "announce", itemId: null, quantity: "1", price: "" })
                }
              >
                Voltar
              </Button>
              <Button
                variant="primary"
                disabled={askedCents === null || askedCents < MIN_LISTING_CENTS}
                onClick={() => {
                  if (askedCents === null) return;
                  return announceListing(announcing.item.id, askedQuantity, askedCents).then(
                    (ok) => {
                      if (ok) setFlow(null);
                    },
                  );
                }}
              >
                Anunciar
              </Button>
            </div>
          ) : undefined
        }
      >
        {flow?.kind === "announce" ? (
          announcing ? (
            <div className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <ItemIcon item={announcing.item} />
                <RowText
                  title={enhancedName(announcing.item.name, announcing.enhancement)}
                  description={"Você tem " + formatNumber(announcing.quantity) + "."}
                />
              </div>

              {announcing.quantity > 1 ? (
                <Field
                  compact
                  numeric
                  label="Quantidade"
                  className="font-mono"
                  value={flow.quantity}
                  onChange={(event) => setFlow({ ...flow, quantity: event.target.value })}
                />
              ) : null}

              <Field
                compact
                label="Preço por unidade (R$)"
                placeholder="0,00"
                inputMode="decimal"
                className="font-mono"
                hint={"O mínimo é " + formatReais(MIN_LISTING_CENTS) + "."}
                value={flow.price}
                onChange={(event) => setFlow({ ...flow, price: event.target.value })}
              />

              <p className="text-xs leading-relaxed text-ink-faint">
                A plataforma fica com {FEE_LABEL} da transação. O anúncio fica no quadro até outro
                caçador pagar por ele: o preço é seu, e a espera também.
              </p>

              {askedCents !== null && askedCents >= MIN_LISTING_CENTS ? (
                <p className="font-mono text-[11px] text-ink-soft">
                  {formatNumber(askedQuantity)} x {formatReais(askedCents)} · taxa{" "}
                  {formatReais(feeOf(askedCents * askedQuantity))} · você recebe{" "}
                  {formatReais(sellerNet(askedCents * askedQuantity))}
                </p>
              ) : null}
            </div>
          ) : sellable.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="Nada elegível"
                description="Forje uma peça que não esteja no corpo, ou minere fragmentos: é o que o bazar aceita."
              />
            </div>
          ) : (
            <List>
              {sellable.map((entry) => (
                <ListRow key={entry.item.id} padding="art">
                  <ItemIcon item={entry.item} />
                  <RowText
                    title={enhancedName(entry.item.name, entry.enhancement)}
                    description={
                      "x" +
                      formatNumber(entry.quantity) +
                      " · sugestão " +
                      formatReais(entry.suggestedCents)
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      setFlow({
                        kind: "announce",
                        itemId: entry.item.id,
                        quantity: "1",
                        price: (entry.suggestedCents / 100).toFixed(2).replace(".", ","),
                      })
                    }
                  >
                    Anunciar
                  </Button>
                </ListRow>
              ))}
            </List>
          )
        ) : null}
      </Modal>

      <Modal
        open={flow?.kind === "buy"}
        title="Comprar"
        onClose={() => setFlow(null)}
        footer={
          flow?.kind === "buy" && buying ? (
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setFlow(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => purchaseListing(buying.listing.id, buyQuantity)}
              >
                Pagar {formatReais(buyTotal)}
              </Button>
            </div>
          ) : undefined
        }
      >
        {flow?.kind === "buy" && buying ? (
          <>
            <div className="flex items-center gap-3 border-b border-edge p-4">
              <ItemIcon item={buying.item} />
              <RowText
                title={enhancedName(buying.item.name, buying.listing.enhancement)}
                description={"por " + buying.listing.sellerName}
              />
            </div>

            {buying.available > 1 ? (
              <div className="p-4">
                <Field
                  compact
                  numeric
                  label="Quantidade"
                  hint={"Disponíveis: " + formatNumber(buying.available) + "."}
                  className="font-mono"
                  value={flow.quantity}
                  onChange={(event) => setFlow({ ...flow, quantity: event.target.value })}
                />
              </div>
            ) : null}

            <p className="px-4 pb-4 text-xs leading-relaxed text-ink-faint">
              O pagamento abre no checkout do Stripe. Assim que ele confirma, o item entra na sua
              mochila com a insígnia do bazar e o vendedor recebe no Alforje, já sem a taxa da
              casa.
            </p>
          </>
        ) : null}
      </Modal>

      <PaymentModal
        open={flow?.kind === "withdraw"}
        title="Solicitar saque"
        mode="payout"
        amountCents={state.wallet.cents}
        amountLabel="Disponível para saque"
        confirmLabel="Solicitar"
        note="O saque desta versão é de demonstração: o pedido fica registrado com estes dados e nada é transferido ainda."
        onClose={() => setFlow(null)}
        onConfirm={(payer) =>
          requestWithdraw(payer.pixKey, payer.name, payer.cpf).then((ok) => {
            if (ok) setFlow(null);
          })
        }
      />

      <ConfirmDialog
        open={cancelling !== null}
        title="Remover anúncio"
        description="As cópias voltam para a mochila e o lugar na fila de venda se perde."
        confirmLabel="Remover"
        onCancel={() => setCancelling(null)}
        onConfirm={() => {
          if (cancelling) cancelListing(cancelling);
          setCancelling(null);
        }}
      />
    </>
  );
}
