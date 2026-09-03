import type { PoolClient } from "pg";
import type { TavernReadMap, TavernUiState, TavernUserState } from "../../entities/tavern";

export type { TavernReadMap, TavernUiState, TavernUserState };

const CLOSED_UI: TavernUiState = {
  roomId: null,
  open: false,
  x: 0,
  y: 0,
};

function finite(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export async function loadTavernUser(
  client: PoolClient,
  characterId: string,
): Promise<TavernUserState> {
  const readRows = await client.query(
    "select room_id, last_read_at from tavern_read_cursors where character_id = $1",
    [characterId],
  );
  const read: TavernReadMap = {};
  for (const row of readRows.rows) {
    read[row.room_id] = new Date(row.last_read_at).toISOString();
  }

  const uiRows = await client.query(
    "select open_room_id, window_open, window_x, window_y from tavern_ui_state where character_id = $1",
    [characterId],
  );
  const uiRow = uiRows.rows[0];
  if (!uiRow) return { read, ui: CLOSED_UI };

  return {
    read,
    ui: {
      roomId: typeof uiRow.open_room_id === "string" ? uiRow.open_room_id : null,
      open: uiRow.window_open === true,
      x: finite(uiRow.window_x),
      y: finite(uiRow.window_y),
    },
  };
}

export async function markTavernRead(
  client: PoolClient,
  characterId: string,
  roomId: string,
  at: string,
  alive?: Iterable<string>,
): Promise<TavernReadMap> {
  const stamp = new Date(at);
  if (Number.isNaN(stamp.getTime())) return (await loadTavernUser(client, characterId)).read;

  await client.query(
    `insert into tavern_read_cursors (character_id, room_id, last_read_at)
     values ($1, $2, $3)
     on conflict (character_id, room_id) do update
     set last_read_at = excluded.last_read_at
     where tavern_read_cursors.last_read_at < excluded.last_read_at`,
    [characterId, roomId, stamp],
  );

  if (alive) {
    const keep = new Set(alive);
    const rows = await client.query(
      "select room_id from tavern_read_cursors where character_id = $1",
      [characterId],
    );
    for (const row of rows.rows) {
      if (!keep.has(row.room_id)) {
        await client.query(
          "delete from tavern_read_cursors where character_id = $1 and room_id = $2",
          [characterId, row.room_id],
        );
      }
    }
  }

  return (await loadTavernUser(client, characterId)).read;
}

export async function saveTavernUi(
  client: PoolClient,
  characterId: string,
  ui: TavernUiState,
): Promise<TavernUiState> {
  if (!ui.open || !ui.roomId) {
    await client.query("delete from tavern_ui_state where character_id = $1", [characterId]);
    return CLOSED_UI;
  }

  await client.query(
    `insert into tavern_ui_state (character_id, open_room_id, window_open, window_x, window_y)
     values ($1, $2, true, $3, $4)
     on conflict (character_id) do update
     set open_room_id = excluded.open_room_id,
         window_open = true,
         window_x = excluded.window_x,
         window_y = excluded.window_y`,
    [characterId, ui.roomId, ui.x, ui.y],
  );

  return {
    roomId: ui.roomId,
    open: true,
    x: ui.x,
    y: ui.y,
  };
}
