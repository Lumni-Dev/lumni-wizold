"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/controllers/api.client";
import { useGame } from "@/controllers/game.context";
import { listPacks } from "@/controllers/store.controller";
import { findPack } from "@/models/data/store-packs";
import { formatDay, formatNumber, formatReais, formatBronze } from "@/shared/utils/format";
import { Button } from "../components/button";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
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
  const { state, character, buyPack, confirmPayment } = useGame();
  const [historyPage, setHistoryPage] = useState(1);
  const [historyStamp, setHistoryStamp] = useState(0);
  const [history, setHistory] = useState<HistoryView | null>(null);

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

  return (
    <>
      <PageHeader
        title="Wizold Store"
        description="WCoins por dinheiro, para quem quer pular a espera. Nada aqui compra nível: experiência só a caça dá."
      />

      <Panel
        title="Como o preço é feito"
        description="Pagamento pelo Stripe, e a mesma conta da economia."
      >
        <p className="text-xs leading-relaxed text-ink-soft">
          Cada pacote vale um número de caçadas da sua faixa, não um número solto de WCoins. Uma
          caçada sua paga {formatBronze(offers[0].bronze / offers[0].pack.hunts)} hoje, então é isso
          que o pacote multiplica. Subir de faixa aumenta o que você recebe pelo mesmo preço, e é
          por isso que comprar cedo nunca vira atalho: o pacote entrega tempo, sempre o mesmo tempo.
        </p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        {offers.map(({ pack, bronze, perReal }) => (
          <Card
            key={pack.id}
            height="fill"
            interactive
            tone={pack.highlight ? "highlighted" : "default"}
          >
            <CardHeader>
              <PackIcon pack={pack} size="huge" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm text-ink">{pack.name}</h3>
                <p className="mt-1 truncate text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  Pacote de WCoins
                </p>
              </div>
            </CardHeader>

            <CardBody>
              <p className="text-xs leading-relaxed text-ink-soft">{pack.description}</p>
            </CardBody>

            <List className="border-t border-edge">
              <DataRow label="Caçadas da sua faixa" value={formatNumber(pack.hunts)} />
              <DataRow label="Você recebe" value={formatBronze(bronze)} />
              <DataRow label="Por real" value={formatBronze(perReal)} />
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
                  title={findPack(entry.packId)?.name ?? entry.packId}
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
    </>
  );
}
