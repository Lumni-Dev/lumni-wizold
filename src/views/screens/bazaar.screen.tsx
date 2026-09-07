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
import {
  formatBronze,
  formatNumber,
  formatReais,
  parseReais,
} from "@/shared/utils/format";
import { ICON_FRAME_INSET } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { clampPage, pageCount, pageOf } from "@/shared/utils/pagination";
import { useT } from "@/controllers/use-locale";
import { normalizeText } from "@/shared/utils/text";
import {
  matchesCategoryAndSet,
  setFilterOptions,
  slotCategoryFilterOptions,
  type CategoryFilter,
  type SetFilter,
} from "../presenters/item-filter.presenter";
import { Button } from "../components/button";
import { FILTER_COLUMN, FilterRow, FilterSelect } from "../components/filter-select";
import { ConfirmDialog } from "../components/confirm-dialog";
import { EmptyState } from "../components/empty-state";
import { FilteredEmptyState } from "../components/filtered-empty-state";
import { Field } from "../components/field";
import { QuantityField } from "../components/quantity-field";
import { ItemCard } from "../components/item-card";
import { ItemIcon } from "../components/item-icon";
import { List, ListRow, RowText } from "../components/list";
import { Modal } from "../components/modal";
import { PaymentModal } from "../components/payment-modal";
import { Pagination } from "../components/pagination";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
import { PageHeader } from "../layout/page-header";

const PAGE_SIZE = 8;

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
  if (remaining <= 0) return "Expires at any moment.";
  return "Expires in " + formatRemaining(remaining) + ".";
}

const FEE_LABEL = Math.round(BAZAAR_FEE_RATIO * 100) + "%";

type Flow =
  | { kind: "announce"; itemId: string | null; enhancement: number; quantity: string; price: string }
  | { kind: "buy"; listingId: string; quantity: string }
  | { kind: "withdraw"; pixKey: string };

