import { healthPerLevelFor, VITALS } from "@/shared/constants/tuning/vitals";
import {
  ALCHEMY_TICKS,
  ENHANCEMENT_STEP,
  FORGE_BRONZE_RATIO,
  FORGE_SUCCESS_RATIO,
  MAX_ENHANCEMENT,
  MINING_CYCLE_MAX_MS,
  MINING_CYCLE_MIN_MS,
  MINING_DAILY_MININGS,
  MINING_TICKS_MAX,
  MINING_TICKS_MIN,
  PET_BASE_BONUS,
  PET_BASE_ENERGY,
  PET_BITE_ENERGY,
  PET_ENERGY_PER_BLOW,
  PET_ENERGY_PER_LEVEL,
  PET_MAX_LEVEL,
  PET_ENERGY_PER_HUNT,
  PET_REST_RATIO,
  REST_TICK_MS,
  REST_HEALTH_RATIO,
  REST_WILLPOWER_MAX_BONUS,
  REST_WILLPOWER_HALF,
  PET_MIN_LEVEL,
  PET_PRICE,
  PET_RENAME_PRICE,
  RENAME_COOLDOWN_DAYS,
  RENAME_PRICE,
  STARTING_BRONZE,
  TRAINING_TICKS_MAX,
  TRAINING_TICKS_MIN,
} from "@/shared/constants/game";
import { SITE_EMAIL } from "@/shared/constants/site";
import { SPECIES_LABEL, SPECIES_ORDER } from "../entities/creature";
import { TERRITORIES } from "./territories";
import { MAX_PACK } from "../entities/pack";
import {
  MAX_ROOM_MEMBERS,
  MAX_ROOM_MESSAGES,
  MEMBER_TIMEOUT_MS,
  MESSAGE_COOLDOWN_MS,
  MESSAGE_MAX_LENGTH,
  OPEN_ROOM_MIN_LEVEL,
} from "../entities/tavern";
import { ARENA_HISTORY_SIZE } from "../entities/arena";
import {
  ARENA_BAND_RATIO,
  ARENA_DAILY_ATTACKS,
  ARENA_MIN_BAND,
  ARENA_SPOILS_MAX_HUNTS,
  ARENA_SPOILS_MAX_SHARE,
  ARENA_SPOILS_MIN_HUNTS,
  ARENA_SPOILS_MIN_SHARE,
} from "../rules/arena";
import { MINING_MAX_LEVEL, ORES } from "./ores";
import { ALCHEMY_MAX_LEVEL, ALCHEMY_RECIPES, SCROLL_PRICE_RATIO, scrollIdFor } from "./alchemy";
import { alchemyNeeded } from "../rules/alchemy";
import { findItem } from "./items";
import { RARITY_LABEL } from "../entities/item";
import { RANKING_BOARDS } from "../entities/ranking";
import { BAZAAR_FEE_RATIO, BAZAAR_LISTING_HUNTS, MIN_WITHDRAW_CENTS } from "../rules/bazaar";
import { BAZAAR_LISTING_DAYS, initialWallet } from "../entities/bazaar";
import { enhancementCost } from "../rules/forge";
import { experienceForLevel } from "../rules/progression";
import { MOON_PHASES, SYNODIC_MONTH_DAYS } from "../rules/moon";
import { FURY_ATTRIBUTE_BONUS } from "@/shared/constants/game";
import { miningNeeded } from "../rules/mining";
import { criticalMultiplierOf } from "../rules/combat";
import { VIP_DAYS, VIP_PRICE_CENTS, VIP_TRIAL_DAYS } from "../rules/vip";
import { formatBronze, formatReais } from "@/shared/utils/format";
import { EQUIPMENT_SETS, piecePrice } from "./equipment-sets";
import { EQUIPMENT_SLOTS } from "../entities/item";
import { STORE_PACKS } from "./store-packs";
import { AUTOMATIONS } from "../entities/automation";

