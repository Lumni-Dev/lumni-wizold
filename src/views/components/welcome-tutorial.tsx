"use client";

import { useEffect } from "react";
import { useGame } from "@/controllers/game.context";
import { useNarration } from "@/controllers/use-narration";
import { WELCOME_CHAPTER, WELCOME_PARAGRAPHS } from "@/models/data/lore";
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

  useEffect(() => {
    if (!open) return undefined;
    play(WELCOME_CHAPTER.voice);
    return () => stop();
  }, [open, play, stop]);

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
      title={WELCOME_CHAPTER.title}
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
        {WELCOME_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph} className="text-xs leading-relaxed text-ink-soft">
            {paragraph}
          </p>
        ))}
        <NarrationButton
          playing={current === WELCOME_CHAPTER.voice}
          onClick={() => toggle(WELCOME_CHAPTER.voice)}
          label="Ouvir a apresentação"
        />
      </div>
    </Modal>
  );
}
