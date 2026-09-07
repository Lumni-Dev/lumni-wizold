"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { useT } from "@/controllers/use-locale";
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
  PET_RENAME_PRICE,
  REST_TICK_MS,
} from "@/shared/constants/game";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { sanitizeName } from "@/shared/utils/text";
import { Bar } from "../components/bar";
import { Button } from "../components/button";
import { AiAuditNotice } from "../components/ai-audit-notice";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { RowText } from "../components/list";
import { ConfirmDialog } from "../components/confirm-dialog";
import { Field } from "../components/field";
import { PetArtFill, PetSheetHeader } from "../components/pet-icon";
import { List, ListRow } from "../components/list";
import { SupplyRow } from "../components/supply-row";
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
      <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2">
        {PETS.map((definition) => {
          const chosen = definition.key === gender;

          return (
            <Card
              key={definition.key}
              height="fill"
              tone={chosen ? "highlighted" : "default"}
              interactive={!chosen}
            >
              <CardHeader art={<PetArtFill gender={definition.key} />}>
                <RowText title={definition.label} label={definition.title} />
              </CardHeader>

              <CardBody>
                <p className="text-xs leading-relaxed text-ink-faint">{definition.description}</p>
              </CardBody>

              <CardFooter>
                <span className="text-[11px] text-ink-faint">
                  {chosen ? "Escolhido" : "Available"}
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
        title="Adoption"
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
            label={"Apelido d" + (gender === "male" ? "the male" : "the female")}
            value={name}
            maxLength={NAME_MAX_LENGTH}
            placeholder="What you will call him for the rest of the run"
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
            fullWidth
            disabled={!oldEnough || !affordable || name.trim().length === 0}
          >
            {!oldEnough
              ? "Exige NV " + PET_MIN_LEVEL
              : affordable
                ? "Adotar por " + formatBronze(price)
                : "Faltam " + formatBronze(price - bronze)}
          </Button>
        </form>
      </Panel>

      <ConfirmDialog
        open={confirming}
        title="Adopt"
        description={
          "Adotar é compromisso: soltar depois não devolve WCoin nenhuma, e trocar o " +
          "apelido custa " +
          formatBronze(petRenamePrice(level)) +
          " no canil."
        }
        detail={findPet(gender).label + " - " + name.trim() + " - " + formatBronze(price)}
        confirmLabel="Adopt"
        onCancel={() => setConfirming(false)}
        onConfirm={async () => {
          await adoptPet(gender, name);
          setName("");
          setConfirming(false);
        }}
      />
    </>
  );
}

export function PetScreen() {
  const { state, character, pet, releasePet, renamePet, feedPet, setPetActive } = useGame();
  const t = useT();
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
          description="A wolf hunts better with company. Choose yours and give it a name that stays forever."
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
  const petRenameAffordable = character.bronze >= petRenameCost;

  return (
    <>
      <PageHeader
        title="Mascote"
        description="When along, it joins the fight as its own attack turn, its attributes count as yours, and every hunt at your side earns it experience."
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <Panel title="Companion" padding="none" className="lg:col-span-1">
          <PetSheetHeader gender={pet.gender}>
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">{pet.name}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                {definition.title}
              </p>
            </div>
          </PetSheetHeader>

          <List>
            <DataRow label="Sex" value={definition.label} />
            <DataRow
              label="Level"
              value={formatNumber(petLevelOf(pet)) + " / " + formatNumber(PET_MAX_LEVEL)}
            />
            <DataRow
              label="Energy"
              value={formatNumber(pet.energy) + " / " + formatNumber(maxEnergy)}
            />
            <DataRow label="On the hunt" value={active ? "Yes" : "No"} />
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
            title="State"
            description={
              pet.energy <= 0
                ? "Out of breath, it stops: it does not bite, lends nothing and waits for food or rest."
                : active
                  ? "Along, it bites for you: each bite spends energy, the creature sometimes strikes back at it, and the hunt earns it experience."
                  : "At rest it recovers breath: it risks nothing, lends nothing and learns nothing."
            }
            padding="none"
            footer={
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-ink-faint">
                  {t(
                    active
                      ? pet.name + " caça com você."
                      : whole
                        ? pet.name + " está inteiro, esperando ser chamado."
                        : pet.name +
                          " recupera " +
                          formatNumber(petRestStep(pet)) +
                          " de energia a cada " +
                          REST_TICK_MS / 1000 +
                          " segundos em repouso.",
                  )}
                </span>
                {active ? (
                  <Button variant="secondary" onClick={() => setPetActive(false)}>
                    Repousar
                  </Button>
                ) : (
                  <RecoveryButton
                    recovering={!whole}
                    beat={pet.energy}
                    recoveringLabel="Resting..."
                    label="Come along"
                    onClick={() => setPetActive(true)}
                  />
                )}
              </div>
            }
          >
            <List>
              <ListRow layout="column">
                <Bar
                  label="Energy"
                  current={pet.energy}
                  maximum={maxEnergy}
                  tone="vigor"
                  glows={!active && !whole}
                />
              </ListRow>
            </List>
          </Panel>

          <Panel
            title="Supplies"
            description={
              "O alimento devolve um quarto do fôlego na hora. Sem ele, o repouso faz o mesmo de graça, um passo a cada " +
              REST_TICK_MS / 1000 +
              " segundos."
            }
            padding="none"
          >
            {supplies.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Nothing to feed"
                  description="Companion food is sold at the market."
                />
              </div>
            ) : (
              <List>
                {supplies.map(({ item, quantity }) => (
                  <SupplyRow
                    key={item.id}
                    item={item}
                    quantity={quantity}
                    description={"+" + formatNumber(petRationOf(item, pet)) + " de energia"}
                    action={
                      <Button variant="primary" onClick={() => feedPet(item.id)}>
                        Alimentar
                      </Button>
                    }
                  />
                ))}
              </List>
            )}
          </Panel>

          <Panel
            title="Companion name"
            description={
              "A troca custa " + formatBronze(PET_RENAME_PRICE) + " WCoins na hora."
            }
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (newPetName.trim().length > 0) setConfirmingRename(true);
              }}
              className="space-y-3"
            >
              <Field label="Current name" value={pet.name} disabled className="font-mono" />
              <Field
                label="New name"
                value={newPetName}
                maxLength={NAME_MAX_LENGTH}
                placeholder="What the pack will call him"
                autoComplete="off"
                onChange={(event) =>
                  setNewPetName(sanitizeName(event.target.value, NAME_MAX_LENGTH))
                }
              />
              <AiAuditNotice />
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={newPetName.trim().length === 0 || !petRenameAffordable}
              >
                {petRenameAffordable
                  ? "Alterar por " + formatBronze(petRenameCost)
                  : "Faltam " + formatBronze(petRenameCost - character.bronze)}
              </Button>
            </form>
          </Panel>

          <Panel
            title="Kennel"
            description="A released wolf does not come back. The name is freed for the next one."
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
        title="Change name"
        description="The WCoins leave on the spot and the new name applies at once, on the hunt and in the tavern."
        detail={pet.name + " → " + newPetName.trim() + " - " + formatBronze(petRenameCost)}
        confirmLabel="Change"
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
        title="Release the companion"
        description={
          pet.name +
          " foi fiel, mas agora estará livre na floresta. Nada é devolvido, e o apelido fica livre para um próximo lobo, adotado no canil pelo preço cheio."
        }
        confirmLabel="Release"
        onCancel={() => setConfirmingRelease(false)}
        onConfirm={async () => {
          await releasePet();
          setConfirmingRelease(false);
        }}
      />
    </>
  );
}
