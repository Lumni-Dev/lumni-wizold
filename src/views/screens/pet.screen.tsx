"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { useT } from "@/controllers/use-locale";
import { detailInventory } from "@/controllers/inventory.controller";
import { PET_DESCRIPTION, PET_TITLE } from "@/models/entities/pet";
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
import { Card, CardArt, CardBody, CardHeader, CardStack } from "../components/card";
import { RowText } from "../components/list";
import { ConfirmDialog } from "../components/confirm-dialog";
import { Field } from "../components/field";
import { PetArtFill, PetKennelArt } from "../components/pet-icon";
import { List, ListRow } from "../components/list";
import { SupplyRow } from "../components/supply-row";
import { Panel } from "../components/panel";
import { RecoveryButton } from "../components/recovery-button";
import { DataRow } from "../components/data-row";
import { EmptyState } from "../components/empty-state";
import { PageHeader } from "../layout/page-header";

function Kennel({ bronze, level }: { bronze: number; level: number }) {
  const { adoptPet } = useGame();
  const t = useT();
  const [name, setName] = useState("");
  const [confirming, setConfirming] = useState(false);

  const price = petPrice(level);
  const oldEnough = level >= PET_MIN_LEVEL;
  const affordable = bronze >= price;

  return (
    <>
      <Card layout="row">
        <CardArt>
          <PetKennelArt />
        </CardArt>

        <CardStack>
          <CardHeader>
            <RowText title="Companion" label={PET_TITLE} />
          </CardHeader>

          <CardBody>
            <p className="text-xs leading-relaxed text-ink-faint">{t(PET_DESCRIPTION)}</p>

            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (oldEnough && name.trim().length > 0) setConfirming(true);
              }}
            >
              <Field
                label="Companion's name"
                value={name}
                maxLength={NAME_MAX_LENGTH}
                placeholder="What you will call it for the rest of the run"
                autoComplete="off"
                onChange={(event) => setName(sanitizeName(event.target.value, NAME_MAX_LENGTH))}
              />
              <p className="text-[11px] text-ink-faint">
                {t(
                  oldEnough
                    ? "The name is given at the door; changing it later costs " +
                        formatBronze(petRenamePrice(level)) +
                        " at the kennel."
                    : "The wolf only hunts beside a LV " + PET_MIN_LEVEL + " or higher.",
                )}
              </p>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={!oldEnough || !affordable || name.trim().length === 0}
              >
                {!oldEnough
                  ? "Requires LV " + PET_MIN_LEVEL
                  : affordable
                    ? "Adopt for " + formatBronze(price)
                    : formatBronze(price - bronze) + " short"}
              </Button>
            </form>
          </CardBody>
        </CardStack>
      </Card>

      <ConfirmDialog
        open={confirming}
        title="Adopt"
        description={
          "Adopting is a commitment: releasing later returns no WCoin, and changing the " +
          "name costs " +
          formatBronze(petRenamePrice(level)) +
          " at the kennel."
        }
        detail={name.trim() + " - " + formatBronze(price)}
        confirmLabel="Adopt"
        onCancel={() => setConfirming(false)}
        onConfirm={async () => {
          await adoptPet(name);
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
          title="Companion"
          description="A wolf hunts better with company. Choose yours and give it a name that stays forever."
        />
        <Kennel bronze={character.bronze} level={character.level} />
      </>
    );
  }

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
        title="Companion"
        description="When along, it joins the fight as its own attack turn, its attributes count as yours, and every hunt at your side earns it experience."
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Panel title="Sheet" padding="none">
            <CardHeader art={<PetArtFill />}>
              <div className="min-w-0 space-y-1">
                <p className="min-w-0 truncate text-sm text-ink">{pet.name}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {t(PET_TITLE)}
                </p>
              </div>
            </CardHeader>

            <List>
              <DataRow
                label="Level"
                value={formatNumber(petLevelOf(pet)) + " / " + formatNumber(PET_MAX_LEVEL)}
              />
              <DataRow
                label="Energy"
                value={formatNumber(pet.energy) + " / " + formatNumber(maxEnergy)}
              />
              <DataRow label="On the hunt" value={active ? "Yes" : "No"} />
            </List>
          </Panel>

          <Panel
            title="Bonus"
            description="What the wolf lends while it hunts at your side."
            padding="none"
          >
            <List>
              {lending.map((attribute) => (
                <DataRow
                  key={attribute.key}
                  label={attribute.name}
                  value={"+" + formatNumber(lends[attribute.key])}
                />
              ))}
            </List>
          </Panel>
        </div>

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
                      ? pet.name + " hunts with you."
                      : whole
                        ? pet.name + " is whole, waiting to be called."
                        : pet.name +
                          " recovers " +
                          formatNumber(petRestStep(pet)) +
                          " energy every " +
                          REST_TICK_MS / 1000 +
                          " seconds at rest.",
                  )}
                </span>
                {active ? (
                  <Button variant="secondary" onClick={() => setPetActive(false)}>
                    Rest
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
              "Food returns a quarter of the breath at once. Without it, rest does the same for free, one step every " +
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
                    description={"+" + formatNumber(petRationOf(item, pet)) + " energy"}
                    action={
                      <Button variant="primary" onClick={() => feedPet(item.id)}>
                        Feed
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
              "The change costs " + formatBronze(PET_RENAME_PRICE) + " on the spot."
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
                placeholder="What the pack will call it"
                autoComplete="off"
                onChange={(event) =>
                  setNewPetName(sanitizeName(event.target.value, NAME_MAX_LENGTH))
                }
              />
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={newPetName.trim().length === 0 || !petRenameAffordable}
              >
                {petRenameAffordable
                  ? "Change for " + formatBronze(petRenameCost)
                  : formatBronze(petRenameCost - character.bronze) + " short"}
              </Button>
            </form>
          </Panel>

          <Panel
            title="Kennel"
            description="A released wolf does not come back. The name is freed for the next one."
            footer={
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-ink-faint">{t("Releasing pays nothing.")}</span>
                <Button variant="outline" onClick={() => setConfirmingRelease(true)}>
                  Release
                </Button>
              </div>
            }
          >
            <p className="text-xs leading-relaxed text-ink-faint">
              {t(
                "Releasing returns no WCoin: adopting is a commitment. Afterwards another can be adopted at the kennel, and the name is freed to use again. This one is what does not come back.",
              )}
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
          " was loyal, but will now be free in the forest. Nothing is returned, and the name is freed for a next wolf, adopted at the kennel for the full price."
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
