import { generateId } from "@/shared/utils/id";
import { containsLink } from "@/shared/utils/text";
import {
  isPrivateTable,
  isRoomFull,
  nextRoomNumber,
  MAX_ROOM_MEMBERS,
  MAX_ROOM_MESSAGES,
  MESSAGE_COOLDOWN_MS,
  MESSAGE_MAX_LENGTH,
  MEMBER_TIMEOUT_MS,
  OPEN_ROOM_MIN_LEVEL,
  canOpenUnlockedRoom,
  validateRoomName,
  type TavernIdentity,
  type TavernResult,
  type TavernRoom,
  type TavernState,
} from "@/models/entities/tavern";
import { nickColorCapacity, seatMember } from "@/models/rules/tavern-nicks";

function fail(state: TavernState, message: string): TavernResult {
  return { ok: false, message, state };
}

function done(state: TavernState, message: string, roomId?: string): TavernResult {
  return { ok: true, message, state, roomId };
}

function replaceRoom(state: TavernState, room: TavernRoom): TavernState {
  return {
    ...state,
    rooms: state.rooms.map((current) => (current.id === room.id ? room : current)),
  };
}

export function findRoom(state: TavernState, roomId: string): TavernRoom | undefined {
  return state.rooms.find((room) => room.id === roomId);
}

export function pruneTavern(state: TavernState, now: number): TavernState {
  const rooms = state.rooms
    .map((room) =>
      isPrivateTable(room)
        ? room
        : {
            ...room,
            members: room.members.filter(
              (member) => now - new Date(member.lastSeen).getTime() < MEMBER_TIMEOUT_MS,
            ),
          },
    )
    .filter((room) => isPrivateTable(room) || room.members.length > 0);

  const changed =
    rooms.length !== state.rooms.length ||
    rooms.some((room, index) => room.members.length !== state.rooms[index]?.members.length);

  return changed ? { ...state, rooms } : state;
}

export interface RoomSummary {
  room: TavernRoom;
  locked: boolean;
  full: boolean;
  memberCount: number;
  isMember: boolean;
  isPrivate: boolean;
}

export function listRooms(state: TavernState, identity: TavernIdentity | null): RoomSummary[] {
  return state.rooms
    .filter(
      (room) =>
        !isPrivateTable(room) ||
        (identity !== null && (room.privateFor ?? []).includes(identity.id)),
    )
    .map((room) => {
      const isMember =
        identity !== null && room.members.some((member) => member.id === identity.id);
      const safeRoom: TavernRoom = {
        ...room,
        name: isMember || !room.nameHidden ? room.name : "",
        password: null,
        messages: isMember ? room.messages : [],
      };
      return {
        room: safeRoom,
        locked: room.password !== null,
        full: isRoomFull(room),
        memberCount: room.members.length,
        isMember,
        isPrivate: isPrivateTable(room),
      };
    })
    .sort((a, b) =>
      a.isPrivate === b.isPrivate
        ? a.room.number - b.room.number
        : Number(b.isPrivate) - Number(a.isPrivate),
    );
}

export function createRoom(
  state: TavernState,
  identity: TavernIdentity,
  name: string,
  password: string,
  hideName = false,
): TavernResult {
  const problem = validateRoomName(name);
  if (problem) return fail(state, problem);

  const open = password.trim().length === 0;
  if (hideName && open) {
    return fail(state, "Mesa reservada precisa de senha.");
  }
  if (open && !canOpenUnlockedRoom(identity)) {
    return fail(
      state,
      "Abrir mesa sem senha é só a partir do NV " +
        OPEN_ROOM_MIN_LEVEL +
        ", ou com VIP. Ponha uma senha para abrir em qualquer nível.",
    );
  }

  if (state.rooms.some((room) => !isPrivateTable(room) && room.ownerId === identity.id)) {
    return fail(state, "Você já tem uma mesa aberta. Feche a sua antes de abrir outra.");
  }

  const cleanName = name.trim();
  const taken = state.rooms.some(
    (room) => !isPrivateTable(room) && room.name.toLowerCase() === cleanName.toLowerCase(),
  );
  if (taken) return fail(state, "Já existe uma mesa com esse nome.");

  const now = new Date().toISOString();
  const room: TavernRoom = {
    id: generateId("room"),
    name: cleanName,
    number: nextRoomNumber(state.rooms),
    nameHidden: hideName,
    password: password.trim().length > 0 ? password.trim() : null,
    ownerId: identity.id,
    createdAt: now,
    members: [seatMember(identity, now, [], nickColorCapacity({}))],
    messages: [
      {
        id: generateId("msg"),
        authorId: "system",
        authorName: "Taverna",
        text: identity.name + " abriu a mesa.",
        at: now,
      },
    ],
  };

  return done({ ...state, rooms: [...state.rooms, room] }, "Mesa aberta.", room.id);
}

