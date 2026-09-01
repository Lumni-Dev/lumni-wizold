"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { detailInventory } from "@/controllers/inventory.controller";
import { PETS, findPet, type PetGender } from "@/models/entities/pet";
import { ATTRIBUTES } from "@/models/entities/attribute";
import {
  isPetActive,
  isPetWhole,
  petMaxEnergy,
  petPrice,
  petRationOf,
  petRestStep,
  petLevelBonus,
  petLevelOf,
  servesPet,
  petRenamePrice,
} from "@/models/rules/pet";
import {
  NAME_MAX_LENGTH,
  PET_MAX_LEVEL,
  PET_MIN_LEVEL,
  REST_TICK_MS,
} from "@/shared/constants/game";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { sanitizeName } from "@/shared/utils/text";
import { Bar } from "../components/bar";
import { Button } from "../components/button";
import { AiAuditNotice } from "../components/ai-audit-notice";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { ConfirmDialog } from "../components/confirm-dialog";
import { Field } from "../components/field";
import { ItemIcon } from "../components/item-icon";
import { PetBanner, PetIcon } from "../components/pet-icon";
import { List, ListRow, RowText } from "../components/list";
import { Panel } from "../components/panel";
import { RecoveryButton } from "../components/recovery-button";
import { DataRow } from "../components/data-row";
import { EmptyState } from "../components/empty-state";
import { PageHeader } from "../layout/page-header";

