"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { listBoard, listSellable, type BoardEntry } from "@/controllers/bazaar.controller";
import { api } from "@/controllers/api.client";
import {
  BAZAAR_FEE_RATIO,
  bazaarListingFee,
  feeOf,
  MIN_LISTING_CENTS,
  MIN_WITHDRAW_CENTS,
  sellerNet,
} from "@/models/rules/bazaar";
import { listingExpiresAt, type BazaarListing } from "@/models/entities/bazaar";
import { enhancedName } from "@/models/rules/forge";
import {
  formatBronze,
  formatNumber,
  formatReais,
  parseReais,
} from "@/shared/utils/format";
import { ICON_FRAME_INSET } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { clampPage, pageCount, pageOf } from "@/shared/utils/pagination";
import {
  matchesCategoryAndSet,
  setFilterOptions,
  slotCategoryFilterOptions,
  type CategoryFilter,
  type SetFilter,
} from "../presenters/item-filter.presenter";
import { Button } from "../components/button";
import { FilterRow, FilterSelect } from "../components/filter-select";
import { ConfirmDialog } from "../components/confirm-dialog";
import { EmptyState } from "../components/empty-state";
import { FilteredEmptyState } from "../components/filtered-empty-state";
import { Field } from "../components/field";
import { QuantityField } from "../components/quantity-field";
import { ItemIcon } from "../components/item-icon";
import { List, ListRow, RowText } from "../components/list";
import { Modal } from "../components/modal";
import { PaymentModal } from "../components/payment-modal";
import { Pagination } from "../components/pagination";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
import { PageHeader } from "../layout/page-header";

const PAGE_SIZE = 9;

function formatRemaining(ms: number): string {
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(days + "d");
  if (hours > 0 || days > 0) parts.push(hours + "h");
  if (minutes > 0 || hours > 0 || days > 0) parts.push(minutes + "min");
  parts.push(seconds + "s");
  return parts.join(" ");
}

function expiryLine(listing: BazaarListing, now: number): string {
  const remaining = listingExpiresAt(listing) - now;
  if (remaining <= 0) return "Expira a qualquer instante.";
  return "Expira em " + formatRemaining(remaining) + ".";
}

const FEE_LABEL = Math.round(BAZAAR_FEE_RATIO * 100) + "%";

