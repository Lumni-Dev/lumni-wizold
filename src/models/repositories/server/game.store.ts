import type { PoolClient } from "pg";
import { STATE_VERSION } from "@/shared/constants/game";
import { emptyEquipment, EQUIPMENT_SLOTS, type EquipmentSlot } from "../../entities/item";
import type { BazaarListing, Wallet } from "../../entities/bazaar";
import type { Character, Form, Gender } from "../../entities/character";
import { initialState, type GameState } from "../../entities/game-state";
import type { LogEntry, LogKind } from "../../entities/log-entry";
import type { PackMate } from "../../entities/pack";
import type { Pet, PetGender } from "../../entities/pet";
import { fillAutomation } from "../../entities/automation";

// Translates GameState to rows and back. The database is the save file now:
// collections are replaced wholesale inside the surrounding transaction, and
// the character row is loaded FOR UPDATE so two requests from the same player
// can never interleave. bigint columns arrive as strings from pg; every one
// passes through Number() on the way in.

const int = (value: unknown): number => Number(value ?? 0);
const iso = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : String(value ?? new Date().toISOString());
const stamp = (value: unknown): string | undefined =>
  value instanceof Date ? value.toISOString() : undefined;

interface CharacterRow {
  id: string;
  user_id: string;
  name: string;
  gender: Gender;
  form: Form;
  [key: string]: unknown;
}

function rowToCharacter(row: CharacterRow): Character {
  return {
    id: row.id,
    name: row.name,
    gender: row.gender,
    form: row.form,
    level: int(row.level),
    experience: int(row.experience),
    health: int(row.health),
    rage: int(row.rage),
    bronze: int(row.bronze),
    attributes: {
      strength: int(row.strength),
      agility: int(row.agility),
      endurance: int(row.endurance),
      instinct: int(row.instinct),
      willpower: int(row.willpower),
    },
    trainingProgress: {
      strength: int(row.strength_progress),
      agility: int(row.agility_progress),
      endurance: int(row.endurance_progress),
      instinct: int(row.instinct_progress),
      willpower: int(row.willpower_progress),
    },
    hunts: int(row.hunts),
    wins: int(row.wins),
    losses: int(row.losses),
    arenaWins: int(row.arena_wins),
    arenaLosses: int(row.arena_losses),
    createdAt: iso(row.created_at),
    renamedAt: stamp(row.renamed_at),
    transformedAt: stamp(row.transformed_at),
  };
}

export interface LoadedGame {
  characterId: string;
  state: GameState;
  petRestCollectedAt: string | null;
  activityStartedAt: string | null;
}

