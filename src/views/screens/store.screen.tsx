"use client";

import { useEffect, useMemo } from "react";
import { useGame } from "@/controllers/game.context";
import { listPacks } from "@/controllers/store.controller";
import { formatNumber, formatReais, formatBronze } from "@/shared/utils/format";
import { Button } from "../components/button";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { PackIcon } from "../components/pack-icon";
import { DataRow } from "../components/data-row";
import { List } from "../components/list";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
import { PageHeader } from "../layout/page-header";

export function StoreScreen() {
  const { state, character, buyPack, confirmPayment } = useGame();

  const offers = useMemo(() => listPacks(state), [state]);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) return;
    window.history.replaceState(null, "", "/store");
    void confirmPayment(sessionId);
  }, [confirmPayment]);

  if (!character) return null;

  return (
    <>
      <PageHeader
        title="Wizold Store"
        description="Bronze por dinheiro, para quem quer pular a espera. Nada aqui compra nível: experiência só a caça dá."
        action={<Tag tone="neutral">{formatBronze(character.bronze)}</Tag>}
      />

      <Panel
        title="Como o preço é feito"
        description="Pagamento pelo Stripe, e a mesma conta da economia."
      >
        <p className="text-xs leading-relaxed text-ink-soft">
          Cada pacote vale um número de caçadas da sua faixa, não um número solto de bronze. Uma
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
                  Pacote de bronze
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
              {pack.highlight ? (
                <Tag tone="neutral">Melhor troca</Tag>
              ) : (
                <span className="text-[11px] text-ink-faint">Checkout do Stripe</span>
              )}
              <Button variant="primary" onClick={() => buyPack(pack.id)}>
                Comprar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
