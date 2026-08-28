"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { listPacks } from "@/controllers/store.controller";
import { formatNumber, formatReais, formatBronze } from "@/shared/utils/format";
import { Button } from "../components/button";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { PackIcon } from "../components/pack-icon";
import { DataRow } from "../components/data-row";
import { List } from "../components/list";
import { PaymentModal } from "../components/payment-modal";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
import { PageHeader } from "../layout/page-header";

export function StoreScreen() {
  const { state, character, buyPack } = useGame();
  const [buying, setBuying] = useState<string | null>(null);

  const offers = useMemo(() => listPacks(state), [state]);

  if (!character) return null;

  const chosen = buying ? (offers.find((offer) => offer.pack.id === buying) ?? null) : null;

  return (
    <>
      <PageHeader
        title="Wizold Store"
        description="Bronze por dinheiro, para quem quer pular a espera. Nada aqui compra nível: experiência só a caça dá."
        action={<Tag tone="neutral">{formatBronze(character.bronze)}</Tag>}
      />

      <Panel
        title="Como o preço é feito"
        description="O mesmo Pix do bazar, e a mesma conta da economia."
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
                <span className="text-[11px] text-ink-faint">Pix de demonstração</span>
              )}
              <Button variant="primary" onClick={() => setBuying(pack.id)}>
                Comprar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <PaymentModal
        open={chosen !== null}
        title={chosen ? chosen.pack.name : ""}
        mode="charge"
        amountCents={chosen ? chosen.pack.priceCents : 0}
        amountLabel="Total a pagar"
        qrValue={chosen ? chosen.pack.id + ":" + chosen.bronze + ":" + chosen.pack.priceCents : ""}
        confirmLabel={chosen ? "Pagar " + formatReais(chosen.pack.priceCents) : "Pagar"}
        note="Pix de demonstração: o QR não vale pagamento. Quando a API entrar, é ele que cobra. Por enquanto, confirmar abaixo simula a aprovação e credita o bronze, e nada do que você digitar é guardado."
        detail={
          chosen ? (
            <div className="flex items-center gap-3 border-b border-edge p-4">
              <PackIcon pack={chosen.pack} />
              <div className="min-w-0">
                <p className="truncate text-sm text-ink">{formatBronze(chosen.bronze)}</p>
                <p className="truncate text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {formatNumber(chosen.pack.hunts)} caçadas da sua faixa
                </p>
              </div>
            </div>
          ) : null
        }
        onClose={() => setBuying(null)}
        onConfirm={() => {
          if (!chosen) return;
          void buyPack(chosen.pack.id).then((ok) => {
            if (ok) setBuying(null);
          });
        }}
      />
    </>
  );
}