function Kennel({ bronze, level }: { bronze: number; level: number }) {
  const { adoptPet } = useGame();
  const [gender, setGender] = useState<PetGender>("male");
  const [name, setName] = useState("");
  const [confirming, setConfirming] = useState(false);

  const price = petPrice(level);
  const oldEnough = level >= PET_MIN_LEVEL;
  const affordable = bronze >= price;

  return (
    <>
      <div className="grid items-start gap-6 sm:grid-cols-2">
        {PETS.map((definition) => {
          const chosen = definition.key === gender;

          return (
            <Card
              key={definition.key}
              height="fill"
              tone={chosen ? "highlighted" : "default"}
              interactive={!chosen}
            >
              <CardHeader>
                <PetIcon gender={definition.key} size="medium" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{definition.label}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    {definition.title}
                  </p>
                </div>
              </CardHeader>

              <CardBody>
                <p className="text-xs leading-relaxed text-ink-faint">{definition.description}</p>
              </CardBody>

              <CardFooter>
                <span className="text-[11px] text-ink-faint">
                  {chosen ? "Escolhido" : "Disponível no canil"}
                </span>
                <Button
                  variant={chosen ? "secondary" : "outline"}
                  onClick={() => setGender(definition.key)}
                >
                  {chosen ? "Escolhido" : "Escolher"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Panel
        title="Adoção"
        description={
          "O apelido é dado na porta; trocar depois custa " +
          formatBronze(petRenamePrice(level)) +
          " no canil. A adoção exige NV " +
          PET_MIN_LEVEL +
          " e custa " +
          formatBronze(price) +
          "."
        }
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (oldEnough && name.trim().length > 0) setConfirming(true);
          }}
        >
          <Field
            label={"Apelido d" + (gender === "male" ? "o macho" : "a fêmea")}
            value={name}
            maxLength={NAME_MAX_LENGTH}
            placeholder="Como você vai chamá-lo pelo resto da partida"
            autoComplete="off"
            onChange={(event) => setName(sanitizeName(event.target.value, NAME_MAX_LENGTH))}
          />
          <AiAuditNotice />
          {!oldEnough ? (
            <p className="text-[11px] text-ink-faint">
              O lobo só caça ao lado de um NV {PET_MIN_LEVEL} ou mais.
            </p>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            size="medium"
            fullWidth
            disabled={!oldEnough || !affordable || name.trim().length === 0}
          >
            Adotar por {formatBronze(price)}
          </Button>
        </form>
      </Panel>

      <ConfirmDialog
        open={confirming}
        title="Adotar"
        description={
          "Adotar é compromisso: soltar depois não devolve WCoin nenhuma, e trocar o " +
          "apelido custa " +
          formatBronze(petRenamePrice(level)) +
          " no canil."
        }
        detail={findPet(gender).label + " - " + name.trim() + " - " + formatBronze(price)}
        confirmLabel="Adotar"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          adoptPet(gender, name);
          setName("");
          setConfirming(false);
        }}
      />
    </>
  );
}

export function PetScreen() {
  const { state, character, pet, releasePet, renamePet, feedPet, setPetActive } = useGame();
  const [confirmingRelease, setConfirmingRelease] = useState(false);
  const [newPetName, setNewPetName] = useState("");
  const [confirmingRename, setConfirmingRename] = useState(false);

  const supplies = useMemo(
    () => detailInventory(state).filter((slot) => servesPet(slot.item)),
    [state],
  );

  if (!character) return null;

  if (!pet) {
    return (
      <>
        <PageHeader
          title="Mascote"
          description="Um lobo caça melhor acompanhado. Escolha o seu e dê um nome que fica para sempre."
        />
        <Kennel bronze={character.bronze} level={character.level} />
      </>
    );
  }

  const definition = findPet(pet.gender);
  const active = isPetActive(pet);

  const level = petLevelOf(pet);
  const maxEnergy = petMaxEnergy(level);
  const whole = isPetWhole(pet);

  const lends = petLevelBonus(level);
  const ceiling = petLevelBonus(PET_MAX_LEVEL);
  const lending = ATTRIBUTES.filter((attribute) => ceiling[attribute.key] > 0);
  const petRenameCost = petRenamePrice(character.level);

  return (
    <>
      <PageHeader
        title="Mascote"
        description="Acompanhando, ele entra na luta como um turno de ataque, os atributos dele contam como seus, e cada caçada ao seu lado rende experiência para ele."
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Panel title="Companheiro" padding="none" className="lg:col-span-1">
          <PetBanner gender={pet.gender} />
          <div className="border-b border-edge p-4">
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">{pet.name}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                {definition.title}
              </p>
            </div>
          </div>

          <List>
            <DataRow label="Sexo" value={definition.label} />
            <DataRow
              label="Nível"
              value={formatNumber(petLevelOf(pet)) + " / " + formatNumber(PET_MAX_LEVEL)}
            />
            <DataRow
              label="Energia"
              value={formatNumber(pet.energy) + " / " + formatNumber(maxEnergy)}
            />
            <DataRow label="Na caçada" value={active ? "Sim" : "Não"} />
            {lending.map((attribute) => (
              <DataRow
                key={attribute.key}
                label={attribute.name}
                value={"+" + formatNumber(lends[attribute.key])}
              />
            ))}
          </List>
        </Panel>

        <div className="space-y-6 lg:col-span-2">
          <Panel
            title="Estado"
            description={
              pet.energy <= 0
                ? "Sem fôlego, ele para: não morde, não empresta nada e espera comida ou repouso."
                : active
                  ? "Acompanhando, ele morde por você: cada bote gasta energia, a criatura às vezes revida nele, e a caçada rende experiência."
                  : "Em repouso ele recupera fôlego: não arrisca nada, não empresta nada e não aprende nada."
            }
            padding="none"
            footer={
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-ink-faint">
                  {active
                    ? pet.name + " caça com você."
                    : whole
                      ? pet.name + " está inteiro, esperando ser chamado."
                      : pet.name +
                        " recupera " +
                        formatNumber(petRestStep(pet)) +
                        " de energia a cada " +
                        REST_TICK_MS / 1000 +
                        " segundos em repouso."}
                </span>
                {active ? (
                  <Button variant="secondary" onClick={() => setPetActive(false)}>
                    Repousar
                  </Button>
                ) : (
                  <RecoveryButton
                    recovering={!whole}
                    beat={pet.energy}
                    recoveringLabel="Repousando..."
                    label="Acompanhar"
                    onClick={() => setPetActive(true)}
                  />
                )}
              </div>
            }
          >
            <List>
              <ListRow layout="column">
                <Bar
                  label="Energia"
                  current={pet.energy}
                  maximum={maxEnergy}
                  tone="vigor"
                  glows={!active && !whole}
                />
              </ListRow>
            </List>
          </Panel>

          <Panel
            title="Suprimentos"
            description={
              "O alimento devolve metade do fôlego na hora. Sem ele, o repouso faz o mesmo de graça, um passo a cada " +
              REST_TICK_MS / 1000 +
              " segundos."
            }
            padding="none"
          >
            {supplies.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Nada para alimentar"
                  description="O alimento para mascote é vendido no mercado."
                />
              </div>
            ) : (
              <List>
                {supplies.map(({ item, quantity }) => (
                  <ListRow key={item.id} padding="art">
                    <ItemIcon item={item} />
                    <RowText
                      title={item.name}
                      description={"+" + formatNumber(petRationOf(item, pet)) + " de energia"}
                    />
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="font-mono text-xs text-ink-soft">
                        x{formatNumber(quantity)}
                      </span>
                      <Button variant="primary" onClick={() => feedPet(item.id)}>
                        Alimentar
                      </Button>
                    </span>
                  </ListRow>
                ))}
              </List>
            )}
          </Panel>

          <Panel title="Apelido" description="O canil troca os papéis, mas cobra caro por isso.">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (newPetName.trim().length > 0) setConfirmingRename(true);
              }}
              className="space-y-3"
            >
              <Field
                label="Novo apelido"
                value={newPetName}
                maxLength={NAME_MAX_LENGTH}
                placeholder={"Como " + pet.name + " vai atender"}
                autoComplete="off"
                onChange={(event) =>
                  setNewPetName(sanitizeName(event.target.value, NAME_MAX_LENGTH))
                }
              />
              <AiAuditNotice />
              <Button
                type="submit"
                variant="primary"
                size="medium"
                fullWidth
                disabled={newPetName.trim().length === 0}
              >
                Renomear por {formatBronze(petRenameCost)}
              </Button>
            </form>
          </Panel>

          <Panel
            title="Canil"
            description="Um lobo solto não volta. O apelido fica livre para o próximo."
            footer={
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-ink-faint">Soltar não paga nada.</span>
                <Button variant="outline" onClick={() => setConfirmingRelease(true)}>
                  Soltar
                </Button>
              </div>
            }
          >
            <p className="text-xs leading-relaxed text-ink-faint">
              Soltar não devolve WCoin nenhuma: adotar é um compromisso. Depois dá para adotar outro
              no canil, de qualquer linhagem, e o apelido fica livre para usar de novo. Este{" "}
              {pet.name} é que não volta.
            </p>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingRename}
        title="Renomear o mascote"
        description="As WCoins ficam no canil e o apelido novo vale na hora, em todas as telas."
        detail={pet.name + " → " + newPetName.trim() + " - " + formatBronze(petRenameCost)}
        confirmLabel="Renomear"
        onCancel={() => setConfirmingRename(false)}
        onConfirm={() =>
          renamePet(newPetName).then((ok) => {
            if (ok) setNewPetName("");
            setConfirmingRename(false);
          })
        }
      />

      <ConfirmDialog
        open={confirmingRelease}
        title="Soltar o mascote"
        description={
          pet.name +
          " foi fiel, mas agora estará livre na floresta. Nada é devolvido, e o apelido fica livre para um próximo lobo, adotado no canil pelo preço cheio."
        }
        confirmLabel="Soltar"
        onCancel={() => setConfirmingRelease(false)}
        onConfirm={() => {
          releasePet();
          setConfirmingRelease(false);
        }}
      />
    </>
  );
}