export function joinRoom(
  state: TavernState,
  roomId: string,
  identity: TavernIdentity,
  password: string,
): TavernResult {
  const room = findRoom(state, roomId);
  if (!room) return fail(state, "Essa mesa não existe mais.");

  if (isPrivateTable(room) && !(room.privateFor ?? []).includes(identity.id)) {
    return fail(state, "Essa mesa está reservada.");
  }

  const already = room.members.some((member) => member.id === identity.id);
  if (!already) {
    if (
      !isPrivateTable(room) &&
      room.password === null &&
      (identity.level ?? 1) < OPEN_ROOM_MIN_LEVEL
    ) {
      return fail(state, "Sentar em mesa aberta é só a partir do NV " + OPEN_ROOM_MIN_LEVEL + ".");
    }
    if (isRoomFull(room))
      return fail(state, "A mesa está cheia (" + MAX_ROOM_MEMBERS + " pessoas).");
    if (room.password !== null && room.password !== password.trim()) {
      return fail(state, "Senha incorreta.");
    }
  }

  const now = new Date().toISOString();
  const members = already
    ? room.members.map((member) =>
        member.id === identity.id ? { ...member, name: identity.name, lastSeen: now } : member,
      )
    : [...room.members, seatMember(identity, now, room.members, nickColorCapacity(room))];

  const messages = [
    ...room.messages,
    {
      id: generateId("msg"),
      authorId: "system",
      authorName: "Taverna",
      text: identity.name + (already ? " retornou à mesa." : " entrou na mesa."),
      at: now,
    },
  ].slice(-MAX_ROOM_MESSAGES);

  return done(
    replaceRoom(state, { ...room, members, messages }),
    already ? "Mesa aberta." : "Você entrou em " + room.name + ".",
    room.id,
  );
}

export function leaveRoom(
  state: TavernState,
  roomId: string,
  identity: TavernIdentity,
): TavernResult {
  const room = findRoom(state, roomId);
  if (!room) return fail(state, "Essa mesa não existe mais.");
  if (!room.members.some((member) => member.id === identity.id)) {
    return fail(state, "Você não está nessa mesa.");
  }

  const members = room.members.filter((member) => member.id !== identity.id);
  if (members.length === 0) {
    return done(
      { ...state, rooms: state.rooms.filter((current) => current.id !== roomId) },
      "Você saiu e a mesa fechou.",
    );
  }

  const now = new Date().toISOString();
  const messages = [
    ...room.messages,
    {
      id: generateId("msg"),
      authorId: "system",
      authorName: "Taverna",
      text: identity.name + " saiu da mesa.",
      at: now,
    },
  ].slice(-MAX_ROOM_MESSAGES);

  return done(
    replaceRoom(state, { ...room, members, messages }),
    "Você saiu de " + room.name + ".",
  );
}

export function closeRoom(
  state: TavernState,
  roomId: string,
  identity: TavernIdentity,
): TavernResult {
  const room = findRoom(state, roomId);
  if (!room) return fail(state, "Essa mesa não existe mais.");

  const owns = isPrivateTable(room)
    ? (room.privateFor ?? []).includes(identity.id)
    : room.ownerId === identity.id;

  if (!owns) return fail(state, "Só quem abriu a mesa pode fechá-la.");

  return done(
    { ...state, rooms: state.rooms.filter((current) => current.id !== roomId) },
    isPrivateTable(room) ? "A mesa reservada fechou." : room.name + " fechou.",
  );
}

