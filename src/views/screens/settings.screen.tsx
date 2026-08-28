"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { renameCost, renameDaysLeft } from "@/controllers/character.controller";
import { AUTOMATIONS } from "@/models/entities/automation";
import { useGame } from "@/controllers/game.context";
import { playSound } from "@/controllers/sound";
import { soundRepository } from "@/models/repositories/sound.repository";
import { NAME_MAX_LENGTH, RENAME_COOLDOWN_DAYS } from "@/shared/constants/game";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { sanitizeName } from "@/shared/utils/text";
import { Button } from "../components/button";
import { Chip } from "../components/chip";
import { ConfirmDialog } from "../components/confirm-dialog";
import { Field } from "../components/field";
import { IconFrame } from "../components/icon-frame";
import { List, ListRow, RowText } from "../components/list";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
import { PageHeader } from "../layout/page-header";
import { googleEmailOf } from "../presenters/account.presenter";

export function SettingsScreen() {
  const { state, character, renameCharacter, deleteRun, notify, setAutomation } = useGame();
  const router = useRouter();

  const [newName, setNewName] = useState("");
  const [confirmingRename, setConfirmingRename] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const sound = useSyncExternalStore(
    soundRepository.subscribe,
    soundRepository.enabled,
    soundRepository.serverSnapshot,
  );

  function chooseSound(on: boolean) {
    soundRepository.setEnabled(on);
    if (on) playSound("ui");
  }

  if (!character) return null;

  const active = AUTOMATIONS.filter((entry) => state.automation[entry.key]).length;

  const daysLeft = renameDaysLeft(character);
  const canRename = daysLeft === 0;
  const cost = renameCost(character);
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
            <IconFrame tone="strong">G</IconFrame>
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">Conectado com Google</p>
              <p className="truncate font-mono text-[11px] text-ink-faint">
                {googleEmailOf(character.name)}
              </p>
            </div>
          </div>
          <div className="space-y-3 p-4">
            <p className="text-xs leading-relaxed text-ink-faint">
              O login por e-mail é a demonstração do botão do Google, e a partida já vive no servidor.
              Quando o jogo ganhar servidor, a conta real entra aqui.
            </p>
            <Button
              variant="outline"
              onClick={() =>
                notify(
                  "Login de demonstração: não há sessão no servidor para encerrar.",
                  false,
                  "Sistema",
                )
              }
            >
              Sair da conta
            </Button>
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
            {formatNumber(active)} de {AUTOMATIONS.length} ligadas
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
                  Ligada
                </Chip>
                <Chip
                  active={!state.automation[entry.key]}
                  onClick={() => setAutomation(entry.key, false)}
                >
                  Desligada
                </Chip>
              </div>
            </ListRow>
          ))}
        </List>
      </Panel>

      <div className="grid items-start gap-6 lg:grid-cols-2">
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
          title="Excluir conta"
          description="Apaga a partida inteira do servidor. Não tem volta."
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-ink-faint">
                {character.name} · NV. {formatNumber(character.level)}
              </span>
              <Button variant="outline" onClick={() => setConfirmingDelete(true)}>
                Excluir conta
              </Button>
            </div>
          }
        >
          <p className="text-xs leading-relaxed text-ink-faint">
            Personagem, inventário, forja, lobo, carteira e anúncios: tudo some de uma vez, e o
            conta volta para a criação de personagem.
          </p>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirmingRename}
        title="Alterar nome"
        description={
          "O bronze sai na hora e o novo nome fica travado por " +
          RENAME_COOLDOWN_DAYS +
          " dias, no ranking, na taverna e no bazar."
        }
        detail={character.name + " → " + newName.trim() + " · " + formatBronze(cost)}
        confirmLabel="Alterar"
        onCancel={() => setConfirmingRename(false)}
        onConfirm={() =>
          renameCharacter(newName).then((ok) => {
            if (ok) setNewName("");
            setConfirmingRename(false);
          })
        }
      />

      <ConfirmDialog
        open={confirmingDelete}
        title="Excluir conta"
        description="A partida inteira some do servidor agora e para sempre. Não há como recuperar."
        detail={character.name + " · NV. " + formatNumber(character.level)}
        confirmLabel="Excluir tudo"
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false);
          deleteRun();
          router.push("/");
        }}
      />
    </>
  );
}