export interface WikiTopic {
  id: string;
  title: string;
  summary: string;
  lines: readonly string[];
}

function setRequirementsLine(): string {
  const parts = EQUIPMENT_SETS.map(
    (definition) => definition.label + " (LV. " + definition.minLevel + ")",
  );
  return "Sets, one per hunting band: " + parts.join(", ") + ".";
}

function moonLines(): string[] {
  return MOON_PHASES.map((phase) => {
    const perks: string[] = [];
    const experience = Math.round(phase.experienceBonus * 100);
    const training = Math.round(phase.trainingBonus * 100);
    const mining = Math.round(phase.miningBonus * 100);
    if (experience > 0) perks.push("+" + experience + "% hunt experience");
    if (training > 0) perks.push("+" + training + "% training progress");
    if (mining > 0) perks.push("+" + mining + "% mining experience");
    if (phase.key === "full") {
      perks.push("Fury Mode on (+" + FURY_ATTRIBUTE_BONUS + " to every attribute)");
    }
    return phase.label + ": " + (perks.length > 0 ? perks.join(", ") + "." : "no bonus.");
  });
}

function oreLines(): string[] {
  return ORES.map(
    (ore) =>
      ore.label +
      ": mining LV. " +
      ore.requiredLevel +
      ", " +
      ore.minYield +
      " to " +
      ore.maxYield +
      " per mining.",
  );
}

function ritualLines(): string[] {
  return ALCHEMY_RECIPES.map((recipe) => {
    const potion = findItem(recipe.potionId);
    const scroll = findItem(scrollIdFor(recipe.potionId));
    return (
      (scroll?.name ?? recipe.potionId) +
      ": alchemy LV. " +
      recipe.requiredLevel +
      ", " +
      recipe.first.quantity +
      " " +
      RARITY_LABEL[recipe.first.rarity] +
      "+ and " +
      recipe.second.quantity +
      " " +
      RARITY_LABEL[recipe.second.rarity] +
      "+, makes " +
      (potion?.name ?? recipe.potionId) +
      "."
    );
  });
}

function boardLine(): string {
  return "Boards: " + RANKING_BOARDS.map((board) => board.label).join(", ") + ".";
}

function bandLines(): string[] {
  return SPECIES_ORDER.map((species) => {
    const areas = TERRITORIES.filter((territory) => territory.species === species);
    const min = areas.reduce((low, territory) => Math.min(low, territory.minLevel), areas[0]?.minLevel ?? 1);
    const max = areas.reduce((high, territory) => Math.max(high, territory.maxLevel), areas[0]?.maxLevel ?? 1);
    return SPECIES_LABEL[species] + ": LV. " + min + " to " + max + ".";
  });
}

function setCostRangeLine(): string {
  const parts = EQUIPMENT_SETS.map((definition) => {
    const total = EQUIPMENT_SLOTS.length * piecePrice(definition);
    return definition.label + " (" + formatBronze(total) + ", " + formatBronze(piecePrice(definition)) + " per piece)";
  });
  return "A full set costs: " + parts.join("; ") + ".";
}

function forgeMultiplierAt(level: number): string {
  return (1 + ENHANCEMENT_STEP * level).toFixed(2);
}

