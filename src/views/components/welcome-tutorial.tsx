"use client";

import { useEffect } from "react";
import { useGame } from "@/controllers/game.context";
import { useLocale } from "@/controllers/use-locale";
import { useNarration } from "@/controllers/use-narration";
import { welcomePack } from "@/models/data/lore.i18n";
import { Button } from "./button";
import { Modal } from "./modal";
import { NarrationButton } from "./narration-button";

export function WelcomeTutorial({
  open,
  persist,
  onFinished,
}: {
  open: boolean;
  persist: boolean;
  onFinished: () => void;
}) {
  const { completeTutorial } = useGame();
  const { current, play, stop, toggle } = useNarration();
  const locale = useLocale();
  const welcome = welcomePack(locale);
  const voice = welcome.voice;

  useEffect(() => {
    if (!open) return undefined;
    play(voice);
    return () => stop();
  }, [open, play, stop, voice]);

  async function start() {
    if (persist) {
      const ok = await completeTutorial();
      if (!ok) return;
    }
    stop();
    onFinished();
  }

  return (
    <Modal
      open={open}
      title={welcome.title}
      onClose={onFinished}
      dismissible={false}
      className="max-w-lg"
      footer={
        <Button variant="primary" size="medium" fullWidth onClick={start}>
          Começar jogo
        </Button>
      }
    >
      <div className="space-y-3 p-4">
        {welcome.paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-xs leading-relaxed text-ink-soft">
            {paragraph}
          </p>
        ))}
        <NarrationButton
          playing={current === voice}
          onClick={() => toggle(voice)}
          label="Ouvir a apresentação"
        />
      </div>
    </Modal>
  );
}
