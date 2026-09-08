"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type PointerEvent } from "react";
import { api } from "@/controllers/api.client";
import { useArt } from "@/controllers/art.context";
import { renameCost, renameDaysLeft } from "@/controllers/character.controller";
import { AUTOMATIONS } from "@/models/entities/automation";
import { isVip, VIP_PRICE_CENTS } from "@/models/rules/vip";
import { useGame } from "@/controllers/game.context";
import { playSoundPreview } from "@/controllers/sound";
import { disableTavernPush, enableTavernPush, testTavernPush, webPushConfigured, tavernPushSupported } from "@/controllers/tavern-notify";
import { useLanguageChoice, useT } from "@/controllers/use-locale";
import { backgroundRepository } from "@/models/repositories/background.repository";
import { languageRepository } from "@/models/repositories/language.repository";
import { musicRepository } from "@/models/repositories/music.repository";
import { radioRepository } from "@/models/repositories/radio.repository";
import { soundRepository } from "@/models/repositories/sound.repository";
import { tavernPushRepository } from "@/models/repositories/tavern-push.repository";
import { NAME_MAX_LENGTH, RENAME_COOLDOWN_DAYS, RENAME_PRICE } from "@/shared/constants/game";
import { TWO_FACTOR_CODE_LENGTH } from "@/shared/constants/auth";
import { BRAND_LOGO_PNG_PATH, BRAND_LOGO_WEBP_PATH } from "@/shared/constants/site";
import { formatNumber, formatBronze, formatReais, formatDay } from "@/shared/utils/format";
import { sanitizeName } from "@/shared/utils/text";
import { Button } from "../components/button";
import { AiAuditNotice } from "../components/ai-audit-notice";
import { Chip } from "../components/chip";
import { ChipTabs } from "../components/chip-tabs";
import { ConfirmDialog } from "../components/confirm-dialog";
import { Field } from "../components/field";
import { Modal } from "../components/modal";
import { GenderArtFill } from "../components/gender-icon";
import { IconArt } from "../components/icon-frame";
import { List, ListRow, RowText } from "../components/list";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
import { PageHeader } from "../layout/page-header";

const SECTIONS: readonly { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "idioma", label: "Language" },
  { key: "conta", label: "Account" },
  { key: "2fa", label: "Two-step" },
  { key: "nome", label: "Name" },
  { key: "taverna", label: "Tavern" },
  { key: "radio", label: "W-Radio" },
  { key: "som", label: "Sound" },
  { key: "trilha", label: "Soundtrack" },
  { key: "fundo", label: "Background" },
  { key: "automacao", label: "Automation" },
  { key: "cache", label: "Cache" },
  { key: "excluir", label: "Delete account" },
];