export async function loadGame(
  client: PoolClient,
  userId: string,
  lock: boolean,
): Promise<LoadedGame | null> {
  const found = await client.query(
    "select * from characters where user_id = $1" + (lock ? " for update" : ""),
    [userId],
  );
  if (found.rowCount === 0) return null;

  const row = found.rows[0] as CharacterRow;
  const characterId = row.id;
  const character = rowToCharacter(row);

  const [pet, equipped, inventory, enhancements, listings, purchases, duels, pack, wallet, automation, log, activity] =
    await Promise.all([
      client.query("select * from pets where character_id = $1", [characterId]),
      client.query("select slot, item_id from equipped_items where character_id = $1", [characterId]),
      client.query("select item_id, quantity from inventory_items where character_id = $1", [characterId]),
      client.query("select item_id, level from enhancements where character_id = $1", [characterId]),
      client.query(
        "select * from bazaar_listings where seller_id = $1 and status = 'active' order by announced_at",
        [characterId],
      ),
      client.query("select listing_id, quantity from bazaar_purchases where character_id = $1", [characterId]),
      client.query("select opponent_id, dueled_at from arena_duels where character_id = $1", [characterId]),
      client.query("select mate_id, mate_name, added_at from pack_mates where character_id = $1", [characterId]),
      client.query("select cents from wallets where character_id = $1", [characterId]),
      client.query("select * from automation_settings where character_id = $1", [characterId]),
      client.query(
        "select id, kind, message, created_at from log_entries where character_id = $1 order by created_at desc limit 120",
        [characterId],
      ),
      client.query("select started_at from activities where character_id = $1", [characterId]),
    ]);

  const equipment = emptyEquipment();
  for (const entry of equipped.rows) equipment[entry.slot as EquipmentSlot] = entry.item_id;

  const petRow = pet.rows[0];
  const automationRow = automation.rows[0] ?? {};
  const walletValue: Wallet = { cents: int(wallet.rows[0]?.cents) };

  const state: GameState = {
    version: STATE_VERSION,
    character,
    pet: petRow
      ? ({
          id: petRow.id,
          name: petRow.name,
          gender: petRow.gender as PetGender,
          energy: int(petRow.energy),
          active: petRow.active !== false,
          level: int(petRow.level) || 1,
          trainingProgress: int(petRow.training_progress),
          adoptedAt: iso(petRow.adopted_at),
        } satisfies Pet)
      : null,
    mining: { level: int(row.mining_level) || 1, progress: int(row.mining_progress) },
    enhancements: Object.fromEntries(
      enhancements.rows.map((entry) => [entry.item_id, int(entry.level)]),
    ),
    bazaarListings: listings.rows.map(
      (entry): BazaarListing => ({
        id: entry.id,
        sellerId: entry.seller_id,
        sellerName: character.name,
        itemId: entry.item_id,
        enhancement: int(entry.enhancement),
        quantity: int(entry.quantity),
        priceCents: int(entry.price_cents),
        announcedAt: iso(entry.announced_at),
      }),
    ),
    bazaarPurchases: Object.fromEntries(
      purchases.rows.map((entry) => [entry.listing_id, int(entry.quantity)]),
    ),
    arenaDuels: Object.fromEntries(duels.rows.map((entry) => [entry.opponent_id, iso(entry.dueled_at)])),
    pack: pack.rows.map(
      (entry): PackMate => ({ id: entry.mate_id, name: entry.mate_name, addedAt: iso(entry.added_at) }),
    ),
    wallet: walletValue,
    automation: fillAutomation({
      hunt: automationRow.hunt,
      train: automationRow.train,
      mine: automationRow.mine,
      forge: automationRow.forge,
      rest: automationRow.rest,
      transform: automationRow.transform,
      potion: automationRow.potion,
      petFeed: automationRow.pet_feed,
      petRest: automationRow.pet_rest,
    }),
    inventory: inventory.rows.map((entry) => ({ itemId: entry.item_id, quantity: int(entry.quantity) })),
    equipment,
    log: log.rows.map(
      (entry): LogEntry => ({
        id: entry.id,
        kind: entry.kind as LogKind,
        message: entry.message,
        date: iso(entry.created_at),
      }),
    ),
  };

  return {
    characterId,
    state,
    petRestCollectedAt: stamp(petRow?.rest_collected_at) ?? null,
    activityStartedAt: stamp(activity.rows[0]?.started_at) ?? null,
  };
}

interface ReplaceColumn {
  name: string;
  cast: "text" | "integer" | "timestamptz" | "log_kind";
}

async function replace(
  client: PoolClient,
  table: string,
  characterId: string,
  columns: ReplaceColumn[],
  rows: unknown[][],
): Promise<void> {
  await client.query(`delete from ${table} where character_id = $1`, [characterId]);
  if (rows.length === 0) return;

  const arrays = columns.map((_, column) => rows.map((entry) => String(entry[column])));
  const sources = columns.map((_, index) => `$${index + 2}::text[]`).join(", ");
  const names = columns.map((column) => column.name).join(", ");
  const projection = columns
    .map((column, index) => `c${index}::${column.cast}`)
    .join(", ");
  const aliases = columns.map((_, index) => `c${index}`).join(", ");

  await client.query(
    `insert into ${table} (character_id, ${names})
     select $1, ${projection} from unnest(${sources}) as source (${aliases})`,
    [characterId, ...arrays],
  );
}

