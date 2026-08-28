# Lumni Wizold

Werewolf browser game built with Next.js (App Router), TypeScript and Tailwind CSS v4,
organised as MVC. The run happens entirely on the client and is saved to `localStorage`.

**Code is written in English. Player facing copy stays in Portuguese (pt-BR).**
Identifiers, files, folders, routes and comments: English. Item names, descriptions,
labels and log messages: Portuguese. Player copy never uses the em dash; a comma,
colon or semicolon takes its place.

## Architecture

```
src/
  models/        (M) domain: entities, catalogs, rules and persistence
    entities/      pure types and structures (character, item, creature, game state)
    data/          fixed catalogs: items, creatures, territories, exercises, wiki copy
    rules/         game formulas: derived stats, progression, combat
    repositories/  the only place that talks to localStorage
    factories/     character and new run creation
  controllers/   (C) use cases: take state, return new state
    *.controller.ts   pure functions, no React and no browser access
    game.context.tsx  React adapter wiring controllers to views
  views/         (V) everything that draws
    components/    reusable blocks (panel, bar, button, item card)
    layout/        sidebar, resource bar, frame, toast
    screens/       one screen per page
    presenters/    domain formatting for display
  shared/        utilities and constants with no layer dependency
  app/           Next routing: each page.tsx only mounts its screen
```

## Dependency rules

- `models` never imports `controllers`, `views` or `app`.
- `controllers` imports `models` and `shared`. Never `views`.
- `views` imports `controllers` (through `useGame`) and types from `models`.
  It never implements a game rule.
- `app` only composes: metadata plus the matching screen.
- Every `localStorage` access goes through a repository in `models/repositories/`:
  the run in `game.repository`, the tavern in `tavern.repository`, the sound
  switch in `sound.repository`, the job in progress in `activity.repository`.
  `game.repository` normalizes on load: a save from an older build gets every
  newer field filled with its default instead of being discarded, so adding a
  field never wipes a run. Every numeric field is coerced through a finite
  check (`typeof NaN === "number"`, so `??` alone lets NaN in), ids the
  catalog no longer knows are pruned after the migrations run, and a payload
  the build cannot read at all is parked under `lumni-wizold:state:rescue`
  before the fresh state's first save overwrites the only copy.

## Conventions

- Every use case returns `Result<T>`: `{ ok, message, state, data? }`.
  A game rule error never throws, it returns `failure(...)`.
- State is never mutated: controllers always build new structures.
- Randomness is injected (`Random`), which keeps combat testable.
- Every name a player types is one word: the hunter, the wolf and the tavern
  table all take letters and digits only, no space and no sign, capitalized, at
  most `NAME_MAX_LENGTH` (25). `sanitizeName` in `shared/utils/text.ts` is what
  the field calls on every keystroke, so the rule is seen as it is typed instead
  of being reported after the fact, and `validateName`/`validateRoomName` say the
  same thing in the use case, because a field is not a guarantee.
- Do not name a non hook function `useSomething`: the hooks lint rule rejects it
  (that is why consuming a potion is `consumeItem`).
- Palette limited to black, grey and white. Colours live in `@theme` inside
  `globals.css` and are never written inline in a component.
- Every card comes from `views/components/card.tsx`. Height is a prop:
  `height="fill"` on the hunt, market, training, inventory, tavern and wiki pages,
  where the description grows and the row ends level, and `height="content"` on the
  character sheet. `Panel` takes the same prop. Neither one pads itself: art,
  dividers and list rows run from edge to edge, while identity sits in
  `CardHeader` (or in the banner, when the card has art), text in `CardBody` and
  actions in `CardFooter`, each split off by a line of its own. A panel holding
  a divided list takes `bodyClassName="p-0"` and lets the rows carry `px-4 py-3`,
  so every separator crosses the whole container.