type Flow =
  | { kind: "announce"; itemId: string | null; enhancement: number; quantity: string; price: string }
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
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [set, setSet] = useState<SetFilter>("all");
  const [flow, setFlow] = useState<Flow | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const ownListings = state.bazaarListings;
  const [board, setBoard] = useState<BoardEntry[]>(() => listBoard(state));
  useEffect(() => {
    let alive = true;
    const load = () =>
      void api<{ board: BoardEntry[] }>("GET", "/api/bazaar").then((answer) => {
        if (alive && answer.ok && answer.data) setBoard(answer.data.board);
      });
    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [ownListings]);
  const sellable = useMemo(() => listSellable(state), [state]);

  const filteredBoard = useMemo(
    () =>
      board.filter((entry) => matchesCategoryAndSet(entry.item, category, set)),
    [board, category, set],
  );

  if (!character) return null;

  const listingFee = bazaarListingFee(character.level);

  const currentPage = clampPage(page, filteredBoard.length, PAGE_SIZE);
  const pages = pageCount(filteredBoard.length, PAGE_SIZE);
  const onPage = pageOf(filteredBoard, currentPage, PAGE_SIZE);

  const announcing =
    flow?.kind === "announce" && flow.itemId
      ? (sellable.find(
          (entry) => entry.item.id === flow.itemId && entry.enhancement === flow.enhancement,
        ) ?? null)
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
            onClick={() =>
              setFlow({ kind: "announce", itemId: null, enhancement: 0, quantity: "1", price: "" })
            }
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
        <>
          <FilterRow>
            <FilterSelect
              label="Categoria"
              value={category}
              options={slotCategoryFilterOptions({ includeMaterial: true })}
              onChange={setCategory}
              onPageReset={() => setPage(1)}
            />
            <FilterSelect
              label="Conjunto"
              value={set}
              options={setFilterOptions()}
              onChange={setSet}
              onPageReset={() => setPage(1)}
            />
          </FilterRow>

          {filteredBoard.length === 0 ? (
            <FilteredEmptyState description="Nenhum anúncio combina com a categoria escolhida." />
          ) : (
            <Panel
              title="Anúncios"
              description="O quadro inteiro: os seus primeiro, depois os dos outros caçadores."
              padding="none"
              footer={
                pages > 1 ? (
                  <Pagination page={currentPage} pages={pages} onChange={setPage} />
                ) : undefined
              }
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
                            ? " - " +
                              formatReais(entry.listing.priceCents) +
                              (entry.available > 1 ? " cada" : "")
                            : null}
                          <span className="block">
                            {entry.expired
                              ? "Vencido: remova para recolher as peças."
                              : expiryLine(entry.listing, now)}
                          </span>
                        </>
                      }
                    />
                    <span className="flex shrink-0 items-center gap-3 self-center">
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
                    </span>
                  </ListRow>
                ))}
              </List>
            </Panel>
          )}
        </>
      )}

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
                  setFlow({
                    kind: "announce",
                    itemId: null,
                    enhancement: 0,
                    quantity: "1",
                    price: "",
                  })
                }
              >
                Voltar
              </Button>
              <Button
                variant="primary"
                disabled={
                  askedCents === null ||
                  askedCents < MIN_LISTING_CENTS ||
                  character.bronze < listingFee
                }
                onClick={() => {
                  if (askedCents === null) return;
                  return announceListing(
                    announcing.item.id,
                    askedQuantity,
                    askedCents,
                    announcing.enhancement,
                  ).then((ok) => {
                    if (ok) setFlow(null);
                  });
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
              <div className={cn("flex items-center gap-3", ICON_FRAME_INSET)}>
                <ItemIcon item={announcing.item} />
                <RowText
                  title={enhancedName(announcing.item.name, announcing.enhancement)}
                  description={"Você tem " + formatNumber(announcing.quantity) + "."}
                />
              </div>

              <QuantityField
                hint={"Você tem " + formatNumber(announcing.quantity) + "."}
                aria-label={"Quantidade de " + announcing.item.name + " para anunciar"}
                value={flow.quantity}
                onChange={(quantity) => setFlow({ ...flow, quantity })}
              />

              <Field
                label="Preço por unidade"
                placeholder="R$ 0,00"
                inputMode="numeric"
                className="font-mono"
                hint={"O mínimo é " + formatReais(MIN_LISTING_CENTS) + "."}
                value={flow.price}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "").slice(0, 7);
                  setFlow({ ...flow, price: digits === "" ? "" : formatReais(Number(digits)) });
                }}
              />

              <p className="text-xs leading-relaxed text-ink-faint">
                Anunciar custa {formatBronze(listingFee)}, que não voltam no
                cancelamento. A plataforma fica com {FEE_LABEL} da venda. O anúncio fica no quadro
                até outro caçador pagar por ele: o preço é seu, e a espera também.
              </p>
              {character.bronze < listingFee ? (
                <p className="text-[11px] text-ink-faint">
                  Faltam {formatBronze(listingFee - character.bronze)} para a taxa do
                  anúncio.
                </p>
              ) : null}

              {askedCents !== null && askedCents >= MIN_LISTING_CENTS ? (
                <p className="font-mono text-[11px] text-ink-soft">
                  {formatNumber(askedQuantity)} x {formatReais(askedCents)} - taxa{" "}
                  {formatReais(feeOf(askedCents * askedQuantity))} - você recebe{" "}
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
                <ListRow key={entry.item.id + "@" + entry.enhancement} padding="art">
                  <ItemIcon item={entry.item} />
                  <RowText
                    title={enhancedName(entry.item.name, entry.enhancement)}
                    description={
                      "x" +
                      formatNumber(entry.quantity) +
                      " - sugestão " +
                      formatReais(entry.suggestedCents)
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      setFlow({
                        kind: "announce",
                        itemId: entry.item.id,
                        enhancement: entry.enhancement,
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
            <div className={cn("flex items-center gap-3 border-b border-edge p-4", ICON_FRAME_INSET)}>
              <ItemIcon item={buying.item} />
              <RowText
                title={enhancedName(buying.item.name, buying.listing.enhancement)}
                description={"por " + buying.listing.sellerName}
              />
            </div>

            {buying.available > 1 ? (
              <div className="p-4">
                <QuantityField
                  hint={"Disponíveis: " + formatNumber(buying.available) + "."}
                  value={flow.quantity}
                  onChange={(quantity) => setFlow({ ...flow, quantity })}
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
        onConfirm={async () => {
          if (cancelling) await cancelListing(cancelling);
          setCancelling(null);
        }}
      />
    </>
  );
}