// The pure controllers keep the reference of every branch they did not touch,
// so reference inequality IS the dirty flag: a hunt writes character, bag,
// diary and maybe the wolf, and never rewrites pack, duels or listings. This
// is what keeps one action a handful of statements instead of a full dump.
export async function saveGame(
  client: PoolClient,
  characterId: string,
  before: GameState,
  after: GameState,
): Promise<void> {
  const character = after.character;
  if (!character) return;

  if (character === before.character && after.mining === before.mining) {
    await savePieces(client, characterId, before, after);
    return;
  }

  await client.query(
    `update characters set
       name = $2, gender = $3, form = $4, level = $5, experience = $6,
       health = $7, rage = $8, bronze = $9,
       strength = $10, agility = $11, endurance = $12, instinct = $13, willpower = $14,
       strength_progress = $15, agility_progress = $16, endurance_progress = $17,
       instinct_progress = $18, willpower_progress = $19,
       mining_level = $20, mining_progress = $21,
       hunts = $22, wins = $23, losses = $24, arena_wins = $25, arena_losses = $26,
       renamed_at = $27, transformed_at = $28
     where id = $1`,
    [
      characterId,
      character.name,
      character.gender,
      character.form,
      character.level,
      character.experience,
      character.health,
      character.rage,
      character.bronze,
      character.attributes.strength,
      character.attributes.agility,
      character.attributes.endurance,
      character.attributes.instinct,
      character.attributes.willpower,
      character.trainingProgress.strength,
      character.trainingProgress.agility,
      character.trainingProgress.endurance,
      character.trainingProgress.instinct,
      character.trainingProgress.willpower,
      after.mining.level,
      after.mining.progress,
      character.hunts,
      character.wins,
      character.losses,
      character.arenaWins,
      character.arenaLosses,
      character.renamedAt ?? null,
      character.transformedAt ?? null,
    ],
  );

  await savePieces(client, characterId, before, after);
}

async function savePieces(
  client: PoolClient,
  characterId: string,
  before: GameState,
  after: GameState,
): Promise<void> {
  if (after.pet !== before.pet) await savePet(client, characterId, before, after);
  if (after.equipment !== before.equipment) await saveEquipment(client, characterId, after);

  if (after.inventory !== before.inventory) {
    await replace(
      client,
      "inventory_items",
      characterId,
      [{ name: "item_id", cast: "text" }, { name: "quantity", cast: "integer" }],
      after.inventory.map((slot) => [slot.itemId, slot.quantity]),
    );
  }

  if (after.enhancements !== before.enhancements) {
    await replace(
      client,
      "enhancements",
      characterId,
      [{ name: "item_id", cast: "text" }, { name: "level", cast: "integer" }],
      Object.entries(after.enhancements).map(([itemId, level]) => [itemId, level]),
    );
  }

  if (after.arenaDuels !== before.arenaDuels) {
    await replace(
      client,
      "arena_duels",
      characterId,
      [{ name: "opponent_id", cast: "text" }, { name: "dueled_at", cast: "timestamptz" }],
      Object.entries(after.arenaDuels).map(([opponent, at]) => [opponent, at]),
    );
  }

  if (after.pack !== before.pack) {
    await replace(
      client,
      "pack_mates",
      characterId,
      [
        { name: "mate_id", cast: "text" },
        { name: "mate_name", cast: "text" },
        { name: "added_at", cast: "timestamptz" },
      ],
      after.pack.map((mate) => [mate.id, mate.name, mate.addedAt]),
    );
  }

  if (after.bazaarPurchases !== before.bazaarPurchases) {
    await replace(
      client,
      "bazaar_purchases",
      characterId,
      [{ name: "listing_id", cast: "text" }, { name: "quantity", cast: "integer" }],
      Object.entries(after.bazaarPurchases).map(([listing, quantity]) => [listing, quantity]),
    );
  }

  if (after.wallet !== before.wallet) await saveWallet(client, characterId, after);
  if (after.automation !== before.automation) await saveAutomation(client, characterId, after);
  if (after.bazaarListings !== before.bazaarListings) {
    await saveListings(client, characterId, before, after);
  }
  if (after.log !== before.log) await saveDiary(client, characterId, before, after);
}

