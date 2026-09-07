"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/controllers/api.client";
import { useGame } from "@/controllers/game.context";
import { listPacks } from "@/controllers/store.controller";
import { findPack } from "@/models/data/store-packs";
import { hasVipSubscription, isVip, VIP_PRICE_CENTS } from "@/models/rules/vip";
import { formatDay, formatNumber, formatReais, formatBronze } from "@/shared/utils/format";
import { Button } from "../components/button";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { ConfirmDialog } from "../components/confirm-dialog";
import { PackIcon } from "../components/pack-icon";
import { DataRow } from "../components/data-row";
import { EmptyState } from "../components/empty-state";
import { List, ListRow, RowText } from "../components/list";
import { Pagination } from "../components/pagination";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
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
  refunded: "Devolvido",
};

const STATUS_TONE: Record<string, "light" | "neutral" | "faint"> = {
  opened: "neutral",
  approved: "light",
  expired: "faint",
  refunded: "faint",
};

export function StoreScreen() {
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
        description="Unlocks every Automation switch in the settings: the run hunts, trains, mines and forges on its own, and recovers on its own. Monthly subscription, cancel whenever you want."
        action={
          vip ? <Tag tone="light">Active until {formatDay(character.vipUntil ?? "")}</Tag> : undefined
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-ink-faint">
              {subscribed
                ? character.vipCanceling
                  ? "VIP active until " + formatDay(character.vipUntil ?? "") + ", not renewing."
                  : "Renews on its own every month. Cancel to stop the charge on Stripe."
                : "VIP starts as soon as the payment confirms."}
            </span>
            {subscribed ? (
              character.vipCanceling ? (
                <Button variant="primary" onClick={() => reactivateVip()}>
                  Reative
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setCancelingVip(true)}>
                  Cancele
                </Button>
              )
            ) : (
              <Button variant="primary" onClick={() => buyVip()}>
                Ativar VIP por {formatReais(VIP_PRICE_CENTS)}/mês
              </Button>
            )}
          </div>
        }
      >
        <p className="text-xs leading-relaxed text-ink-soft">
          Sem VIP, cada clique faz uma coisa só: uma caçada, um treino, um golpe na veia, uma
          martelada. Com VIP, as chaves das configurações passam a repetir tudo sozinhas e a se
          encadear. É conforto, não vantagem de números: o que a caça, o treino e a mina rendem
          continua o mesmo.
        </p>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {offers.map(({ pack, bronze }) => (
          <Card
            key={pack.id}
            height="fill"
            interactive
            tone={pack.highlight ? "highlighted" : "default"}
          >
            <CardHeader>
              <PackIcon pack={pack} size="huge" />
              <RowText title={pack.name} label="WCoin pack" />
            </CardHeader>

            <CardBody>
              <p className="text-xs leading-relaxed text-ink-soft">{pack.description}</p>
            </CardBody>

            <List className="border-t border-edge">
              <DataRow label="You receive" value={formatBronze(bronze)} />
              <DataRow label="Price" value={formatReais(pack.priceCents)} />
            </List>

            <CardFooter>
              <span />
              <Button variant="primary" onClick={() => buyPack(pack.id)}>
                Comprar
              </Button>
            </CardFooter>
          </Card>
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