export function BazaarScreen() {
  const t = useT();
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
  const [search, setSearch] = useState("");
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

  const filteredBoard = useMemo(() => {
    const wanted = normalizeText(search);
    return board.filter(
      (entry) =>
        matchesCategoryAndSet(entry.item, category, set) &&
        (wanted === "" || normalizeText(entry.item.name).includes(wanted)),
    );
  }, [board, category, set, search]);

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
        title="Bazaar"
        description="Where what left the anvil changes hands for real money. Only forged pieces and fragments enter: what the market sells, the market settles."
        action={
          <Button
            variant="primary"
            onClick={() =>
              setFlow({ kind: "announce", itemId: null, enhancement: 0, quantity: "1", price: "" })
            }
          >
            Announce
          </Button>
        }
      />

      <Panel
        title="Saddlebag"
        description={
          "The leather purse where your sale money lands, already net of the house's cut. Withdrawals " +
          "start at " +
          formatReais(MIN_WITHDRAW_CENTS) +
          "."
        }
        action={<Tag tone="neutral">{formatReais(state.wallet.cents)}</Tag>}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-ink-faint">
              {state.wallet.cents >= MIN_WITHDRAW_CENTS
                ? "Available to withdraw."
                : "The balance grows when a listing of yours sells."}
            </span>
            <Button
              variant="outline"
              disabled={state.wallet.cents < MIN_WITHDRAW_CENTS}
              onClick={() => setFlow({ kind: "withdraw", pixKey: "" })}
            >
              Request withdrawal
            </Button>
          </div>
        }
      >
        <p className="text-xs leading-relaxed text-ink-faint">
          {t("The house keeps") +
            " " +
            FEE_LABEL +
            " " +
            t(
              "of every sale and the rest lands here. A listing stays on the board until another hunter pays for it at the Stripe checkout. This version's withdrawal is a demo: the order is recorded and nothing is transferred yet.",
            )}
        </p>
      </Panel>

      {board.length === 0 ? (
        <EmptyState
          title="Empty board"
          description="No listings right now. Forge a piece or mine fragments and announce."
        />
      ) : (
        <>
          <FilterRow>
            <FilterSelect
              accent
              label="Category"
              value={category}
              options={slotCategoryFilterOptions({ includeMaterial: true })}
              onChange={setCategory}
              onPageReset={() => setPage(1)}
            />
            <FilterSelect
              accent
              label="Set"
              value={set}
              options={setFilterOptions()}
              onChange={setSet}
              onPageReset={() => setPage(1)}
            />
            <div className={FILTER_COLUMN}>
              <Field
                accent
                label="Search"
                aria-label="Search listings by piece name"
                placeholder="Piece name"
                value={search}
                autoComplete="off"
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </FilterRow>

          {filteredBoard.length === 0 ? (
            <FilteredEmptyState description="No listing matches the chosen category." />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {onPage.map((entry) => (
                  <ItemCard
                    key={entry.listing.id}
                    item={entry.item}
                    enhancement={entry.listing.enhancement}
                    quantity={entry.available}
                    highlighted={entry.mine}
                    note={
                      <>
                        <Link
                          href={entry.mine ? "/character" : "/ranking/" + entry.listing.sellerId}
                          className="transition-colors hover:text-highlight"
                        >
                          {entry.mine ? "Your listing" : "por " + entry.listing.sellerName}
                        </Link>
                        {entry.mine
                          ? " - " +
                            formatReais(entry.listing.priceCents) +
                            (entry.available > 1 ? " cada" : "")
                          : null}
                        <span className="block">
                          {entry.expired
                            ? "Expired: remove it to collect the pieces."
                            : expiryLine(entry.listing, now)}
                        </span>
                      </>
                    }
                    footer={
                      <div className="w-full">
                        <Button
                          fullWidth
                          variant={entry.mine ? "outline" : "primary"}
                          onClick={() =>
                            entry.mine
                              ? setCancelling(entry.listing.id)
                              : setFlow({
                                  kind: "buy",
                                  listingId: entry.listing.id,
                                  quantity: "1",
                                })
                          }
                        >
                          {entry.mine
                            ? "Remove"
                            : "Buy for " + formatReais(entry.listing.priceCents)}
                        </Button>
                      </div>
                    }
                  />
                ))}
              </div>

              <Pagination page={currentPage} pages={pages} onChange={setPage} />
            </>
          )}
        </>
      )}

      <Modal
        open={flow?.kind === "announce"}
        title="Announce"
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
                Announce
              </Button>
            </div>
          ) : undefined
        }
      >
        {flow?.kind === "announce" ? (
          announcing ? (
            <div className="space-y-3 p-4">
              <div className={cn("flex items-center gap-3", ICON_FRAME_INSET)}>
                <ItemIcon item={announcing.item} enhancement={announcing.enhancement} />
                <RowText
                  title={announcing.item.name}
                  description={"You have " + formatNumber(announcing.quantity) + "."}
                />
              </div>

              <QuantityField
                hint={"You have " + formatNumber(announcing.quantity) + "."}
                aria-label={"Quantity of " + announcing.item.name + " to announce"}
                value={flow.quantity}
                onChange={(quantity) => setFlow({ ...flow, quantity })}
              />

              <Field
                label="Price per unit"
                placeholder="R$ 0,00"
                inputMode="numeric"
                className="font-mono"
                hint={"The minimum is " + formatReais(MIN_LISTING_CENTS) + "."}
                value={flow.price}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "").slice(0, 7);
                  setFlow({ ...flow, price: digits === "" ? "" : formatReais(Number(digits)) });
                }}
              />

              <p className="text-xs leading-relaxed text-ink-faint">
                {t("Announcing costs") +
                  " " +
                  formatBronze(listingFee) +
                  ", " +
                  t("which does not come back on a cancel. The platform keeps") +
                  " " +
                  FEE_LABEL +
                  " " +
                  t(
                    "of the sale. The listing stays on the board until another hunter pays for it: the price is yours, and so is the wait.",
                  )}
              </p>
              {character.bronze < listingFee ? (
                <p className="text-[11px] text-ink-faint">
                  {t(formatBronze(listingFee - character.bronze) + " short for the listing fee.")}
                </p>
              ) : null}

              {askedCents !== null && askedCents >= MIN_LISTING_CENTS ? (
                <p className="font-mono text-[11px] text-ink-soft">
                  {formatNumber(askedQuantity) +
                    " x " +
                    formatReais(askedCents) +
                    " - " +
                    t("fee") +
                    " " +
                    formatReais(feeOf(askedCents * askedQuantity)) +
                    " - " +
                    t("you receive") +
                    " " +
                    formatReais(sellerNet(askedCents * askedQuantity))}
                </p>
              ) : null}
            </div>
          ) : sellable.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="Nothing eligible"
                description="Forge a piece that is off the body, or mine fragments: that is what the bazaar accepts."
              />
            </div>
          ) : (
            <List>
              {sellable.map((entry) => (
                <ListRow key={entry.item.id + "@" + entry.enhancement} padding="art">
                  <ItemIcon item={entry.item} enhancement={entry.enhancement} />
                  <RowText
                    title={entry.item.name}
                    description={
                      "x" +
                      formatNumber(entry.quantity) +
                      " - suggested " +
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
                    Announce
                  </Button>
                </ListRow>
              ))}
            </List>
          )
        ) : null}
      </Modal>

      <Modal
        open={flow?.kind === "buy"}
        title="Buy"
        onClose={() => setFlow(null)}
        footer={
          flow?.kind === "buy" && buying ? (
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setFlow(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => purchaseListing(buying.listing.id, buyQuantity)}
              >
                {t("Pay") + " " + formatReais(buyTotal)}
              </Button>
            </div>
          ) : undefined
        }
      >
        {flow?.kind === "buy" && buying ? (
          <>
            <div className={cn("flex items-center gap-3 border-b border-edge p-4", ICON_FRAME_INSET)}>
              <ItemIcon item={buying.item} enhancement={buying.listing.enhancement} />
              <RowText
                title={buying.item.name}
                description={
                  <>
                    {t("by") + " " + buying.listing.sellerName}
                    {buying.listing.sellerHouse ? (
                      <span className="block">
                        {t("House listing: the seller is Wizold itself, not another player.")}
                      </span>
                    ) : null}
                  </>
                }
              />
            </div>

            {buying.available > 1 ? (
              <div className="p-4">
                <QuantityField
                  hint={"Available: " + formatNumber(buying.available) + "."}
                  value={flow.quantity}
                  onChange={(quantity) => setFlow({ ...flow, quantity })}
                />
              </div>
            ) : null}

            <p className="px-4 pb-4 text-xs leading-relaxed text-ink-faint">
              {t(
                "Payment opens in the Stripe checkout. As soon as it confirms, the item enters your bag with the bazaar badge and the seller receives in the Saddlebag, already net of the house fee.",
              )}
            </p>
          </>
        ) : null}
      </Modal>

      <PaymentModal
        open={flow?.kind === "withdraw"}
        title="Request withdrawal"
        mode="payout"
        amountCents={state.wallet.cents}
        amountLabel="Available to withdraw"
        confirmLabel="Request"
        note="Withdrawal in this version is a demonstration: the request is recorded with this data and nothing is transferred yet."
        onClose={() => setFlow(null)}
        onConfirm={(payer) =>
          requestWithdraw(payer.pixKey, payer.name, payer.cpf).then((ok) => {
            if (ok) setFlow(null);
          })
        }
      />

      <ConfirmDialog
        open={cancelling !== null}
        title="Remove listing"
        description="The copies return to the bag and the place in the sale queue is lost."
        confirmLabel="Remove"
        onCancel={() => setCancelling(null)}
        onConfirm={async () => {
          if (cancelling) await cancelListing(cancelling);
          setCancelling(null);
        }}
      />
    </>
  );
}