- One scale for the whole interface, so no screen invents a value of its own:
  - Drawings live inside a frame and never touch its border: `IconArt` insets an
    object and fits it whole, while scenery fills the square.
  - Art in a frame, from `views/components/icon-frame.tsx`: `mini` (32px) for
    chrome badges, `small` (60px) for attributes, `medium` (72px) for items and
    creatures, `large` (88px) for equipped pieces and the portrait, `huge`
    (112px) only for the three packs of the store, which are the one place the
    art is the offer. `ItemIcon`, `AttributeIcon`, `TerritoryIcon`, `PetIcon`,
    `PackIcon` and `IconFrame` take that name as `size`.
  - A card's art sits in its `CardHeader` through those same icons: there is no
    separate banner component, and the identity strip is the one place a
    drawing appears on a card.
  - Nothing wears a drawn ornament any more. The forged chrome was tried on the
    quinas of every section, on both ends of every bar and around every icon,
    and all three were dropped: an edge is its own line and nothing else. What
    survives from that experiment is `FRAME_ROOM`, the margin `IconFrame` keeps
    around itself, which used to be clearance for the oversized border and is now
    simply the air between a drawing and the text beside it.
  - Hand art is for game content only. Chrome — the aside entries and the toast
    headers — draws line icons from `lucide-react`, all mapped in one place,
    `views/components/app-icon.tsx`, so a page and its toast always wear the
    same symbol. An aside entry is chip-height: the icon in its own cell, split
    from the label by a line, inside a plain border, and the gap between
    entries is the same `p-3` the aside itself keeps. What a row offers instead
    of a written label comes from the same file, through `ActionIcon`, on a
    `Button` marked `icon`: that squares it at the button height, and the
    drawing being the whole button is why it always carries an `aria-label` and
    the `Tooltip` that names the action.
  - Radius: `rounded-lg` for containers (panel, card, empty state), `rounded-md`
    for everything inside them, `rounded-full` only for the bars.
  - Heights: 24px for a tag, 32px for a chip, a field and every button of the
    interface, 40px only for `size="medium"`, the full width action that closes
    a form. A button inside a card or a list never asks for a size.
  - Spacing: `p-4` inside a container, `p-3` inside the aside chrome,
    `px-4 py-3` for a row of a divided list and for the text-only header strip
    of a panel, `p-4` for an identity strip that carries art — a card's header
    and the portrait strips — so the drawing keeps one distance from every
    edge, `gap-2` between chips, `gap-3` inside a card and between an icon
    and its text, `gap-6` between cards and panels — the forged quinas lean 8px
    out of each box, and this is what keeps clear air between them — and
    `space-y-6` between the sections of a page.
  - Type: `text-[10px]` uppercase with `tracking-[0.16em]` for labels,
    `text-[11px]` for mono readouts, `text-xs` for body, `text-sm` for titles,
    `text-lg` for the page title. No other size and no other tracking, and never
    `text-base`, which is a colour in this project (`--color-base`); only the
    initials inside an icon frame size themselves to the frame.
  - Toggles (filters, tabs, wiki shortcuts, mobile navigation) all come from
    `views/components/chip.tsx`, at the height of a small button.
  - What floats has one ladder, and nothing else gets a `z-`: `z-20` for the
    resource strip, `z-40` for the balloon that follows the cursor, `z-50` for a
    dialog and `z-60` for the corner where the game talks, which stays readable
    even while a dialog is open.
  - One bar for every number that fills: same height, same white, and one single
    movement per change — the fill glides to the new value, and a wrap runs to
    the end, blinks back to zero and walks up to the beat it is already in,
    landing before the next tick so every later step is exactly one segment
    wide. A resource is told apart by its label, never by a shade.
  - Every action that repeats has one shape, and the switch in the settings is
    what decides whether it repeats: hunt, training, mining and forging all pay
    out one cycle per click and stop, and only with their own automation flag on
    do they chain, reading "Parar" while they run. The screen owns the loop, so
    the check is one line at the landing of each cycle (`if (!auto) stop`), and
    the flag is read through a ref so flipping it mid-job takes effect on the
    next landing instead of restarting the clock. There is one job slot (`Activity`), so the anvil and
    the pick can never swing at the same time: starting either puts the other
    down, and that rule lives in the slot, not in a screen. Resting is the same shape upside down: starting it stops every
    other loop (the active job lives in `game.context` as `Activity`, saved by
    `activity.repository` so a refresh resumes the same work), gives
    back a point of health and rage each minute from the provider — so it
    survives navigation — and stops itself once whole. Transformar asks only
    rage, never a full body: out of rest it is always offered, with Recuperar-se
    beside it while a vital is short. The fury runs on a clock: the character
    keeps a `transformedAt` stamp and `TRANSFORM_DURATION_MS` (15 minutes)
    after the turning the provider brings the human back on its own — the
    deadline is read from the stamp, so a refresh keeps it, and a save already
    spent reverts on load. Turning back by hand and resting clear the stamp.
  - Margins are a smell: a block that needs air gets `space-y-*` from its
    parent, not `mt-*` on itself.
- Configuration is by prop, never by class. `cn` only joins strings: it has no
  idea that `p-0` should beat `p-4`, so both would ship and the stylesheet order
  would decide. That is why `Panel` takes `padding="none"` and `CardBody` takes
  `direction="row"` instead of taking a class from the screen. A `className` may
  only add something the component does not already set.
- The corpo comes before the action, and it is one component, not a copy per
  screen: `views/components/body-gate.tsx` wraps whatever a row offers and swaps
  it for Recuperar-se or Transformar while the body or the fury is short, taking
  only `open` (whether the row is otherwise actionable) and `reason` (the line
  that names the rule of that page). The countdown button under it is
  `recovery-button.tsx`, which the character sheet, the gate and the wolf all
  render, so "Recuperando-se... 52" and "Repousando... 57" are the same button
  with different words.
- Anything that spends or loses something asks first, through
  `views/components/confirm-dialog.tsx`: buying, selling, discarding and both
  ends of the kennel go through it. Escape and the backdrop cancel.
- A warning that only shows on hover comes from `views/components/tooltip.tsx`,
  never from the browser's own `title`, which arrives late and wears the colours
  of the system. It follows the cursor and is fixed, so no panel clips it, and
  `Button` drops its pointer events when disabled precisely so the balloon can
  still say why a button is off — which is where a warning is worth the most.