export function openDirect(
  state: TavernState,
  identity: TavernIdentity,
  other: TavernIdentity,
): TavernResult {
  if (other.id === identity.id) return fail(state, "Não dá para reservar mesa consigo mesmo.");

  const now = new Date().toISOString();
  const tableName = [identity.name, other.name]
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .join(" e ");

  const existing = state.rooms.find(
    (room) =>
      isPrivateTable(room) &&
      (room.privateFor ?? []).includes(identity.id) &&
      (room.privateFor ?? []).includes(other.id),
  );

  if (existing) {
    const seated = existing.members.some((member) => member.id === identity.id);
    const members = seated
      ? existing.members.map((member) =>
          member.id === identity.id ? { ...member, name: identity.name, lastSeen: now } : member,
        )
      : [
          ...existing.members,
          seatMember(identity, now, existing.members, nickColorCapacity(existing)),
        ];

    return done(
      replaceRoom(state, { ...existing, name: tableName, members }),
      "Mesa com " + other.name + " aberta.",
      existing.id,
    );
  }

  const room: TavernRoom = {
    id: generateId("room"),
    name: tableName,
    number: nextRoomNumber(state.rooms),
    nameHidden: false,
    password: null,
    ownerId: identity.id,
    createdAt: now,
    members: [seatMember(identity, now, [], nickColorCapacity({ privateFor: [identity.id, other.id] }))],
    privateFor: [identity.id, other.id],
    messages: [
      {
        id: generateId("msg"),
        authorId: "system",
        authorName: "Taverna",
        text: "Mesa reservada para " + identity.name + " e " + other.name + ".",
        at: now,
      },
    ],
  };

  return done(
    { ...state, rooms: [...state.rooms, room] },
    "Mesa com " + other.name + " aberta.",
    room.id,
  );
}

export function announceAway(
  state: TavernState,
  roomId: string,
  identity: TavernIdentity,
): TavernResult {
  const room = findRoom(state, roomId);
  if (!room) return fail(state, "Essa mesa não existe mais.");
  if (!room.members.some((member) => member.id === identity.id)) {
    return fail(state, "Você não está nessa mesa.");
  }

  const now = new Date().toISOString();
  const messages = [
    ...room.messages,
    {
      id: generateId("msg"),
      authorId: "system",
      authorName: "Taverna",
      text: identity.name + " foi buscar uma bebida.",
      at: now,
    },
  ].slice(-MAX_ROOM_MESSAGES);

  return done(replaceRoom(state, { ...room, messages }), "", room.id);
}

export function sendMessage(
  state: TavernState,
  roomId: string,
  identity: TavernIdentity,
  text: string,
): TavernResult {
  const room = findRoom(state, roomId);
  if (!room) return fail(state, "Essa mesa não existe mais.");
  if (!room.members.some((member) => member.id === identity.id)) {
    return fail(state, "Entre na mesa antes de falar.");
  }

  const clean = text.trim().slice(0, MESSAGE_MAX_LENGTH);
  if (clean.length === 0) return fail(state, "Escreva alguma coisa antes de enviar.");
  if (containsLink(clean)) {
    return fail(state, "Esse link não é permitido na taverna.");
  }

  const lastOwn = [...room.messages]
    .reverse()
    .find((message) => message.authorId === identity.id);
  if (lastOwn) {
    const elapsed = Date.now() - Date.parse(lastOwn.at);
    if (elapsed >= 0 && elapsed < MESSAGE_COOLDOWN_MS) {
      return fail(
        state,
        "Uma fala a cada " +
          MESSAGE_COOLDOWN_MS / 1000 +
          " segundos: espere " +
          Math.ceil((MESSAGE_COOLDOWN_MS - elapsed) / 1000) +
          "s.",
      );
    }
  }

  const now = new Date().toISOString();
  const messages = [
    ...room.messages,
    {
      id: generateId("msg"),
      authorId: identity.id,
      authorName: identity.name,
      text: clean,
      at: now,
    },
  ].slice(-MAX_ROOM_MESSAGES);

  const members = room.members.map((member) =>
    member.id === identity.id ? { ...member, name: identity.name, lastSeen: now } : member,
  );

  return done(replaceRoom(state, { ...room, members, messages }), "Mensagem enviada.", room.id);
}

export function touchMember(
  state: TavernState,
  roomId: string,
  identity: TavernIdentity,
): TavernState {
  const room = findRoom(state, roomId);
  if (!room) return state;

  const now = new Date().toISOString();
  return replaceRoom(state, {
    ...room,
    members: room.members.map((member) =>
      member.id === identity.id ? { ...member, name: identity.name, lastSeen: now } : member,
    ),
  });
}

/** Newest other-person line in a table the viewer sits at, or empty. */
export function latestSeatedChatAt(rooms: RoomSummary[], selfId: string): string {
  let latest = "";
  for (const { room, isMember } of rooms) {
    if (!isMember) continue;
    for (const message of room.messages) {
      if (message.authorId === "system" || message.authorId === selfId) continue;
      if (message.at > latest) latest = message.at;
    }
  }
  return latest;
}