export function SettingsScreen() {
  const t = useT();
  const {
    state,
    character,
    renameCharacter,
    requestDeleteCode,
    deleteRun,
    logout,
    logoutEverywhere,
    sendTwoFactorCode,
    enableTwoFactor,
    disableTwoFactor,
    setAutomation,
    buyVip,
  } = useGame();
  const router = useRouter();
  const [now] = useState(() => Date.now());

  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountPicture, setAccountPicture] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<"enable" | "disable" | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  useEffect(() => {
    let alive = true;
    void api<{
      email: string | null;
      picture: string | null;
      twoFactorEnabled?: boolean;
    }>("GET", "/api/auth/me").then((answer) => {
      if (!alive || !answer.ok) return;
      setAccountEmail(answer.data?.email ?? null);
      setAccountPicture(answer.data?.picture ?? null);
      setTwoFactorEnabled(answer.data?.twoFactorEnabled === true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const [newName, setNewName] = useState("");
  const [confirmingRename, setConfirmingRename] = useState(false);
  const [deleting, setDeleting] = useState<"ask" | "code" | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const art = useArt();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function clearGameCache() {
    setClearing(true);
    try {
      const urls = [
        BRAND_LOGO_WEBP_PATH,
        BRAND_LOGO_PNG_PATH,
        "/assets/ui/background.jpg?v=2",
        ...Object.values(art.items),
        ...Object.values(art.attributes),
        ...Object.values(art.training),
        ...Object.values(art.territories),
        ...Object.values(art.creatures),
        ...Object.values(art.pets),
        ...Object.values(art.genders),
        ...Object.values(art.packs),
      ];
      await Promise.allSettled(urls.map((url) => fetch(url, { cache: "reload" })));
      const doomed: string[] = [];
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key?.startsWith("lumni-wizold:")) doomed.push(key);
      }
      for (const key of doomed) window.localStorage.removeItem(key);
    } finally {
      window.location.reload();
    }
  }

  const sound = useSyncExternalStore(
    soundRepository.subscribe,
    soundRepository.enabled,
    soundRepository.serverSnapshot,
  );

  const volume = useSyncExternalStore(
    soundRepository.subscribe,
    soundRepository.volume,
    soundRepository.serverVolumeSnapshot,
  );

  function chooseSound(on: boolean) {
    soundRepository.setEnabled(on);
    if (on && soundRepository.volume() <= 0) soundRepository.setVolume(1);
    if (on) playSoundPreview("ui");
  }

  const animatedBackground = useSyncExternalStore(
    backgroundRepository.subscribe,
    backgroundRepository.enabled,
    backgroundRepository.serverSnapshot,
  );

  const backdropDarkness = useSyncExternalStore(
    backgroundRepository.subscribe,
    backgroundRepository.darkness,
    backgroundRepository.serverDarknessSnapshot,
  );

  const pushOn = useSyncExternalStore(
    tavernPushRepository.subscribe,
    tavernPushRepository.enabled,
    tavernPushRepository.serverSnapshot,
  );

  async function choosePush(on: boolean) {
    if (on) await enableTavernPush();
    else await disableTavernPush();
  }

  const music = useSyncExternalStore(
    musicRepository.subscribe,
    musicRepository.enabled,
    musicRepository.serverSnapshot,
  );
  const musicVolume = useSyncExternalStore(
    musicRepository.subscribe,
    musicRepository.volume,
    musicRepository.serverVolumeSnapshot,
  );
  const musicTrack = useSyncExternalStore(
    musicRepository.subscribe,
    musicRepository.track,
    musicRepository.serverTrackSnapshot,
  );

  const languageChoice = useLanguageChoice();

  function chooseMusic(on: boolean) {
    musicRepository.setEnabled(on);
    if (on && musicRepository.volume() <= 0) musicRepository.setVolume(musicRepository.defaultVolume());
  }

  const radioVolume = useSyncExternalStore(
    radioRepository.subscribe,
    radioRepository.volume,
    radioRepository.serverVolumeSnapshot,
  );

  const [section, setSection] = useState("all");

  function shows(key: string): boolean {
    return section === "all" || section === key;
  }

  const volumeDragging = useRef(false);

  function finishVolumeAdjust() {
    if (!volumeDragging.current) return;
    volumeDragging.current = false;
    if (soundRepository.volume() > 0) playSoundPreview("ui");
  }

  function releaseVolumePointer(event: PointerEvent<HTMLInputElement>) {
    const target = event.currentTarget;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
  }

  if (!character) return null;

  const active = AUTOMATIONS.filter((entry) => state.automation[entry.key]).length;

  const daysLeft = renameDaysLeft(character);
  const canRename = daysLeft === 0;
  const cost = renameCost(character.level);
  const affordable = character.bronze >= cost;
  const vip = isVip(character, now);

  function submitRename(event: FormEvent) {
    event.preventDefault();
    setConfirmingRename(true);
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="The account, the name the pack knows and the run itself."
      />

      <ChipTabs tabs={SECTIONS} value={section} onChange={setSection} />

      <div className="space-y-6">
        {shows("idioma") ? (
          <Panel
            title="Language"
            description="The language the game speaks to you on this device."
            padding="none"
          >
            <List>
              <ListRow layout="split">
                <RowText
                  title="Language"
                  description="Automatic follows the browser language. The game is written in English and translated from it."
                />
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Chip
                    active={languageChoice === "auto"}
                    onClick={() => languageRepository.setChoice("auto")}
                  >
                    Automatic
                  </Chip>
                  <Chip
                    active={languageChoice === "en"}
                    onClick={() => languageRepository.setChoice("en")}
                  >
                    English
                  </Chip>
                  <Chip
                    active={languageChoice === "pt"}
                    onClick={() => languageRepository.setChoice("pt")}
                  >
                    Português
                  </Chip>
                  <Chip
                    active={languageChoice === "es"}
                    onClick={() => languageRepository.setChoice("es")}
                  >
                    Español
                  </Chip>
                </div>
              </ListRow>
            </List>
          </Panel>
        ) : null}

        {shows("conta") ? (
          <Panel
            title="Account"
            description="Who this run is signed with."
            action={<Tag tone="neutral">Google</Tag>}
            padding="none"
            footer={
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    logout().then(() => {
                      router.push("/");
                    })
                  }
                >
                  Sign out
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    logoutEverywhere().then(() => {
                      router.push("/");
                    })
                  }
                >
                  Sign out of every device
                </Button>
              </div>
            }
          >
            <div className="flex items-stretch border-b border-edge">
              <span className="flex aspect-square w-16 shrink-0 items-center justify-center overflow-hidden border-r border-edge sm:w-20">
                {accountPicture ? (
                  <IconArt source={accountPicture} padded={false} zoom={false} />
                ) : (
                  <GenderArtFill gender={character.gender} />
                )}
              </span>
              <div className="flex min-w-0 grow items-center px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{t("Connected with Google")}</p>
                  <p className="truncate font-mono text-[11px] text-ink-faint">
                    {accountEmail ?? t("loading...")}
                  </p>
                </div>
              </div>
            </div>
            <p className="p-4 text-xs leading-relaxed text-ink-faint">
              {t(
                "The door is the Google account, and the run lives on the server: leave whenever you want, and the same enter button gives everything back as it was. Leaving every device drops any session open elsewhere at once.",
              )}
            </p>
          </Panel>
        ) : null}

        {shows("2fa") ? (
          <Panel
            title="Two-step verification"
            padding="none"
            footer={
              <p className="text-xs leading-relaxed text-ink-faint">
                {t(
                  "An eight-digit code in the e-mail confirms each entry, on top of Google. With verification on, the door only opens after you type that code.",
                )}
              </p>
            }
          >
            <List>
              <ListRow layout="split">
                <RowText title="State" description="On or off for the account." />
                <div className="flex shrink-0 gap-2">
                  <Chip
                    active={twoFactorEnabled}
                    onClick={() => {
                      if (twoFactorEnabled) return undefined;
                      return sendTwoFactorCode("enable").then((sent) => {
                        if (sent) {
                          setTwoFactorCode("");
                          setTwoFactorSetup("enable");
                        }
                      });
                    }}
                  >
                    On
                  </Chip>
                  <Chip
                    active={!twoFactorEnabled}
                    onClick={() => {
                      if (!twoFactorEnabled) return undefined;
                      return sendTwoFactorCode("disable").then((sent) => {
                        if (sent) {
                          setTwoFactorCode("");
                          setTwoFactorSetup("disable");
                        }
                      });
                    }}
                  >
                    Off
                  </Chip>
                </div>
              </ListRow>
            </List>
          </Panel>
        ) : null}

        {shows("nome") ? (
          <Panel
            title="Character name"
            description={
              "The name can change once every " +
              RENAME_COOLDOWN_DAYS +
              " days, and the change costs " +
              formatBronze(RENAME_PRICE) +
              "."
            }
          >
            <form onSubmit={submitRename} className="space-y-3">
              <Field label="Current name" value={character.name} disabled className="font-mono" />
              <Field
                label="New name"
                value={newName}
                maxLength={NAME_MAX_LENGTH}
                placeholder="What the pack will call you"
                autoComplete="off"
                disabled={!canRename}
                hint={
                  canRename
                    ? "The next change only in " + RENAME_COOLDOWN_DAYS + " days."
                    : "Can change again in " +
                      formatNumber(daysLeft) +
                      (daysLeft > 1 ? " days." : " day.")
                }
                onChange={(event) => setNewName(sanitizeName(event.target.value, NAME_MAX_LENGTH))}
              />
              <AiAuditNotice />
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={!canRename || !affordable || newName.trim().length === 0}
              >
                {affordable
                  ? "Change for " + formatBronze(cost)
                  : formatBronze(cost - character.bronze) + " short"}
              </Button>
            </form>
          </Panel>
        ) : null}

        {shows("taverna") ? (
          <Panel
            title="Tavern"
            description="Desktop notices for your tables' messages: the table name, who spoke, when and what, with a button to answer straight in the tavern. With Web Push on, they arrive even with the game closed; without it, only while a Wizold tab is open outside the tavern."
            padding="none"
          >
            <List>
              <ListRow layout="split">
                <RowText title="State" description="Table notices on this device." />
                <div className="flex shrink-0 gap-2">
                  <Chip active={pushOn} onClick={() => choosePush(true)} disabled={!tavernPushSupported()}>
                    On
                  </Chip>
                  <Chip active={!pushOn} onClick={() => choosePush(false)}>
                    Off
                  </Chip>
                </div>
              </ListRow>
              {!webPushConfigured() ? (
                <ListRow layout="column">
                  <p className="text-[11px] leading-relaxed text-ink-faint">
                    {t(
                      "Web Push is not configured in this environment yet; local notices keep working while the game is open.",
                    )}
                  </p>
                </ListRow>
              ) : null}
              {pushOn ? (
                <ListRow layout="column">
                  <Button variant="secondary" onClick={testTavernPush}>
                    Test notification
                  </Button>
                  <p className="text-[11px] leading-relaxed text-ink-faint">
                    {t(
                      "Did not show? The browser or Windows may be silencing it: check Focus assist and Chrome notifications in the system settings.",
                    )}
                  </p>
                </ListRow>
              ) : null}
            </List>
          </Panel>
        ) : null}

        {shows("radio") ? (
          <Panel
            title="W-Radio"
            description="The radio volume. On and off, skipping tracks and seeing what plays live in the tavern player, and the radio only plays there. While the radio plays, the soundtrack and the game's effects stay silent."
            padding="none"
          >
            <List>
              <ListRow layout="column">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    {t("Volume")}
                  </span>
                  <span className="font-mono text-[11px] text-ink">
                    {Math.round(radioVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(radioVolume * 100)}
                  aria-label={t("Radio volume")}
                  className="volume-slider w-full"
                  onChange={(event) => {
                    radioRepository.setVolume(Number(event.target.value) / 100);
                  }}
                />
              </ListRow>
            </List>
          </Panel>
        ) : null}

        {shows("som") ? (
          <Panel
            title="Sound"
            description="The game's effects: leather, coins and the roar of the turning."
            padding="none"
          >
            <List>
              <ListRow layout="split">
                <RowText title="State" description="On or off on this device." />
                <div className="flex shrink-0 gap-2">
                  <Chip active={sound} onClick={() => chooseSound(true)}>
                    On
                  </Chip>
                  <Chip active={!sound} onClick={() => chooseSound(false)}>
                    Off
                  </Chip>
                </div>
              </ListRow>
              {sound ? (
                <ListRow layout="column">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">{t("Volume")}</span>
                    <span className="font-mono text-[11px] text-ink">{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round(volume * 100)}
                    aria-label={t("Sound volume")}
                    className="volume-slider w-full"
                    onPointerDown={(event) => {
                      volumeDragging.current = true;
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    onChange={(event) => {
                      soundRepository.setVolume(Number(event.target.value) / 100);
                    }}
                    onPointerUp={(event) => {
                      releaseVolumePointer(event);
                      finishVolumeAdjust();
                    }}
                    onPointerCancel={(event) => {
                      releaseVolumePointer(event);
                      volumeDragging.current = false;
                    }}
                    onKeyDown={() => {
                      volumeDragging.current = true;
                    }}
                    onKeyUp={finishVolumeAdjust}
                  />
                </ListRow>
              ) : null}
            </List>
          </Panel>
        ) : null}

        {shows("trilha") ? (
          <Panel
            title="Soundtrack"
            description="The music running under the game. It does not play at the front door."
            padding="none"
          >
            <List>
              <ListRow layout="split">
                <RowText title="State" description="On or off on this device." />
                <div className="flex shrink-0 gap-2">
                  <Chip active={music} onClick={() => chooseMusic(true)}>
                    Enabled
                  </Chip>
                  <Chip active={!music} onClick={() => chooseMusic(false)}>
                    Disabled
                  </Chip>
                </div>
              </ListRow>
              {music ? (
                <ListRow layout="split">
                  <RowText
                    title="Track"
                    description="Which track runs under the game on this device. Random draws one and, when it ends, draws another."
                  />
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Chip active={musicTrack === "1"} onClick={() => musicRepository.setTrack("1")}>
                      Track 1
                    </Chip>
                    <Chip active={musicTrack === "2"} onClick={() => musicRepository.setTrack("2")}>
                      Track 2
                    </Chip>
                    <Chip active={musicTrack === "3"} onClick={() => musicRepository.setTrack("3")}>
                      Track 3
                    </Chip>
                    <Chip
                      active={musicTrack === "random"}
                      onClick={() => musicRepository.setTrack("random")}
                    >
                      Random
                    </Chip>
                  </div>
                </ListRow>
              ) : null}
              {music ? (
                <ListRow layout="column">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      {t("Volume")}
                    </span>
                    <span className="font-mono text-[11px] text-ink">
                      {Math.round(musicVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round(musicVolume * 100)}
                    aria-label={t("Soundtrack volume")}
                    className="volume-slider w-full"
                    onChange={(event) => {
                      musicRepository.setVolume(Number(event.target.value) / 100);
                    }}
                  />
                  <p className="text-[11px] leading-relaxed text-ink-faint">
                    {t(
                      "The track starts at 75% and runs under the effects, which ride over it so the leather, the coins and the roar of the turning stay audible. The volume applies at once.",
                    )}
                  </p>
                </ListRow>
              ) : null}
            </List>
          </Panel>
        ) : null}

        {shows("fundo") ? (
          <Panel
            title="Background animation"
            description="The living night behind the game and the hunt area videos. Off, the still images remain."
            padding="none"
          >
            <List>
              <ListRow layout="split">
                <RowText title="State" description="On or off on this device." />
                <div className="flex shrink-0 gap-2">
                  <Chip active={animatedBackground} onClick={() => backgroundRepository.setEnabled(true)}>
                    On
                  </Chip>
                  <Chip active={!animatedBackground} onClick={() => backgroundRepository.setEnabled(false)}>
                    Off
                  </Chip>
                </div>
              </ListRow>
              {animatedBackground ? (
                <ListRow layout="column">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      {t("Darkness")}
                    </span>
                    <span className="font-mono text-[11px] text-ink">
                      {Math.round(backdropDarkness * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round(backdropDarkness * 100)}
                    aria-label={t("Darkness of the animated background")}
                    className="volume-slider w-full"
                    onChange={(event) => {
                      backgroundRepository.setDarkness(Number(event.target.value) / 100);
                    }}
                  />
                  <p className="text-[11px] leading-relaxed text-ink-faint">
                    {t(
                      "The curtain in front of the video: 0% shows the raw night and 100% closes the foot of the screen, the default on entry. The effect shows back here at once.",
                    )}
                  </p>
                </ListRow>
              ) : null}
            </List>
          </Panel>
        ) : null}

        {shows("automacao") ? (
          <Panel
            title="Automation"
            description="What the run does on its own. Each switch does one thing only, and they help each other: the hunt drinks, the potion runs out, the body rests, the hunt returns. A VIP feature."
            action={
              vip ? (
                <Tag tone="light">
                  {formatNumber(active) + " of " + AUTOMATIONS.length + " on"}
                </Tag>
              ) : (
                <Tag tone="neutral">Requires VIP</Tag>
              )
            }
            padding="none"
            footer={
              vip ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-ink-faint">
                    {character.vipCanceling
                      ? "VIP active until " + formatDay(character.vipUntil ?? "") + ", not renewing."
                      : "Active subscription, renews on " + formatDay(character.vipUntil ?? "") + "."}
                  </span>
                  <Button variant="outline" onClick={() => router.push("/store")}>
                    Manage in the store
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-ink-faint">
                    {t("Automation is a VIP feature. Enable it to turn the switches on.")}
                  </span>
                  <Button variant="primary" onClick={() => buyVip()}>
                    {t("Enable VIP for") + " " + formatReais(VIP_PRICE_CENTS) + t("/month")}
                  </Button>
                </div>
              )
            }
          >
            <List>
              {AUTOMATIONS.map((entry) => (
                <ListRow key={entry.key} layout="split">
                  <RowText title={entry.label} description={entry.effect} />
                  <div
                    className={"flex shrink-0 gap-2" + (vip ? "" : " pointer-events-none opacity-50")}
                  >
                    <Chip
                      active={state.automation[entry.key]}
                      disabled={!vip}
                      onClick={() => setAutomation(entry.key, true)}
                    >
                      On
                    </Chip>
                    <Chip
                      active={!state.automation[entry.key]}
                      disabled={!vip}
                      onClick={() => setAutomation(entry.key, false)}
                    >
                      Off
                    </Chip>
                  </div>
                </ListRow>
              ))}
            </List>
          </Panel>
        ) : null}

        {shows("cache") ? (
          <Panel
            title="Game cache"
            description="What this device keeps to open faster."
            footer={
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-ink-faint">
                  {clearing ? "Clearing and reloading..." : "The run on the server does not change"}
                </span>
                <Button variant="outline" busy={clearing} onClick={() => setConfirmingClear(true)}>
                  Clear cache
                </Button>
              </div>
            }
          >
            <p className="text-xs leading-relaxed text-ink-faint">
              {t(
                "The browser keeps copies of the game's images and this device's preferences: sound, volume, track, background animation and darkness, the birth date remembered at the door and the work under way. Clearing the cache discards those copies, downloads the images again from the server and reloads the page; it is for when some art shows wrong or outdated.",
              )}
            </p>
          </Panel>
        ) : null}

        {shows("excluir") ? (
          <Panel
            title="Delete account"
            description="Erases the whole run from the server. There is no way back."
            footer={
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-ink-faint">
                  {character.name} - {t("LV.")} {formatNumber(character.level)}
                </span>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteCode("");
                    setDeleting("ask");
                  }}
                >
                  Delete account
                </Button>
              </div>
            }
          >
            <p className="text-xs leading-relaxed text-ink-faint">
              {t(
                "Character, bag, forge, wolf, wallet and listings: everything vanishes at once, and the account returns to character creation.",
              )}
            </p>
          </Panel>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmingClear}
        title="Clear cache"
        description="The images will be downloaded again and this device's preferences (sound, volume, track, background animation and darkness, remembered birth date and work under way) return to the default. The run on the server is not touched."
        detail="The page reloads when done."
        confirmLabel="Clear"
        onCancel={() => setConfirmingClear(false)}
        onConfirm={async () => {
          await clearGameCache();
          setConfirmingClear(false);
        }}
      />

      <ConfirmDialog
        open={confirmingRename}
        title="Change name"
        description={
          "The WCoins leave on the spot and the new name is locked for " +
          RENAME_COOLDOWN_DAYS +
          " days, on the ranking, in the tavern and in the bazaar."
        }
        detail={character.name + " → " + newName.trim() + " - " + formatBronze(cost)}
        confirmLabel="Change"
        onCancel={() => setConfirmingRename(false)}
        onConfirm={() =>
          renameCharacter(newName).then((ok) => {
            if (ok) setNewName("");
            setConfirmingRename(false);
          })
        }
      />

      <Modal
        open={twoFactorSetup !== null}
        title={twoFactorSetup === "enable" ? "Turn verification on" : "Turn verification off"}
        onClose={() => setTwoFactorSetup(null)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setTwoFactorSetup(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!/^\d{8}$/.test(twoFactorCode)}
              onClick={() => {
                const action = twoFactorSetup === "enable" ? enableTwoFactor : disableTwoFactor;
                return action(twoFactorCode).then((ok) => {
                  if (!ok) return;
                  setTwoFactorEnabled(twoFactorSetup === "enable");
                  setTwoFactorSetup(null);
                  setTwoFactorCode("");
                });
              }}
            >
              Confirm
            </Button>
          </div>
        }
      >
        <div className="space-y-3 p-4">
          <p className="text-xs leading-relaxed text-ink-soft">
            {t("Type the eight-digit code sent to")}{" "}
            <span className="text-ink">{accountEmail ?? t("your e-mail")}</span>.
          </p>
          <Field
            label="Code"
            numeric
            maxLength={TWO_FACTOR_CODE_LENGTH}
            value={twoFactorCode}
            autoComplete="one-time-code"
            onChange={(event) =>
              setTwoFactorCode(event.target.value.slice(0, TWO_FACTOR_CODE_LENGTH))
            }
          />
        </div>
      </Modal>

      <Modal
        open={deleting !== null}
        title="Delete account"
        onClose={() => setDeleting(null)}
        footer={
          deleting === "ask" ? (
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  requestDeleteCode().then((sent) => {
                    if (sent) setDeleting("code");
                  })
                }
              >
                Send code
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!/^\d{4}$/.test(deleteCode)}
                onClick={() =>
                  deleteRun(deleteCode).then((gone) => {
                    if (gone) {
                      setDeleting(null);
                      router.push("/");
                    }
                  })
                }
              >
                Delete everything
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-3 p-4">
          <p className="text-xs leading-relaxed text-ink-soft">
            {character.name +
              " - " +
              t("LV.") +
              " " +
              formatNumber(character.level) +
              ". " +
              t(
                "The account and everything it keeps vanish from the server now and forever: character, bag, wallet, tables and traces. There is no way to recover.",
              )}
          </p>
          {deleting === "ask" ? (
            <p className="text-xs leading-relaxed text-ink-faint">
              {t(
                "To confirm, we will send a 4-digit code to the account's e-mail. It is good for 10 minutes.",
              )}
            </p>
          ) : (
            <Field
              numeric
              label="4-digit code"
              hint="It arrived at the account e-mail and lasts 10 minutes."
              placeholder="0000"
              className="font-mono"
              autoComplete="off"
              value={deleteCode}
              onChange={(event) => setDeleteCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          )}
        </div>
      </Modal>
    </>
  );
}