- Every divided list is `List` plus `ListRow` from `views/components/list.tsx`,
  inside a container built with `padding="none"`. `ListRow` has three layouts:
  `row` (icon, text, trailing value), `column` (stacked lines) and `split`
  (stacked on a phone, two sides on a wider screen). `DataRow` is the label and
  value pair built on top of it, and `RowText` is the title with a line under it.
  A screen never writes `divide-y` or a row padding of its own.
- Art is hand made and added one file at a time. `models/repositories/art.repository.ts`
  walks `public/assets` on the server, matches every file name against the real
  catalog and builds a manifest keyed by item id, by territory, by pet gender,
  by attribute, by exercise (the `training` folder, keyed by the attribute each
  exercise trains, falling back to the attribute's own scene) and by gender
  (everything but items answers to its key or to the name shown on screen,
  accents optional). The gender crest is the avatar: picked at the door, it
  stands in the portrait of the character sheet and of every hunter's page in
  the ranking, through `views/components/gender-icon.tsx`;
  `controllers/art.context.tsx` carries it to the views. Folders are free, and inside
  a set folder (`gold_set`) the set prefix may be dropped from the file name.
  `ItemIcon`, `AttributeIcon`, `TerritoryIcon` and `PetIcon` read the manifest
  and fall back to initials, so a missing drawing never breaks a screen and no
  request is made for a file that does not exist. Creatures deliberately have no
  art: a species shows only its name. Keep that
  repository server only: on the client import the `ArtManifest` type from
  `models/entities/art.ts`, never the repository itself.

## Equipment system

Seven slots, one item each: `helmet`, `necklace`, `armor`, `pants`, `boots`, `claw`, `ring`.
`ItemCategory` is those seven slots plus `potion` and `material`, so a wearable category
maps one to one to its slot.

The catalog is a five by seven matrix declared in `models/data/equipment-sets.ts`:
five sets (`bronze`, `silver`, `gold`, `diamond`, `lunar`) times seven slots, expanded
into items by `buildSetItems()`. A piece lends attributes and nothing else — there is
no combat number on an item — so what a card promises is exactly what the sheet adds
and exactly what the fight reads. Each slot carries a shape (claw and ring give Força,
armor, pants and helmet give Resistência, boots give Agilidade, necklace gives Instinto
and Vontade) as a fraction of the set's single `power`. Balancing means editing that
table, never copying item objects. Piece ids are `<set>-<slot>` (for example
`lunar-claw`). Every set is sold in the market; the lunar pieces also drop from vampires
and unicorns. `setAttributes` and `setForLevel` expose what a whole set lends, which is
what the bestiary measures its prey against.

Potions are two lines (health, rage) in three sizes each.

## Training

One exercise per attribute, five in total, and the same exercise follows the
character from level 1 to level 1000: what a session yields comes from
`models/rules/training.ts`, a smooth curve on the level tuned against the point
cost (`10 + value x 4`) so a point stays near five sessions while the attribute
tracks a bit over half the level. A session also charges silver, priced by the
value being trained (`trainingCost`), so the hunt keeps paying for the body for
the whole run — training is the standing silver sink.
`models/data/exercises.ts` holds only identity and flavour.

Attributes move by training and by nothing else. A level grants no free point,
so `applyExperience` returns level and experience alone.

**Only the beast trains.** `train` refuses a hunter in human skin and so does
`trainPet`, because the yard is one place with one rule: the wolf's own ladder
is gated the same way its master's is. The card carries the same chain the arena
footer does, in the same order — Recuperar-se when there is no body or no fury to
turn with, Transformar when there is, and only then Treinar — which is what makes
the whole run pass through the fury: gather rage, turn, and spend the fifteen
minutes on the trail or in the yard.

## Bestiary

`models/data/species.ts` is the other table: six species (`rabbit`, `deer`, `bear`,
`human`, `vampire`, `unicorn`) split the 1 to 1000 range into equal bands, snapped to
multiples of five, and each species expands into five variants plus one territory and
two materials. A creature carries the same three numbers a hunter does — Força,
Resistência, Agilidade — and they are read the same way in the fight. Because a hunter
grows only by training and gear, a prey is built against the reference hunter of its
band (`referenceHunter`, the trained curve plus that band's set) times a share, a
species profile and a difficulty factor, so adding a creature means adding a row, never
a hand written stat block. In a hunt the prey
scales to the hunter's level inside the band of its territory (`speciesNumbers`),
so a fight never goes stale between variants; the prey is always the strongest
variant already unlocked, so its name only changes when the next one does, and
the variant lends name and flavour while drops belong to the whole species.
Rage sharpens the hunter: the critical chance belongs to instinct alone, and
full rage deepens the critical cut by `RAGE_CRITICAL_DAMAGE_BONUS` (1.7x grows
to 2.2x, only on the hunter's own blows), while transforming spends rage, so
the two pull against each other.

## Hunting loop

**Only the beast hunts.** `resolveHunt` refuses a hunter in human form, and the
territory card turns its button into Transformar until the fury is on. That is
the spine of the run: gather rage, turn, hunt while the fifteen minutes last,
and gather again. It also means the werewolf bonus is always on during a hunt,
which is why the balance bench measures in `form: "werewolf"` — measuring the
human form was worth eight points of health per hunt at the ceiling.

The hunt runs in laps of the beat bar, one fight per lap. The first beat decides
the fight through `resolveHunt`, which reads the run without touching it; the lap
then narrates that exact fight line by line (the script sets the lap length), the
bar fills on the last told beat and holds one landing beat still full — only on
that landing beat does `commitHunt` land the held result, with one exception:
each creature blow the lap tells bleeds on its own beat through `sufferBlow`,
subtracting damage from the body alone, silently. The landing is all deltas
over the run as it is at that moment — rage, silver, counters, loot and the
experience, minus the blood the blows already took — so a potion drunk or an
item bought mid-lap is never reverted by the spoils arriving. Loot, report,
totals and the log only move on the landing beat, so the eye always sees the
bar whole before the spoils land, and nothing ever lands on the wrap back to
zero. An interrupted lap pays nothing: the blows already told remain, the
spoils are discarded and the bar starts over. A fight the 24-cycle cap calls
off is a retreat: the hunt counts, but nobody wins or loses it. The loop stops
when the player stops it or the ground refuses (health under
`MIN_HEALTH_RATIO_TO_HUNT`).

## Arena

The pit is the hunt turned on its own kind: another hunter of the roster instead
of a creature. It reuses everything the hunt already had — `simulateCombat` takes
a `CombatOpponent`, which a `Creature` and a hunter both satisfy, and the same
`narrationOf` script tells the fight beat by beat, landing on the beat after the
bar fills, in deltas, minus the blood the told blows already bled.

`models/rules/arena.ts` owns the pairing. The arena only marks a duel between
near equals: `ARENA_BAND_RATIO` (12%) of the level to each side, never narrower
than `ARENA_MIN_BAND` (5 levels). That width comes from the numbers, not from
taste — everything in a hunter grows linearly with the level (attack
`14,8 + 2,56 x NV`, defence `8,6 + 1,67 x NV`, health `80 + 28,7 x NV`) and the
damage formula is scale free, so a duel between equals runs the same rounds at
any height, while a gap of `d` hands the stronger side about `(1 + d)³` of the
rounds it needs: `1,24x` at the edge of the band, a contested fight. The floor of
five levels is for the first nights, where the fixed base of every formula
outweighs the level anyway and a percentage would find nobody; across the whole
ladder the band holds four to seventeen of the 120 hunters, and an empty one
falls back to the nearest levels so the pit never closes.

The player either picks a name or asks for anyone in the band. The search reads
the whole roster, so a champion can be looked up, but whoever falls outside the
band comes back marked and `resolveArena` refuses that fight in the use case, not
only on the screen. Both sides descend as beasts: `arenaStats` reads the rival in
`form: "werewolf"`, and `resolveArena` refuses a challenger still in human skin,
so the pit runs the same spine the hunt does — the one button on the row and in
the footer reads Transformar until the fury is on, then becomes Desafiar and
Buscar adversário. That is also what makes the voices right: the profile follows
`character.form`, so every blow in the fosso is told in the beast's throat.
No wolves in the pit: `simulateCombat` is called with no pet.

The pit pays no experience: levels are what the hunt is for, and here silver
only changes hands. `arenaSpoils` draws what `ARENA_SPOILS_MIN_HUNTS` to
`ARENA_SPOILS_MAX_HUNTS` hunts of the band pay (`arenaSpoilsRange`, which the
screen shows before the duel, per opponent) and moves exactly that out of the
loser's bag — a defeat is the same draw taken from yours, which is what makes
the pit a risk and not a second job. Nobody is ever cleaned out: the slice never
passes `ARENA_SPOILS_MIN_SHARE` to `ARENA_SPOILS_MAX_SHARE` of what the loser
carries, so a broke fighter pays little while a rich one still only pays the
band's ceiling. The rival's bag is the one `rivals.ts` generates and it is read,
never written — the roster has no save of its own — so only the player's side of
the trade persists. Three duels a day cap the pit at fifteen hunt purses, well
under a night of hunting. A duel that reaches the cycle cap is a draw: no silver moves
and the counters record neither. Duels won have their own board in the ranking,
and the counters live on the character as `arenaWins` and `arenaLosses`.

Both bodies are on screen while the fight is told: your bar reads the live
character, already bled by the blows the narration has reached, and the
opponent's follows `creatureHealth` line by line — a duel, not a progress bar
with a name on it.

A day of arena gives `ARENA_DAILY_ATTACKS` (3) duels, and the charges need no
state of their own: `arenaCharges` reads them off the record of duels, which
already holds exactly the last day — one stamp per attack, because the rest
below forbids facing the same hunter twice inside it — so a charge returns the
moment the oldest of the three finishes its own day, and that is the countdown
the pit shows when they run out.

Nobody is worth beating twice in a night: whoever was faced rests for
`ARENA_COOLDOWN_HOURS` (24), stamped on `state.arenaDuels` by hunter id when the
duel lands. The rest is refused in the use case, shown on the row as the time
left, skipped by the random draw, and it sinks that name to the bottom of the
list, so the pit always hands over a new face. Stamps whose day has passed are
dropped on the next landing instead of piling up in the save.

## Tavern

`models/repositories/tavern.repository.ts` is an external store: `localStorage` plus
`BroadcastChannel`, read through `useSyncExternalStore` by `controllers/use-tavern.ts`.
That hook exists instead of a provider precisely because the state is external and
shared between tabs. Rooms hold at most ten members, members are pruned when they stop
sending the heartbeat, and an empty room closes itself. Closing the chat window is not
leaving the table: the seat stays taken and Entrar reopens the same chair, so an
owner's quiet room survives them browsing the rest of the game. A guest hands the
chair back through `leaveRoom`; the owner never does, so the table keeps the name it
was opened under — and its claim on the one table per player — until `closeRoom`,
which is what frees them to open another. The heartbeat carries the current name, so
a hunter who paid to be called something else is called that at every table they sit
at. Cross machine chat needs a server: the repository is the only file that has to
change.

The pack is the list of names the run keeps, in `state.pack`, at most `MAX_PACK`.
A name is kept from inside a room, by the button beside it, or typed as a nick:
`addByNick` answers with whoever is at a table right now before it answers with the
board of the ranking, an exact nick wins, and a piece of a nick only counts when it
points at one person alone. A mate is a name and the night it was kept, nothing more:
excluding one costs nothing, so the list is a bookmark and never a commitment.

A private message is a table reserved for two and nothing else: `openDirect` finds
or opens a room carrying `privateFor`, which is what makes it invisible to everyone
but those two ids in `listRooms` — where it also sorts first, being the one table
that may be holding a message left for you — exempt from the broom in `pruneTavern`
so that message waits for whoever it was left to, refused to a third name in
`joinRoom`, outside both the one table per player rule and the name clash check in
`createRoom`, and closable by either party in `closeRoom`. Every other piece of the
tavern (messages, heartbeat, the modal) is the same code an open room uses.

## Ranking

Twelve boards, one per number the run keeps: level, wins, hunts, arena duels,
silver, forge, mining and the five attributes. `models/entities/ranking.ts`
declares them, and each board says how its value is read from a hunter, so
adding a thirteenth is a row in that table.

There is nobody else on the machine to rank against, so `models/data/rivals.ts`
generates a roster of 120 hunters from a fixed seed: the same names and numbers
come back every session and only the player's line moves. Levels lean towards
the bottom of the ladder, and attributes, hunts and silver are derived from the
level, so a rival reads as a plausible character instead of noise. A board of
real people needs a server, and that file is the only one that has to change.

`models/rules/ranking.ts` sorts, numbers the positions and cuts the pages
(twelve lines each), while `controllers/ranking.controller.ts` inserts the
character of the run with its real values and reports where it stands, plus
which page to open to see it — a page counted over the filtered list while a
search is on, so the shortcut always lands where the line actually is.

The search filters the board without renumbering it: a hunter keeps the position
it holds among everyone, so looking someone up never lies about where they are.
The gender cut (Alcateia: todos, machos, fêmeas) follows the same rule — every
hunter carries a `gender`, deterministic for the roster because each first name
owns its wolf, and any board can be read through that cut with the true
positions kept. Every line names lobo or loba beside the level.
Every name opens a read only sheet at `/ranking/[id]`: the numbers of the run,
the wolf, the seven equipment slots, the attributes with what gear and wolf lend,
the combat values and the position in all twelve boards. The roster is
deterministic, so those pages are prerendered by `generateStaticParams`, and a
rival carries the gear of the band below the one they hunt, with holes that close
as the level rises. Your own name goes to the character sheet instead, since that
is the same person with more detail.

`deriveStatsOf` is what makes that sheet possible: the stats rule takes a subject
with a level, attributes and a form, which a `Character` satisfies and so does a
hunter with no run of its own.

## Moon phases

The phase is the real one. `app/api/moon/route.ts` calls a public moon service from
the server (the service sends no CORS header, so the browser cannot call it directly)
and caches the answer for an hour; `models/repositories/moon.repository.ts` reads that
route, parks the state inside `models/rules/moon.ts` — which the rules read
synchronously — and doubles as an external store: `game.context` subscribes to it
through `useSyncExternalStore` and re-derives every stat when the phase flips, so
the tracker and the maximums always tell the same sky. The store refreshes itself
every ten minutes while subscribed. Offline, or if the service fails, the same
rules file computes the phase from the synodic month, within a few tenths of a
day of the API. The four names split the month the way astronomy does: new and
full are narrow windows around the exact moments, about three and a half days
each, and everything between them is waxing on the way up and waning on the way
down. The waxing moon is the one that teaches: it
pays 5% more experience, applied only inside `grantExperience`, so every source
of experience is covered exactly once. The full moon pays in the body instead,
`FULL_MOON_ATTRIBUTE_BONUS` on every attribute, added by `deriveStats` along with
the equipment and the wolf.

## Forge and mine

The forge never makes a new piece: it beats the one already on the body. A piece
only lends attributes, so that is all the forge can raise: every level adds one
point to each attribute of the piece plus `ENHANCEMENT_STEP` of the original.
The flat point is what makes a bronze boot visibly better, since a fraction of a
small number rounds to nothing; the fraction (0.2% per level, three times the
piece at +1000) is what carries the lunar set through the last bands. The level
belongs to the item id, not to the slot, so unequipping keeps what was forged.

The price of the next level is one fragment per five levels, and the fragment has
to be the one of that set: a silver helmet eats silver fragments. Fragments are
never sold, only mined.

The mine runs in cycles like the hunt: one swing every `MINING_CYCLE_MS`, until
the player stops it. Each vein
asks for a mining level, and mining climbs its own ladder from what comes out of
the rock, so the order is always bronze, silver, gold, diamond, lunar. The ceiling
of that ladder is the requirement of the deepest vein — above it there is nothing
left to unlock — which is why `MINING_MAX_LEVEL` is derived from the table
instead of written by hand.

## Bazaar

The bazaar trades forged work for real money and nothing else: a piece at +1 or
above, or mined fragments — never what the market sells plainly. Only what sits
in the bag can be announced, and the worn piece never sits in the bag, so "off
the body" is guaranteed by where the copies come from; a spare copy of the same
id is fair game. Announcing moves the copies out of the bag and cancelling
returns them; nobody buys their own listing, and a purchase respects the same
level gate as the market, both enforced in the use case and not only on the
screen. The board is the player's listings plus a deterministic set generated
from the roster's forged gear in `models/data/bazaar-listings.ts`, and
purchases are remembered by listing id so nothing bought ever comes back.

The roster shops the board back: `settleListings`, called by the provider on a
minute clock and on load, sells a listing after a delay read from its price —
near the suggestion in minutes, up to double in hours, past that never
(`saleDelayMs` in `models/rules/bazaar.ts`). The buyer is picked
deterministically from the roster by the listing id, the house keeps
`BAZAAR_FEE_RATIO` and the rest lands in the wallet — the Alforje — which pays
out through a Pix withdrawal.

Money is centavos, always integers, spoken through `formatReais`/`parseReais`.
Payment itself is a labelled simulation: a decorative QR from
`views/components/pix-qr.tsx` and a confirm button, because a real charge needs
the payment API this project does not have yet. The flow is shaped so the API
drops in at the confirm step.

Buying a piece more forged than yours raises your copy to its level, because a
forge level belongs to the item id.

## Pet

One wolf walks with the character, adopted at `PET_PRICE` and never sold back:
releasing it pays nothing, so adopting and releasing in a loop buys nothing —
adoption is a commitment, not a trade. The lineage is identity and art alone:
every point comes from `petLevelBonus`, `PET_BASE_BONUS` (5) of strength, agility
and instinct at adoption plus one more of each per level climbed, and the bonus
rides in the same `bonus.attributes` of `deriveStats` as the equipment and the
moon.

**Energy is the wolf's only vital.** There is no pet health: a wolf that can no
longer breathe is a wolf that stops, which is the single condition the whole page
is written around. The ceiling grows with the ladder — `petMaxEnergy` is
`PET_BASE_ENERGY` plus `PET_ENERGY_PER_LEVEL` per level — so training buys nights
as well as points, and an untrained wolf at a late band lasts four hunts where a
trained one lasts nineteen.

The wolf fights: awake and kept in (`isPetHunting`, which is `isPetAwake` plus
the `active` flag the player toggles on the pet page), it enters `simulateCombat`
as its own attack turn, biting with `PET_ATTACK_RATIO` of the hunter's attack.
The hunt itself costs `PET_ENERGY_PER_HUNT` the moment it joins, each blow costs
`PET_ENERGY_PER_BLOW`, and each creature turn has `PET_TARGET_CHANCE` of turning
on the wolf instead of the hunter, which costs `PET_BITE_ENERGY`. That flat entry
fee is what keeps the pace even: without it a short fight at a low band cost
almost nothing and the wolf lasted a hundred and sixty hunts, against twenty at
the ceiling. As tuned, a wolf kept level with its hunter runs fourteen to
thirty-six hunts on a full bar at every band. The outcome carries `petBlows` for
the narration and `petSpent` for the controller to land in one subtraction.

Out of breath it leaves the fight and lends nothing until it is fed or rested.
Deactivated it risks nothing and lends nothing either — the attribute bonus
follows `isPetHunting`, so staying home never beats hunting. Repousar is not a
flag, it is the recovery: while `active` is false the provider ticks
`restPetTick` on the same `REST_TICK_MS` clock the hunter rests on, giving back
`PET_REST_RATIO` of the ceiling a minute, ten minutes from empty to full at any
level. Food does the same instantly and costs an item: the market sells one
supply in the `pet` category, priced as a ratio (`petEnergyRatio`) so a ration is
worth half a bar at level 1 and half a bar at level 100. `consumeItem` routes the
`pet` category to `feedPet`. Health potions no longer serve the wolf, because
there is no wound left to close.

Two switches close the loop without the player: `petFeed` hands over the cheapest
ration when the wolf runs out, `petRest` sends it home when there is no ration
left and calls it back the minute the bar fills. They chain in that order for the
same reason the hunter's do: the flask first, the bed only when the flask is
gone.

The name is given at adoption and changed only back at the kennel, for
`PET_RENAME_PRICE` silver — a standing sink, never free. The wolf also climbs
its own ladder in the training yard: its card shares the exercise shape and
loop under `PET_EXERCISE_ID`, sessions charge silver by the wolf's level
(`petTrainingCost`), the progress curve is the same family as every ladder
(`petTrainingNeeded`), the session yield follows the wolf's own level
(`petTrainingEffort`, tuned so a level stays near five sessions at any
height), and each level up to `PET_MAX_LEVEL` adds one point of strength,
agility and instinct to what the wolf lends while hunting. Old saves carry
wolves from before the ladder: `petLevelOf` reads them as level 1, which lends
nothing.

That ladder has two feet on it and one climb: `growPet` is the only place a wolf
gains a level, and both the yard session and the hunt call it. A hunt with the
wolf along pays `PET_HUNT_SHARE` (35%) of a yard session, which is what keeps
the two priced against each other without a second curve — five sessions or
about fourteen hunts to the level, at any height, so the pit of 1 to 100 is 527
sessions or 1.486 hunts, and doing both is faster than either. The share is paid
in the wolf's own currency, never in the hunter's experience, because the
hunter's ladder answers to `grantExperience` alone. It is paid only when
`isPetHunting` is true at the landing: a wolf left at home neither risks nor
learns, which is what makes Acompanhar a choice instead of a formality.

## Calibration

**One currency.** The game has five numbers — Força, Agilidade, Resistência,
Instinto, Vontade — and derives no second set out of them. There is no combat
strength beside Força and no combat endurance beside Resistência: the fight
reads the attributes themselves, which is what lets a player add up the sheet
and know what the next blow will do. `deriveStatsOf` keeps every lender apart in
`sources` (trained, equipment, pet, moon, form) so the character sheet can name
who gave what instead of showing a total nobody can take apart.

**The level grants no power.** It opens the next territory, the next set and the
next vein, and that is its whole payment; counting it again inside the numbers
would be exactly the hidden term this model exists to remove. Vitals follow the
same rule: health is `BASE_VITAL + (Resistencia - BASE_ATTRIBUTE_VALUE) x 14`
and rage is the same shape on Vontade, with no level term anywhere. Dodge and
critical stay asymptotic (`35 x AGI / (AGI + 120)`, `5 + 40 x INS / (INS + 250)`),
so a point still buys something at the ceiling. The beast is Força alone
(`WEREWOLF_STRENGTH_BONUS`, 35%), never Resistência, so a turning never moves the
health bar. The rage critical damage bonus reads against `BASE_VITAL`, not the
personal maximum. Resting returns `REST_RECOVERY_RATIO` (5%) of each vital per
minute. A new character starts whole, with 100 silver and no gear. Level and
every trained attribute stop at 1000, the cap counting only the trained value:
gear, wolf and moon ride over it.

Damage is `Forca² / (Forca + Resistencia do alvo)`, with 15% of spread on the
Força: scale free, so the same curve is fair from a bronze boot to a lunar claw
a thousand levels later. Equal numbers land half the Força, and Resistência
never zeroes a blow.

**The coin is bronze.** A werewolf does not carry silver, so the currency is
bronze from the wallet to the ranking board: the field is `character.bronze`,
the money is spoken through `formatBronze`, and a save from before the change is
migrated on load, the old `silver` read once and dropped. Silver stays in the
world as the hunters' weapon, which is what the human band carries and drops,
and the second equipment set is called Metal, forged from what was taken off
them. Only the set key stays `silver` in the code, because item ids live inside
saves and renaming them would cost a run.

**The economy is read in hunts.** `huntPurse(level)` in `species.ts` is what one
carcass of that level pays, and it is the unit every price in the game is
written in: a session in the yard costs `TRAINING_COST_IN_HUNTS` (0.6) of it,
the kennel charges the same way, a new name costs thirty of them and the arena
purse pays between 1.8 and 3.2. The purse itself is the reference hunter's Força
times `SILVER_PER_STRENGTH`, so it climbs with the band and barely moves inside
one — silver that scaled with the raw level made the end of a band buy a whole
set in a single night, which is exactly the bug this anchoring removes. A set of
the band costs between 150 and 330 hunts, a point of attribute costs about two
and a half, and a lunar piece off a carcass is under one hunt in two hundred, so
it stays a night of luck instead of the wage.

Experience for the next level is `100 * level * (1 + level / 25)`: a creature
gives experience that grows linearly with its level, so a linear requirement
would hold every level at the same five hunts from 1 to 1000. The quadratic term
is what makes the ladder climb, from about 4 hunts at level 1 to 293 at the
ceiling. `models/rules/mining.ts` uses the same shape, and a vein yields a
multiple more every twenty mining levels, so the forge keeps being fed.

**The bench.** `scripts/balance.mjs` compiles `src/models` into `.sim/` and
measures the real rules — never a copy of them — for a reference build at every
band: trained attributes at `0.55 x level` (the pace the training rule targets)
wearing the whole set of the band. It reports health lost per hunt, defeats in a
chained night of hunting, and rounds per fight. Because the level pays nothing,
a hunter is nearly flat inside a band, so the bestiary is measured against that
same reference hunter (`PREY_STRENGTH_SHARE` and its two siblings) instead of
against the raw level. That reference wears what a player actually owns:
`referenceGear` starts a band in the previous band's set and reaches the new one
over `SET_REACHED_AT` (8% of the band), because a set costs about two hundred
hunts and a band holds thousands. Skipping that ramp is what once made the first
rabbit take ten rounds against a hunter with no gear at all. `bandPressure`
ramps 0.92x to 1.12x across a band —
a fresh set is relief, the band's end asks for the next one. As tuned: bands
open between 5% and 13% of health lost per hunt and close between 7% and 23%,
the ceiling sits at 23.3% with 5.2% defeats over a night, and no fight comes
near the 24 cycle cap, with the beast form on, since that is the only way to
hunt. Skipping training hurts from band one; skipping the forge is survivable
until the lunar bands punish it. Potions (60/2500/12000), the
training fee and the renames are the silver sinks. Changing any of those numbers
means re-running the bench, not nudging.

## Wizold Store

The store lives at the foot of the aside, under the moon and above the wiki,
wearing the ember of a primary action so it reads as the one paid door in the
game. Three packs of silver sold for real money, through the same demo Pix the
bazaar uses. The frame also carries a plain footer on every page, with the
game's name and the reminder that the run never leaves this browser.

A pack is priced in hunts, never in silver. `packSilver` multiplies `huntPurse`
of the buyer's level by the pack's `hunts`, so the same price always buys the
same amount of time and climbing a band raises what the pack delivers. There is
deliberately no floor: buying at level 1 hands over very little silver in
absolute terms, because at level 1 there is nothing to skip. A floor is what
would turn the store into a shortcut, since a beginner holding a late band's
purse would empty the yard in an afternoon.

The store sells time, not progress: silver buys training and gear, and neither
experience nor a level is for sale anywhere in the game.

  Bolsa do Andarilho   25 hunts   R$ 4,90
  Arca do Caçador     125 hunts   R$ 19,90
  Tesouro da Lua      400 hunts   R$ 49,90

At the top band that is 106.500, 532.500 and 1.704.000 of silver, which is 9%,
47% and 149% of the lunar set. The middle pack is marked as the best trade
because silver per real climbs with the size: 71, 88 and 112 at level 7.

## Landing page

The door at `/` is the only page written for someone who has never played. Its
copy is data, not markup: `models/data/lore.ts` holds the four chapters of Lumni
and Luna, each with the path of its narration, and `models/data/preview.ts` holds
the four screens of the tour. A chapter is a title, a paragraph and the button
that reads it out loud, in that order, so the voice sits under the text it
narrates and takes only the width of its own label.

The narrations in `public/assets/voice` are cut from the chapter texts by the
same hand: changing a chapter means re-cutting its file, never leaving the two
out of step. They are read by `useNarration` inside the screen, one `Audio` at a
time, so pressing a second chapter stops the first.

`views/components/preview-gallery.tsx` shows the tour right under the lore: the
shots are stacked in one frame of fixed proportion and crossfaded, the caption
under them names what the screen is for, and the row of `Chip` under that picks
one by hand. The clock is a `setTimeout` re-armed on every change, so a shot
picked by hand gets the full turn instead of being cut short by a tick already
in flight, and hovering the frame holds it. The shots are cut to the same
1280x648 so nothing jumps between them.

## Automation

`models/entities/automation.ts` is the switchboard the settings page draws, and
`controllers/automation.controller.ts` is the only place in the game that
decides anything without the player. It never touches the state: it reads the
run and answers with the one thing to do next, and the provider takes that
answer to the same use cases a click uses, so an automatic potion and a potion
drunk by hand are the same code. The clock beats every `AUTOMATION_TICK_MS`.

The switches chain on purpose: a hunt that drains the body drinks a potion, and
when the flask runs out the body rests, and when the body is whole the hunt
starts again. What makes that possible is `Activity` carrying two extra marks —
`paused`, for a job that ran out of health, silver or fragments and is waiting
instead of being dropped, and `resume`, which an automatic rest writes down so
the whole body goes back to the job it interrupted. A job only pauses when its
own switch is on; with everything off, the loops stop the way they always did.

## The floor of the body

`MIN_HEALTH_RATIO_TO_ACT` (20%) is one number for the whole run: below it there
is no hunt, no duel and no turning. Turning is refused in `toggleForm`, not only
on a screen, because a body that far gone does not survive it.

## Commands

```bash
npm run dev       # local environment
npm run build     # production build
npm run lint      # eslint
npm test          # the audit bench: every documented rule proven against the code
npx tsc --noEmit  # type check

node scripts/balance.mjs          # the difficulty curve, band by band (npm run bench)
node scripts/balance.mjs 340      # one level, with a night of hunting
node scripts/forge-sounds.mjs     # re-render every synthesised effect
node scripts/forge-sounds.mjs hit # just one of them
```

`scripts/` holds the three benches that make numbers and assets instead of
code: the balance bench compiles the model so it measures the real rules, the
audit bench proves every documented invariant against that same compiled model
(formulas, gates, immutability over a frozen state, save migrations), and the
sound forge synthesises every effect from a recipe and encodes it with ffmpeg.
All three write to scratch folders (`.sim`, `.sim-audit`, `.sound-forge`) that
git and eslint ignore. The audit bench is the gate before and after touching
rules, controllers or the persistence layer, and the save migration fixtures
live inside it. Three effects — `buy`, `sell` and `mine` — are hand picked files the
forge never touches.
