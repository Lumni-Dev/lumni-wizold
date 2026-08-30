"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { api } from "@/controllers/api.client";
import { useArt } from "@/controllers/art.context";
import { renameCost, renameDaysLeft } from "@/controllers/character.controller";
import { AUTOMATIONS } from "@/models/entities/automation";
import { useGame } from "@/controllers/game.context";
import { playSound } from "@/controllers/sound";
import { disableTavernPush, enableTavernPush, testTavernPush } from "@/controllers/tavern-notify";
import { soundRepository } from "@/models/repositories/sound.repository";
import { tavernPushRepository } from "@/models/repositories/tavern-push.repository";
import { NAME_MAX_LENGTH, RENAME_COOLDOWN_DAYS } from "@/shared/constants/game";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { sanitizeName } from "@/shared/utils/text";
import { Button } from "../components/button";
import { Chip } from "../components/chip";
import { ConfirmDialog } from "../components/confirm-dialog";
import { Field } from "../components/field";
import { Modal } from "../components/modal";
import { GenderIcon } from "../components/gender-icon";
import { IconFrame } from "../components/icon-frame";
import { List, ListRow, RowText } from "../components/list";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
import { PageHeader } from "../layout/page-header";

export function SettingsScreen() {
  const {
    state,
    character,
    renameCharacter,
    requestDeleteCode,
    deleteRun,
    logout,
    logoutEverywhere,
    setAutomation,
  } = useGame();
  const router = useRouter();

  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountPicture, setAccountPicture] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void api<{ email: string | null; picture: string | null }>("GET", "/api/auth/me").then(
      (answer) => {
        if (!alive || !answer.ok) return;
        setAccountEmail(answer.data?.email ?? null);
        setAccountPicture(answer.data?.picture ?? null);
      },
    );
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
        "/assets/ui/logo.webp?v=2",
        "/assets/ui/logo.png?v=1",
        "/assets/ui/background.jpg?v=1",
        ...Object.values(art.items),
        ...Object.values(art.attributes),
        ...Object.values(art.training),
        ...Object.values(art.territories),
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

  function chooseSound(on: boolean) {
    soundRepository.setEnabled(on);
    if (on) playSound("ui");
  }

  const pushOn = useSyncExternalStore(
    tavernPushRepository.subscribe,
    tavernPushRepository.enabled,
    tavernPushRepository.serverSnapshot,
  );

  function choosePush(on: boolean) {
    if (on) void enableTavernPush();
    else disableTavernPush();
  }

  if (!character) return null;

  const active = AUTOMATIONS.filter((entry) => state.automation[entry.key]).length;

  const daysLeft = renameDaysLeft(character);
  const canRename = daysLeft === 0;
  const cost = renameCost();
  const affordable = character.bronze >= cost;

  function submitRename(event: FormEvent) {
    event.preventDefault();
    setConfirmingRename(true);
  }

  return (
    <>
      <PageHeader
        title="Configurações"
        description="A conta, o nome que a matilha conhece e a própria partida."
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel
          title="Conta"
          description="Com quem esta partida está assinada."
          action={<Tag tone="neutral">Google</Tag>}
          padding="none"
        >
          <div className="flex items-center gap-3 border-b border-edge p-4">
            {accountPicture ? (
              <IconFrame size="medium" tone="strong">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={accountPicture}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </IconFrame>
            ) : (
              <GenderIcon gender={character.gender} size="medium" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">Conectado com Google</p>
              <p className="truncate font-mono text-[11px] text-ink-faint">
                {accountEmail ?? "carregando..."}
              </p>
            </div>
          </div>
          <div className="space-y-3 p-4">
            <p className="text-xs leading-relaxed text-ink-faint">
              A porta é a conta Google, e a partida vive no servidor: saia quando quiser, e o mesmo
              botão de entrar devolve tudo como estava. Sair de todos os aparelhos derruba qualquer
              sessão aberta em outro lugar na hora.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  logout().then(() => {
                    router.push("/");
                  })
                }
              >
                Sair da conta
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  logoutEverywhere().then(() => {
                    router.push("/");
                  })
                }
              >
                Sair de todos os aparelhos
              </Button>
            </div>
          </div>
        </Panel>

        <Panel
          title="Nome do personagem"
          description={
            "O nome pode mudar uma vez a cada " +
            RENAME_COOLDOWN_DAYS +
            " dias, e a troca custa bronze: quanto mais fundo na partida, mais caro o novo nome."
          }
        >
          <form onSubmit={submitRename} className="space-y-3">
            <Field label="Nome atual" value={character.name} disabled className="font-mono" />
            <Field
              label="Novo nome"
              value={newName}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Como a matilha vai te chamar"
              autoComplete="off"
              disabled={!canRename}
              hint={
                canRename
                  ? "O próximo ajuste só em " + RENAME_COOLDOWN_DAYS + " dias."
                  : "Pode trocar de novo em " +
                    formatNumber(daysLeft) +
                    (daysLeft > 1 ? " dias." : " dia.")
              }
              onChange={(event) => setNewName(sanitizeName(event.target.value, NAME_MAX_LENGTH))}
            />
            <Button
              type="submit"
              variant="primary"
              size="medium"
              fullWidth
              disabled={!canRename || !affordable || newName.trim().length === 0}
            >
              {affordable
                ? "Alterar por " + formatBronze(cost)
                : "Faltam " + formatBronze(cost - character.bronze)}
            </Button>
          </form>
        </Panel>
      </div>

      <Panel
        title="Automação"
        description="O que a partida faz sozinha. Cada chave faz uma coisa só, e elas se ajudam: a caçada bebe, a poção acaba, o corpo descansa, a caçada volta."
        action={
          <Tag tone="neutral">
            {formatNumber(active)} de {AUTOMATIONS.length} ativadas
          </Tag>
        }
        padding="none"
      >
        <List>
          {AUTOMATIONS.map((entry) => (
            <ListRow key={entry.key} layout="split">
              <RowText title={entry.label} description={entry.effect} />
              <div className="flex shrink-0 gap-2">
                <Chip
                  active={state.automation[entry.key]}
                  onClick={() => setAutomation(entry.key, true)}
                >
                  Ativado
                </Chip>
                <Chip
                  active={!state.automation[entry.key]}
                  onClick={() => setAutomation(entry.key, false)}
                >
                  Desativado
                </Chip>
              </div>
            </ListRow>
          ))}
        </List>
      </Panel>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel
          title="Taverna"
          description="Avisos no desktop das mensagens das suas mesas: nome da mesa, quem falou, quando e o quê, com um botão para responder direto na taverna. Chegam enquanto o jogo está aberto numa página fora da taverna."
        >
          <div className="space-y-3">
            <div className="flex gap-2">
              <Chip active={pushOn} onClick={() => choosePush(true)}>
                Ativado
              </Chip>
              <Chip active={!pushOn} onClick={() => choosePush(false)}>
                Desativado
              </Chip>
            </div>
            {pushOn ? (
              <div className="space-y-2">
                <Button variant="secondary" onClick={testTavernPush}>
                  Testar notificação
                </Button>
                <p className="text-[11px] leading-relaxed text-ink-faint">
                  Não apareceu? O navegador ou o Windows pode estar silenciando: confira o Foco
                  assistido e as notificações do Chrome nas configurações do sistema.
                </p>
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel title="Som" description="Os efeitos do jogo: couro, moedas e o rugido da virada.">
          <div className="flex gap-2">
            <Chip active={sound} onClick={() => chooseSound(true)}>
              Ativado
            </Chip>
            <Chip active={!sound} onClick={() => chooseSound(false)}>
              Desativado
            </Chip>
          </div>
        </Panel>

        <Panel
          title="Cache do jogo"
          description="O que este aparelho guarda para abrir mais rápido."
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-ink-faint">
                {clearing ? "Limpando e recarregando..." : "A partida no servidor não muda"}
              </span>
              <Button variant="outline" busy={clearing} onClick={() => setConfirmingClear(true)}>
                Limpar cache
              </Button>
            </div>
          }
        >
          <p className="text-xs leading-relaxed text-ink-faint">
            O navegador guarda cópias das imagens do jogo e as preferências deste aparelho: o som,
            a data de nascimento lembrada na porta e o trabalho em andamento. Limpar o cache
            descarta essas cópias, baixa as imagens de novo do servidor e recarrega a página;
            serve para quando alguma arte aparece errada ou desatualizada.
          </p>
        </Panel>
      </div>

      <Panel
        title="Excluir conta"
        description="Apaga a partida inteira do servidor. Não tem volta."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-ink-faint">
              {character.name} - NV. {formatNumber(character.level)}
            </span>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteCode("");
                setDeleting("ask");
              }}
            >
              Excluir conta
            </Button>
          </div>
        }
      >
        <p className="text-xs leading-relaxed text-ink-faint">
          Personagem, inventário, forja, lobo, carteira e anúncios: tudo some de uma vez, e a
          conta volta para a criação de personagem.
        </p>
      </Panel>

      <ConfirmDialog
        open={confirmingClear}
        title="Limpar cache"
        description="As imagens serão baixadas de novo e as preferências deste aparelho (som, data de nascimento lembrada e trabalho em andamento) voltam ao padrão. A partida no servidor não é tocada."
        detail="A página recarrega ao terminar."
        confirmLabel="Limpar"
        onCancel={() => setConfirmingClear(false)}
        onConfirm={() => {
          setConfirmingClear(false);
          void clearGameCache();
        }}
      />

      <ConfirmDialog
        open={confirmingRename}
        title="Alterar nome"
        description={
          "O bronze sai na hora e o novo nome fica travado por " +
          RENAME_COOLDOWN_DAYS +
          " dias, no ranking, na taverna e no bazar."
        }
        detail={character.name + " → " + newName.trim() + " - " + formatBronze(cost)}
        confirmLabel="Alterar"
        onCancel={() => setConfirmingRename(false)}
        onConfirm={() =>
          renameCharacter(newName).then((ok) => {
            if (ok) setNewName("");
            setConfirmingRename(false);
          })
        }
      />

      <Modal
        open={deleting !== null}
        title="Excluir conta"
        onClose={() => setDeleting(null)}
        footer={
          deleting === "ask" ? (
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleting(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  requestDeleteCode().then((sent) => {
                    if (sent) setDeleting("code");
                  })
                }
              >
                Enviar código
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleting(null)}>
                Cancelar
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
                Excluir tudo
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-3 p-4">
          <p className="text-xs leading-relaxed text-ink-soft">
            {character.name} - NV. {formatNumber(character.level)}. A conta e tudo o que ela guarda
            somem do servidor agora e para sempre: personagem, mochila, carteira, mesas e rastros.
            Não há como recuperar.
          </p>
          {deleting === "ask" ? (
            <p className="text-xs leading-relaxed text-ink-faint">
              Para confirmar, enviaremos um código de 4 dígitos ao e-mail da conta. Ele vale por 10
              minutos.
            </p>
          ) : (
            <Field
              compact
              numeric
              label="Código de 4 dígitos"
              hint="Chegou no e-mail da conta e vale por 10 minutos."
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