export const WIKI_TOPICS: readonly WikiTopic[] = [
  {
    id: "loop",
    title: "How to play",
    summary: "The cycle of any given night in Wizold.",
    lines: [
      "You start with nothing equipped, " +
        STARTING_BRONZE +
        " WCoins, ten health potions and ten small fury potions. Choose a territory and, in the list, the prey: the bar fills as \"Searching for creature...\" and only on the last beat is the fight decided on the server; the replay then tells it blow by blow as \"Hunting...\". Stopping during the approach cancels; stopping during the replay applies the result. Switching creatures mid-hunt does not change the fight in course, only the next lap.",
      "To chain hunts, training, mine or forge without touching anything, turn on VIP automation in the settings. Every area has ten creatures with fixed numbers: you get stronger, they do not.",
      "A critical blow multiplies the damage by " +
        criticalMultiplierOf().toFixed(2) +
        ", fixed; Instinct raises the critical chance and Agility the dodge chance and the chance of a second blow.",
      "Train to accumulate attribute progress; equip what serves, sell what is left and go back to hunting.",
      "The bars count what changes on the spot, beside the value: experience gained in purple, WCoins and fragments in amber, health lost in red and the mine's spent breath in blue. Each notice sums the moment's gains and fades on its own right after.",
      "At the forge, mine fragments and strike the piece that sits in the bag, off the body, to raise it from +1 onward. At the kennel, adopt a wolf: it adds attributes while it stands. The ranking shows where you are among the hunters.",
    ],
  },
  {
    id: "vitals",
    title: "Vitals",
    summary: "Health rises with the level, Tibia-style: Lumni and Luna gain at different paces.",
    lines: [
      "Maximum health: " +
        VITALS.baseVital +
        " at level 1, plus " +
        healthPerLevelFor("male") +
        " per level for Lumni and " +
        healthPerLevelFor("female") +
        " per level for Luna. Endurance does not fatten the bar; it only cuts the damage each enemy blow takes.",
      "Health potions heal a fixed random amount: small 150 to 200, medium 200 to 300, large 300 to 500. Recovering gives back " +
        Math.round(REST_HEALTH_RATIO * 100) +
        "% of the maximum every " +
        REST_TICK_MS / 1000 +
        " seconds with no Willpower, and climbs toward " +
        Math.round((REST_HEALTH_RATIO + REST_WILLPOWER_MAX_BONUS) * 100) +
        "% as Willpower grows, with half that gain already at " +
        REST_WILLPOWER_HALF +
        " Willpower: more Willpower, less time until whole. The potion is the paid shortcut while the fixed number is still worth it.",
      "Hit zero health on the hunt and you escape with 1 health and record a defeat.",
      "Below 1 health the ground refuses the hunt: Recover or drink a potion.",
      "The pit opens for any living body: you may descend wounded, and losing bled out is the risk you chose to take.",
      "A fight runs until one side falls: there is no round cap and no retreat by the clock.",
    ],
  },
  {
    id: "fury",
    title: "Fury",
    summary: "Fury Mode: a paid potion or the full moon, +10 to every attribute for a while.",
    lines: [
      "There is no transformation: you hunt, train and duel straight away, as you are.",
      "Fury Mode gives +" +
        FURY_ATTRIBUTE_BONUS +
        " to each attribute while it lasts; the gain shows in the sheet's Fury column and lifts damage, dodge, critical and the chance of a second blow at once. The health bar still rises only with the level.",
      "The fury potion gives no health back. Duration is the flask's size (small 2.5 minutes, medium 5, large 7.5) plus the same Willpower stretch on every flask, up to 5 minutes, with half of that already at 250 Willpower. Drinking again restarts the clock full.",
      "On the full moon the sky keeps Fury Mode on by itself while the phase lasts; the potion is disabled during that window, because the sky is already doing that work.",
      "It is a paid shortcut to a window of strength: save the potion for a hard band or a duel you do not want to lose, outside the full moon.",
    ],
  },
  {
    id: "moon",
    title: "Moon phases",
    summary: "The game's moon is the moon outside, and it changes what every hunt is worth.",
    lines: [
      ...moonLines(),
      "The phase comes from a public moon API, with the astronomical formula as the fallback when there is no network.",
      "The lunar month has " +
        SYNODIC_MONTH_DAYS.toFixed(2) +
        " days, so each phase lasts about a week.",
      "Each phase pays in one corner: the waxing moon pays more on the hunt and in the yard, the new moon pays more in the mine, and the waning moon gives no bonus at all.",
      "The full moon gives no bonus through the Moon column: it turns on Fury Mode (+" +
        FURY_ATTRIBUTE_BONUS +
        " to every attribute) while the phase lasts, about " +
        (SYNODIC_MONTH_DAYS / 8).toFixed(1) +
        " days.",
      "During the full moon the fury potion is disabled on the sheet; the Fury Mode clock in the side menu shows how long until the phase ends.",
      "The current phase and its bonus sit at the foot of the side menu on desktop and in the bar below the navigation on the phone.",
    ],
  },
  {
    id: "progression",
    title: "Progression",
    summary: "The level comes from the hunt, the attribute comes from training.",
    lines: [
      "Experience for the next level: " +
        experienceForLevel(1) +
        " at 1, " +
        experienceForLevel(10) +
        " at 10 and " +
        experienceForLevel(100) +
        " at 100. The curve climbs faster than the prey pays: about 5 hunts at the start and 585 at the cap.",
      "The cap is level 1000 for character and attribute. Leveling grants no free power: it opens territory, set and vein; strength comes from training and from what you wear. A level does not restore health.",
      "An attribute only rises in training, on the same curve as experience: cheap at the start, very costly near the cap; a point takes a few sessions early on and hundreds at the end.",
      "Training is free: each exercise raises one attribute (+1 Strength, +1 Endurance, +1 Agility, +1 Instinct or +1 Willpower per point). Progress per session follows that attribute's current value. Equipment adds on top of the trained cap.",
      "Each session draws " +
        TRAINING_TICKS_MIN +
        " to " +
        TRAINING_TICKS_MAX +
        " steps, and the draw is pacing only: the progress a session pays is the same, short or long.",
      "The yard shows the exact attribute, with the fraction of the point in progress (20.33 instead of 20), how much each session pays in points and experience, and how many sessions are left for the point to close: a count that drops with each finished session.",
    ],
  },
  {
    id: "combat",
    title: "Combat",
    summary: "Resolved in rounds, with no player input during the fight.",
    lines: [
      "Five numbers and nothing else: Strength, Agility, Endurance, Instinct and Willpower. Damage = Strength² ÷ (Strength + target's Endurance), with 10% of spread on Strength.",
      "Willpower does not enter the fight's math: it stretches the fury potion by the same flat bonus on every flask and speeds up health recovery outside combat. Fury is what adds +" +
        FURY_ATTRIBUTE_BONUS +
        " to every attribute while it lasts, and the more Willpower, the longer each flask runs.",
      "Whoever has more Agility starts. Dodge climbs toward 35% and critical toward 45%. A lead in Agility can land a second blow in the same cycle, capped at 12%.",
      "A critical multiplies by " +
        criticalMultiplierOf().toFixed(2) +
        ", fixed. A fight runs until one side falls.",
    ],
  },
  {
    id: "equipment",
    title: "Equipment",
    summary: "Seven slots, five sets, one item per slot.",
    lines: [
      "Slots: cap, necklace, coat, pants, boots, gloves and ring. " + setRequirementsLine(),
      "Every piece gives attributes and nothing else: gloves = Strength; ring = Strength and Willpower; coat = Endurance; pants = Endurance and Agility; cap = Endurance and Instinct; boots = Agility; necklace = Instinct and Willpower. The Willpower from necklace and ring stretches the fury potion and speeds up health recovery.",
      "The coat has a bloodline cut (Lumni/Luna). The market sells one of each piece; what is already in the bag or on the body cannot be bought again.",
      "No equipment drops on the hunt. A forged piece in the bag carries its +X; unequip to forge, equip again to wear.",
    ],
  },
  {
    id: "bestiary-rule",
    title: "Prey",
    summary: "Six species split the thousand levels into bands of different sizes.",
    lines: [
      ...bandLines(),
      "Each territory has ten fixed creatures, in ten-level steps within the band.",
      "In the area's list you mark the prey. A fight already begun keeps its creature; the next lap uses what you marked.",
      "Every level requirement in the game ends in 0 or 5.",
    ],
  },
  {
    id: "forge",
    title: "Forge and mine",
    summary: "The anvil makes no new piece: it improves the one in the bag, off the body.",
    lines: [
      "The mine pays every " +
        MINING_CYCLE_MIN_MS / 1000 +
        " to " +
        MINING_CYCLE_MAX_MS / 1000 +
        " seconds, because each strike draws " +
        MINING_TICKS_MIN +
        " to " +
        MINING_TICKS_MAX +
        " steps: one click is one payout, and with automatic mining on it repeats until you say stop.",
      "The step draw is pacing only: the handful the vein hands over, the mining progress and the mining counted against the quota are the same, short strike or long.",
      "The pick has a quota: " +
        MINING_DAILY_MININGS +
        " minings per day, counting the harvest and not each swing. The quota resets at 06:00 São Paulo time, the same instant for everyone.",
      ...oreLines(),
      "Mining starts at 1 and goes to " +
        MINING_MAX_LEVEL +
        ", the same cap as the character: everything that evolves climbs the same curve.",
      "The next mining level asks " +
        miningNeeded(1) +
        " progress at level 1, " +
        miningNeeded(100) +
        " at 100 and " +
        miningNeeded(1000) +
        " at the cap: the mine's ladder is the same as experience.",
      "What each vein pays is fixed and listed above: the mining level opens deeper veins, it never multiplies the handful that comes out of the rock.",
      "The forge only takes an unequipped piece, in the bag: take it off the body to forge. Each piece eats only its own set's fragment.",
      "The price of the next level: the same curve as the character's experience, in fragments; raising a piece to +N costs what level N costs in experience, so +" +
        5 +
        " costs " +
        enhancementCost(5) +
        " and +1000 costs " +
        enhancementCost(1000) +
        ".",
      "Each forge level adds " +
        (ENHANCEMENT_STEP * 100).toFixed(1) +
        "% of each attribute's original value to the piece. At +1000 the piece is worth " +
        forgeMultiplierAt(1000) +
        " times what it was.",
      "The anvil lands " +
        Math.round(FORGE_SUCCESS_RATIO * 100) +
        "% of its strikes. When it misses, what was paid is lost and the piece stays as it is: the risk is part of the price.",
      "Each strike also charges WCoins: " +
        Math.round(FORGE_BRONZE_RATIO * 100) +
        "% of your level's hunt purse, plus one per level already forged on the piece. The smith does not work for free.",
      "The cap is +" +
        MAX_ENHANCEMENT +
        ", and the level stays with the piece: forged in the bag, it carries the gain when it returns to the body.",
    ],
  },
  {
    id: "alchemy",
    title: "Alchemy",
    summary: "The cauldron fills flasks with what the hunt leaves behind.",
    lines: [
      "Every brew spends one Empty Flask, one scroll of that very potion and two DIFFERENT materials, and hands over one potion. Any material at the asked rarity or above serves, so every band feeds the cauldron with its own drops.",
      "The flask and the scrolls are sold at the market under Instruments: the flask is flat, and a scroll costs " +
        Math.round(SCROLL_PRICE_RATIO * 100) +
        "% of the potion it makes. With the materials, a brew lands at 77% to 85% of what that potion costs on the shelf: thrifty, never free.",
      "What opens a ritual is alchemy level, never the character's, and the market never asks for it: buy the scroll whenever you like, the cauldron is what waits.",
      ...ritualLines(),
      "Alchemy starts at 1 and goes to " +
        ALCHEMY_MAX_LEVEL +
        ", the same cap as the character and the mine: everything that evolves climbs the same curve. The next level asks " +
        alchemyNeeded(1) +
        " progress at level 1, " +
        alchemyNeeded(100) +
        " at 100 and " +
        alchemyNeeded(1000) +
        " at the cap, and each landed brew pays what that level pays, exactly as a mining strike does.",
      "The cauldron takes the one job slot, like the hunt or the anvil: it plays " +
        ALCHEMY_TICKS +
        " beats and only calls for the ingredients on the last one, so stopping mid-bar costs nothing and keeps the beat for the next time. With automatic alchemy on it fills one flask after another.",
    ],
  },
  {
    id: "pet",
    title: "Companion",
    summary: "A wolf hunts better with company, while it stands.",
    lines: [
      "Adoption takes LV " +
        PET_MIN_LEVEL +
        " and costs " +
        formatBronze(PET_PRICE) +
        "; releasing pays nothing. The wolf is born with +" +
        PET_BASE_BONUS +
        " Strength, Agility and Instinct, +1 of each per level up to " +
        PET_MAX_LEVEL +
        ".",
      "Renaming at the kennel costs " +
        formatBronze(PET_RENAME_PRICE) +
        ". Only the yard teaches the wolf; hunting beside you does not raise its level.",
      "Energy is its only vital: it starts at " +
        PET_BASE_ENERGY +
        ", +" +
        PET_ENERGY_PER_LEVEL +
        " per level. A hunt charges " +
        PET_ENERGY_PER_HUNT +
        " to enter, " +
        PET_ENERGY_PER_BLOW +
        " per pounce and " +
        PET_BITE_ENERGY +
        " when it gets bitten.",
      "Going along joins the fight and lends attributes; repose gives back " +
        Math.round(PET_REST_RATIO * 100) +
        "% of the energy every " +
        REST_TICK_MS / 1000 +
        " s. Food gives back 25% of the breath at once. Automatic food and automatic repose handle this in the settings.",
    ],
  },
  {
    id: "ranking",
    title: "Ranking",
    summary: "Where you stand among the hunters the moon knows.",
    lines: [
      boardLine() +
        " Character filters by bloodline without renumbering; the search keeps the board's real position.",
      "Clicking a name opens the read-only sheet; yours leads to the full sheet. Real hunters enter, plus the house NPCs, these wearing the NPC seal.",
    ],
  },
  {
    id: "arena",
    title: "Arena",
    summary: "The pit where one werewolf challenges another.",
    lines: [
      "The arena only marks fights between equals: " +
        Math.round(ARENA_BAND_RATIO * 100) +
        "% of your level to each side, and never fewer than " +
        ARENA_MIN_BAND +
        " levels.",
      "You pick the name through the search or ask for any rival in your band.",
      "There are " +
        ARENA_DAILY_ATTACKS +
        " attacks per day, and all of them return together at 06:00, the same hour the mine reopens.",
      "Whoever you faced rests until 06:00 before taking another challenge from you.",
      "The pit has a memory: your name's last " +
        ARENA_HISTORY_SIZE +
        " fights stay recorded, the ones you marked and the ones marked against you, with the outcome and the WCoins that changed hands.",
      "Both fight with their current numbers: attributes, equipment and companion included.",
      "The companion goes down too: active and with breath, it bites in the duel as on the hunt, yours and the rival's. Only yours spends energy here; the rival's tires in its own owner's duels.",
      "The pit pays no experience: levels are what the hunt is for. What you win here is the other's purse.",
      "The winner takes from the loser's purse what " +
        ARENA_SPOILS_MIN_HUNTS +
        " to " +
        ARENA_SPOILS_MAX_HUNTS +
        " hunts of the band pay, drawn each duel: the level band sets the floor and the ceiling.",
      "Nobody leaves the pit cleaned out: that slice never passes " +
        Math.round(ARENA_SPOILS_MIN_SHARE * 100) +
        "% to " +
        Math.round(ARENA_SPOILS_MAX_SHARE * 100) +
        "% of what the loser carries, so the broke pay little.",
      "Losing costs the same: it leaves your purse and enters theirs, and you leave the pit with 1 health.",
      "A duel runs until one side falls: there is no round-cap draw.",
      "Duels won have their own board in the ranking.",
    ],
  },
  {
    id: "tavern",
    title: "Tavern",
    summary: "Chat tables and the names you keep.",
    lines: [
      "An open table seats " +
        MAX_ROOM_MEMBERS +
        " people, with or without a password, and you keep one at a time. An open table without a password takes LV " +
        OPEN_ROOM_MIN_LEVEL +
        " or VIP; with a password, any level.",
      "Every table gets a # number you can copy and search. A reserved table hides its name and takes a password: from outside only the number shows.",
      "Every name at the table gets a color of its own. Whoever arrives takes the first free one; whoever leaves gives it back. A reserved table uses two.",
      "Each table keeps the last " +
        MAX_ROOM_MESSAGES +
        " lines: what came before, the night takes.",
      "Links from Wizold, Lumni, Twitch, YouTube, Instagram, Facebook, WhatsApp, TikTok and X pass and open in a new tab; any other address is refused.",
      "An e-mail address passes whole in a line, but stays as text: nobody clicks it by mistake.",
      "Hunter and table names pass moderation on the spot. A line enters the table at once; if the audit finds insult, racism or pedophilia, it becomes Inappropriate content. The device notice never shows the line, only that a message arrived.",
      "Each line fits in " +
        MESSAGE_MAX_LENGTH +
        " characters, and an open table takes one of yours every " +
        MESSAGE_COOLDOWN_MS / 1000 +
        " seconds: a conversation of many keeps a beat.",
      "At a reserved table there is no wait between lines: it is two people, and nobody needs to wait a turn.",
      "Closing the chat window is not leaving the table: the seat stays yours and Sit gives back the same chair.",
      "A table leaves the board when the last person leaves, when the owner closes it, or when nobody returns within " +
        MEMBER_TIMEOUT_MS / (60 * 60 * 1000) +
        " hours.",
      "The pack keeps up to " +
        MAX_PACK +
        " names: a mutual invite, sent from a hunter's profile or by nick in the tavern.",
      "The receiver sees the invite under Invites in the tavern and accepts or declines; accepting puts each in the other's pack.",
      "Leaving the pack is mutual: removing a name erases both sides.",
      "Calling someone from the pack opens a reserved table for the two of you, which only you two see.",
      "A new line at a table you sit at plays a soft notice. The sound button left of the field mutes or unmutes; unmuting plays the notice so you hear it.",
      "Hovering a nick shows what the person is doing: hunting, training, forging, mining, resting or idle.",
      "Whoever sits at a table right now answers the nick search first; the ranking board answers after.",
      "The reserved table is never swept: the message waits until the other name shows up.",
      "Deleting a name costs nothing and keeping it again costs nothing; the reserved table stays until someone closes it.",
      "The tables live on the server: the board updates in real time over a continuous connection, without refreshing the page.",
      "With the Tavern switch on in the settings, new messages at your tables arrive as system notifications, even with the game closed.",
      "The table password is stored encrypted; even so, invent one just for the table, never a password you use elsewhere.",
    ],
  },
  {
    id: "bazaar",
    title: "Bazaar",
    summary: "Forged pieces and fragments changing hands for real money.",
    lines: [
      "Only what the forge touched enters: a piece at +1 or more off the body, and fragments from the mine.",
      "What the market sells plainly does not enter: an unforged piece stays out.",
      "Announcing takes the pieces out of the bag and charges about " +
        BAZAAR_LISTING_HUNTS +
        " hunts of your level in WCoins; removing the listing returns the pieces, never the fee.",
      "The buyers are real people: the listing stays on the board until another hunter pays for it, and the price is yours to set.",
      "Every listing lasts " +
        BAZAAR_LISTING_DAYS +
        " days: the board shows how many are left and the hour it expires, and an expired one leaves the shopfront waiting for the owner to remove it and collect the pieces.",
      "The purchase is paid at the Stripe checkout, with real money; as soon as the payment confirms, the item enters the bag and the seller receives in the Saddlebag, already net of the house fee.",
      "What came from the bazaar carries the Bazaar badge in the bag: a mark of origin, with no rule attached, and the piece sells at the market like any other.",
      "Nobody buys their own listing.",
      "The house keeps " +
        Math.round(BAZAAR_FEE_RATIO * 100) +
        "% of every sale; the rest lands in the Saddlebag, the bazaar's wallet.",
      "The Saddlebag starts with " +
        formatReais(initialWallet().cents) +
        " and the minimum withdrawal is " +
        formatReais(MIN_WITHDRAW_CENTS) +
        ", requested with full name, CPF and Pix key.",
      "This version's withdrawal is a demo: the order is recorded with the given details and nothing is transferred yet.",
      "Buying a piece more forged than yours raises yours to its level: the forge belongs to the piece.",
      "Any doubt about a payment, write to support: " + SITE_EMAIL + ".",
    ],
  },
  {
    id: "store",
    title: "Wizold Store",
    summary: "WCoins for money, for those who want to skip the wait.",
    lines: [
      "Three WCoin packs, the same amount at any level.",
      ...STORE_PACKS.map(
        (pack) =>
          pack.name + ": " + formatBronze(pack.bronze) + " for " + formatReais(pack.priceCents) + ".",
      ),
      "The store sells no level, attribute or equipment: only the hunt gives experience, and only training gives attribute points.",
      "Payment opens at the Stripe checkout and the WCoins land on the account as soon as it confirms.",
      "The purchase history lives in the store itself, five per page: amount, date and each pack's status, from awaiting payment to approved, expired or refunded.",
      "Any doubt about a payment, write to support: " + SITE_EMAIL + ".",
    ],
  },
  {
    id: "vip",
    title: "VIP",
    summary: "A monthly subscription that unlocks automation.",
    lines: [
      "A new hunter receives " +
        VIP_TRIAL_DAYS +
        " days of VIP free with the first night.",
      "It costs " +
        formatReais(VIP_PRICE_CENTS) +
        " per month and keeps VIP for " +
        VIP_DAYS +
        " days per confirmed charge.",
      "It unlocks every automation switch in the settings: hunt, training, mine, forge, alchemy, rest, fury, potion and companion.",
      "Without VIP, each click does one cycle; with VIP, the run repeats the work on its own while there are resources.",
      "Cancel at the Wizold Store: the charge stops renewing on Stripe and VIP lasts until the end of the paid period; reactivate before it runs out to keep the feature.",
      "Payment opens at the Stripe checkout; confirmation turns VIP on at once.",
    ],
  },
  {
    id: "automation",
    title: "Automation",
    summary: "VIP switches that repeat work for you.",
    lines: [
      "Only VIP turns the switches on and off in the settings.",
      AUTOMATIONS.map((entry) => entry.label + ": " + entry.effect).join(" "),
      "Nothing turns on by itself: each switch must be enabled in the settings. Work paused for lack of resources resumes when that job's switch is on. Automatic fury drinks on the hunt without needing the automatic hunt; on the full moon it does not drink, the sky already keeps Fury Mode on.",
    ],
  },
  {
    id: "economy",
    title: "Economy",
    summary: "WCoins come in through the hunt and leave through the market.",
    lines: [
      "The run starts with " +
        STARTING_BRONZE +
        " WCoins. Renaming the character costs " +
        formatBronze(RENAME_PRICE) +
        " every " +
        RENAME_COOLDOWN_DAYS +
        " days; adopting the wolf " +
        formatBronze(PET_PRICE) +
        " and renaming the wolf " +
        formatBronze(PET_RENAME_PRICE) +
        ". Wolf rations, the arena and companion training follow the band's purse; the potion has a fixed price.",
      setCostRangeLine() +
        " Leveling inside a band does not fill the pocket: what changes the purse's size is opening the next band.",
      "The market sells at list price and buys back at half. Materials are for selling only; no equipment drops on the hunt.",
      "Health potions: small 50 WCoins, medium 150, large 300; fury small 300, medium 600, large 900; wolf ration, 1.5 hunts. The fury potion is not drunk on the full moon: the sky already keeps Fury Mode on. Fragments come from the mine and feed only the forge.",
      "Buying and selling ask for confirmation and let you choose the quantity.",
    ],
  },
];
