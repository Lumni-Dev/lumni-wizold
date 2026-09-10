"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/controllers/api.client";
import { useGame } from "@/controllers/game.context";
import { useT } from "@/controllers/use-locale";
import { listPacks } from "@/controllers/store.controller";
import { findPack, type StorePack } from "@/models/data/store-packs";
import { hasVipSubscription, isVip, VIP_PRICE_CENTS, VIP_TRIAL_DAYS } from "@/models/rules/vip";
import { formatDay, formatNumber, formatReais, formatBronze } from "@/shared/utils/format";
import { Button } from "../components/button";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { ConfirmDialog } from "../components/confirm-dialog";
import { PackBanner, PackIcon, usePackArt } from "../components/pack-icon";
import { DataRow } from "../components/data-row";
import { EmptyState } from "../components/empty-state";
import { List, ListRow, RowText } from "../components/list";
import { Pagination } from "../components/pagination";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
import { Tooltip } from "../components/tooltip";
import { PageHeader } from "../layout/page-header";

interface HistoryEntry {
  id: string;
  packId: string;
  priceCents: number;
  status: string;
  at: string;
}

interface HistoryView {
  entries: HistoryEntry[];
  page: number;
  pages: number;
  total: number;
}

const STATUS_LABEL: Record<string, string> = {
  opened: "Awaiting payment",
  approved: "Approved",
  expired: "Expired",
  refunded: "Refunded",
};

const STATUS_TONE: Record<string, "light" | "neutral" | "faint"> = {
  opened: "neutral",
  approved: "light",
  expired: "faint",
  refunded: "faint",
};