async function savePet(
  client: PoolClient,
  characterId: string,
  before: GameState,
  after: GameState,
): Promise<void> {
  if (after.pet) {
    await client.query(
      `insert into pets (id, character_id, name, gender, energy, active, level, training_progress, adopted_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       on conflict (character_id) do update set
         name = $3, gender = $4, energy = $5, active = $6, level = $7, training_progress = $8`,
      [
        after.pet.id,
        characterId,
        after.pet.name,
        after.pet.gender,
        after.pet.energy,
        after.pet.active !== false,
        after.pet.level ?? 1,
        after.pet.trainingProgress ?? 0,
        after.pet.adoptedAt,
      ],
    );
  } else if (before.pet) {
    await client.query("delete from pets where character_id = $1", [characterId]);
  }
}

async function saveEquipment(
  client: PoolClient,
  characterId: string,
  after: GameState,
): Promise<void> {
  await client.query("delete from equipped_items where character_id = $1", [characterId]);
  const worn = EQUIPMENT_SLOTS.filter((slot) => after.equipment[slot]);
  if (worn.length > 0) {
    await client.query(
      `insert into equipped_items (character_id, slot, item_id)
       select $1, slot::equipment_slot, item
       from unnest($2::text[], $3::text[]) as pieces (slot, item)`,
      [characterId, worn, worn.map((slot) => after.equipment[slot])],
    );
  }
}

async function saveWallet(
  client: PoolClient,
  characterId: string,
  after: GameState,
): Promise<void> {
  await client.query(
    `insert into wallets (character_id, cents) values ($1, $2)
     on conflict (character_id) do update set cents = $2`,
    [characterId, after.wallet.cents],
  );
}

async function saveAutomation(
  client: PoolClient,
  characterId: string,
  after: GameState,
): Promise<void> {
  await client.query(
    `insert into automation_settings
       (character_id, hunt, train, mine, forge, rest, transform, potion, pet_feed, pet_rest)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     on conflict (character_id) do update set
       hunt = $2, train = $3, mine = $4, forge = $5, rest = $6,
       transform = $7, potion = $8, pet_feed = $9, pet_rest = $10`,
    [
      characterId,
      after.automation.hunt,
      after.automation.train,
      after.automation.mine,
      after.automation.forge,
      after.automation.rest,
      after.automation.transform,
      after.automation.potion,
      after.automation.petFeed,
      after.automation.petRest,
    ],
  );
}

// Listings: gone from the state after the action means cancelled (the sold
// ones were already marked by the settle step before the action ran).
async function saveListings(
  client: PoolClient,
  characterId: string,
  before: GameState,
  after: GameState,
): Promise<void> {
  const kept = new Set(after.bazaarListings.map((listing) => listing.id));
  const dropped = before.bazaarListings.filter((listing) => !kept.has(listing.id));
  for (const listing of dropped) {
    await client.query(
      "update bazaar_listings set status = 'cancelled', settled_at = now() where id = $1 and status = 'active'",
      [listing.id],
    );
  }
  const known = new Set(before.bazaarListings.map((listing) => listing.id));
  for (const listing of after.bazaarListings) {
    if (known.has(listing.id)) continue;
    await client.query(
      `insert into bazaar_listings
         (id, seller_id, item_id, enhancement, quantity, price_cents, status, announced_at)
       values ($1, $2, $3, $4, $5, $6, 'active', $7)`,
      [
        listing.id,
        characterId,
        listing.itemId,
        listing.enhancement,
        listing.quantity,
        listing.priceCents,
        listing.announcedAt ?? new Date().toISOString(),
      ],
    );
  }

}

