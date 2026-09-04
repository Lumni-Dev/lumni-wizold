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
  opened: "Aguardando pagamento",
  approved: "Aprovado",
  expired: "Expirado",
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
        description="WCoins por dinheiro, para quem quer pular a espera. Nada aqui compra nível: experiência só a caça dá."
      />

      <Panel
        title="VIP"
        description="Libera todas as chaves de Automação nas configurações: a partida caça, treina, minera e forja sozinha, e se recupera sozinha. Assinatura mensal, cancele quando quiser."
        action={
          vip ? <Tag tone="light">Ativo até {formatDay(character.vipUntil ?? "")}</Tag> : undefined
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-ink-faint">
              {subscribed
                ? character.vipCanceling
                  ? "Ativo até " + formatDay(character.vipUntil ?? "") + ", sem renovar."
                  : "Renova sozinho a cada mês. Cancele para parar a cobrança no Stripe."
                : "O VIP entra assim que o pagamento confirma."}
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
              <RowText title={pack.name} label="Pacote de WCoins" />
            </CardHeader>

            <CardBody>
              <p className="text-xs leading-relaxed text-ink-soft">{pack.description}</p>
            </CardBody>

            <List className="border-t border-edge">
              <DataRow label="Você recebe" value={formatBronze(bronze)} />
              <DataRow label="Preço" value={formatReais(pack.priceCents)} />
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
        title="Histórico de compras"
        description={
          history && history.total > 0
            ? formatNumber(history.total) +
              (history.total === 1 ? " compra registrada." : " compras registradas.")
            : "Cada pacote pago aparece aqui, com valor, data e status."
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
              title="Nenhuma compra ainda"
              description="A primeira compra de WCoins que você pagar abre esta lista."
            />
          </div>
        ) : (
          <List>
            {history.entries.map((entry) => (
              <ListRow key={entry.id} className="justify-between">
                <RowText
                  title={
                    entry.packId === "vip"
                      ? "Assinatura VIP"
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
        title="Cancelar assinatura VIP"
        description="A cobrança mensal para de renovar no Stripe. O VIP continua ativo até o fim do período já pago, e dá para reativar antes disso."
        confirmLabel="Cancele"
        onCancel={() => setCancelingVip(false)}
        onConfirm={async () => {
          await cancelVip();
          setCancelingVip(false);
        }}
      />
    </>
  );
}