export function StoreScreen() {
  const t = useT();
  const { state, character, buyPack, buyVip, cancelVip, reactivateVip, confirmPayment } =
    useGame();
  const [now] = useState(() => Date.now());
  const [historyPage, setHistoryPage] = useState(1);
  const [historyStamp, setHistoryStamp] = useState(0);
  const [history, setHistory] = useState<HistoryView | null>(null);
  const [cancelingVip, setCancelingVip] = useState(false);

  const offers = useMemo(() => listPacks(state), [state]);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) return;
    window.history.replaceState(null, "", "/store");
    void confirmPayment(sessionId).then(() => setHistoryStamp((stamp) => stamp + 1));
  }, [confirmPayment]);

  useEffect(() => {
    let alive = true;
    void api<HistoryView>("GET", "/api/store/history?page=" + historyPage).then((answer) => {
      if (alive && answer.ok && answer.data) setHistory(answer.data);
    });
    return () => {
      alive = false;
    };
  }, [historyPage, historyStamp]);

  if (!character) return null;

  const vip = isVip(character, now);
  const subscribed = hasVipSubscription(character);

  return (
    <>
      <PageHeader
        title="Wizold Store"
        description="WCoins for money, for those who want to skip the wait. Nothing here buys levels: only the hunt gives experience."
      />

      <Panel
        title="VIP"
        description={
          "New hunters get " +
          VIP_TRIAL_DAYS +
          " days of VIP free. Unlocks every Automation switch in the settings: the run hunts, trains, mines and forges on its own, and recovers on its own. Monthly subscription, cancel whenever you want."
        }
        action={
          vip ? (
            <Tag tone="light">
              {t("Active until") + " " + formatDay(character.vipUntil ?? "")}
            </Tag>
          ) : undefined
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-ink-faint">
              {t(
                subscribed
                  ? character.vipCanceling
                    ? "VIP active until " + formatDay(character.vipUntil ?? "") + ", not renewing."
                    : "Renews on its own every month. Cancel to stop the charge on Stripe."
                  : vip
                    ? "VIP active until " + formatDay(character.vipUntil ?? "") + "."
                    : "New hunters get " +
                      VIP_TRIAL_DAYS +
                      " days of VIP free. VIP starts as soon as the payment confirms.",
              )}
            </span>
            {subscribed ? (
              character.vipCanceling ? (
                <Button variant="primary" onClick={() => reactivateVip()}>
                  Reactivate
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setCancelingVip(true)}>
                  Cancel renewal
                </Button>
              )
            ) : (
              <Tooltip
                label={
                  vip
                    ? "VIP is already active until " + formatDay(character.vipUntil ?? "") + "."
                    : undefined
                }
              >
                <Button variant="primary" disabled={vip} onClick={() => buyVip()}>
                  {t("Enable VIP for") + " " + formatReais(VIP_PRICE_CENTS) + t("/month")}
                </Button>
              </Tooltip>
            )}
          </div>
        }
      >
        <p className="text-xs leading-relaxed text-ink-soft">
          {t(
            "Without VIP, each click does one thing only: one hunt, one session, one strike at the vein, one hammer blow. With VIP, the switches in the settings repeat everything on their own and chain together. It is comfort, not a numbers advantage: what the hunt, the training and the mine pay stays the same.",
          )}
        </p>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {offers.map(({ pack, bronze }) => (
          <PackCard key={pack.id} pack={pack} bronze={bronze} onBuy={buyPack} />
        ))}
      </div>

      <Panel
        title="Purchase history"
        description={
          history && history.total > 0
            ? formatNumber(history.total) +
              (history.total === 1 ? " compra registrada." : " compras registradas.")
            : "Every paid pack shows up here, with value, date and status."
        }
        padding="none"
        footer={
          history && history.pages > 1 ? (
            <Pagination page={history.page} pages={history.pages} onChange={setHistoryPage} />
          ) : undefined
        }
      >
        {history === null ? null : history.entries.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No purchases yet"
              description="The first WCoin purchase you pay for opens this list."
            />
          </div>
        ) : (
          <List>
            {history.entries.map((entry) => (
              <ListRow key={entry.id} className="justify-between">
                <RowText
                  title={
                    entry.packId === "vip"
                      ? "VIP subscription"
                      : (findPack(entry.packId)?.name ?? entry.packId)
                  }
                  description={formatDay(entry.at)}
                />
                <span className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-[11px] text-ink-soft">
                    {formatReais(entry.priceCents)}
                  </span>
                  <Tag tone={STATUS_TONE[entry.status] ?? "neutral"}>
                    {STATUS_LABEL[entry.status] ?? entry.status}
                  </Tag>
                </span>
              </ListRow>
            ))}
          </List>
        )}
      </Panel>

      <ConfirmDialog
        open={cancelingVip}
        title="Cancel VIP subscription"
        description="The monthly charge stops renewing on Stripe. VIP stays active until the end of the paid period, and can be reactivated before that."
        confirmLabel="Cancel"
        onCancel={() => setCancelingVip(false)}
        onConfirm={async () => {
          await cancelVip();
          setCancelingVip(false);
        }}
      />
    </>
  );
}

// One offer, wearing the game's own card: the drawing on top, edge to edge,
// then the identity strip, the description, the two numbers and the action.
// The icon frame only shows up when the pouch has no art on disk, which is
// what every other card in the game falls back to as well.
function PackCard({
  pack,
  bronze,
  onBuy,
}: {
  pack: StorePack;
  bronze: number;
  onBuy: (id: string) => void;
}) {
  const t = useT();
  const drawn = Boolean(usePackArt(pack));

  return (
    <Card height="fill" interactive tone={pack.highlight ? "highlighted" : "default"}>
      {drawn ? <PackBanner pack={pack} /> : null}

      <CardHeader>
        {drawn ? null : <PackIcon pack={pack} />}
        <RowText title={pack.name} label="WCoin pack" />
      </CardHeader>

      <CardBody>
        <p className="text-xs leading-relaxed text-ink-soft">{t(pack.description)}</p>
      </CardBody>

      <List className="border-t border-edge">
        <DataRow label="You receive" value={formatBronze(bronze)} />
        <DataRow label="Price" value={formatReais(pack.priceCents)} />
      </List>

      <CardFooter>
        <span />
        <Button variant="primary" onClick={() => onBuy(pack.id)}>
          Buy
        </Button>
      </CardFooter>
    </Card>
  );
}