// The diary is append-only: an action writes its one to three new lines and
// one delete trims whatever fell off the 120-line window, instead of the
// old full rewrite of the whole diary on every action.
async function saveDiary(
  client: PoolClient,
  characterId: string,
  before: GameState,
  after: GameState,
): Promise<void> {
  const known = new Set(before.log.map((entry) => entry.id));
  const fresh = after.log.filter((entry) => !known.has(entry.id));

  if (fresh.length > 0) {
    await client.query(
      `insert into log_entries (character_id, id, kind, message, created_at)
       select $1, id, kind::log_kind, message, at::timestamptz
       from unnest($2::text[], $3::text[], $4::text[], $5::text[]) as entries (id, kind, message, at)
       on conflict (id) do nothing`,
      [
        characterId,
        fresh.map((entry) => entry.id),
        fresh.map((entry) => entry.kind),
        fresh.map((entry) => entry.message),
        fresh.map((entry) => entry.date),
      ],
    );
  }

  await client.query(
    "delete from log_entries where character_id = $1 and id <> all($2::text[])",
    [characterId, after.log.map((entry) => entry.id)],
  );
}

export async function markListingsSold(
  client: PoolClient,
  soldIds: readonly string[],
  netCentsById: Readonly<Record<string, number>>,
): Promise<void> {
  for (const id of soldIds) {
    await client.query(
      `update bazaar_listings set status = 'sold', settled_at = now(), net_cents = $2
       where id = $1 and status = 'active'`,
      [id, netCentsById[id] ?? null],
    );
  }
}

export async function recordWalletMovement(
  client: PoolClient,
  characterId: string,
  centsDelta: number,
  reason: "starting_balance" | "bazaar_sale" | "withdrawal" | "adjustment",
  referenceId: string | null,
): Promise<void> {
  if (centsDelta === 0) return;
  await client.query(
    `insert into wallet_movements (character_id, cents_delta, reason, reference_id)
     values ($1, $2, $3, $4)`,
    [characterId, centsDelta, reason, referenceId],
  );
}

export async function insertNewGame(
  client: PoolClient,
  userId: string,
  state: GameState,
): Promise<void> {
  const character = state.character;
  if (!character) throw new Error("Estado sem personagem.");

  await client.query(
    `insert into characters
       (id, user_id, name, gender, form, level, experience, health, rage, bronze,
        strength, agility, endurance, instinct, willpower,
        mining_level, mining_progress, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
    [
      character.id,
      userId,
      character.name,
      character.gender,
      character.form,
      character.level,
      character.experience,
      character.health,
      character.rage,
      character.bronze,
      character.attributes.strength,
      character.attributes.agility,
      character.attributes.endurance,
      character.attributes.instinct,
      character.attributes.willpower,
      state.mining.level,
      state.mining.progress,
      character.createdAt,
    ],
  );

  // initialState() carries fresh references for every branch, so the diff in
  // saveGame writes each piece of the newborn run instead of skipping it.
  await saveGame(client, character.id, initialState(), state);
  await recordWalletMovement(client, character.id, state.wallet.cents, "starting_balance", null);
}

export async function updateActivity(
  client: PoolClient,
  characterId: string,
  activity: {
    kind: string;
    targetId?: string | null;
    paused?: boolean;
    resumeKind?: string | null;
    resumeTargetId?: string | null;
    startedAt?: string;
  } | null,
): Promise<void> {
  if (!activity) {
    await client.query("delete from activities where character_id = $1", [characterId]);
    return;
  }
  await client.query(
    `insert into activities
       (character_id, kind, target_id, paused, resume_kind, resume_target_id, started_at)
     values ($1, $2::activity_kind, $3, $4, $5::activity_kind, $6, $7)
     on conflict (character_id) do update set
       kind = $2::activity_kind, target_id = $3, paused = $4,
       resume_kind = $5::activity_kind, resume_target_id = $6, started_at = $7`,
    [
      characterId,
      activity.kind,
      activity.targetId ?? null,
      activity.paused ?? false,
      activity.resumeKind ?? null,
      activity.resumeTargetId ?? null,
      activity.startedAt ?? new Date().toISOString(),
    ],
  );
}

export async function setPetRestCollectedAt(
  client: PoolClient,
  characterId: string,
  at: string | null,
): Promise<void> {
  await client.query("update pets set rest_collected_at = $2 where character_id = $1", [
    characterId,
    at,
  ]);
}
