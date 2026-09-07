"use client";

import { useGame } from "@/controllers/game.context";
import { useT } from "@/controllers/use-locale";
import { GAME_VERSION } from "@/shared/constants/version";
import { Button } from "./button";
import { DataRow } from "./data-row";
import { Modal } from "./modal";

export function UpdateGate() {
  const { updateAvailable, updateVersion, applyUpdate } = useGame();
  const t = useT();
  return (
    <Modal
      open={updateAvailable}
      title="Update available"
      onClose={applyUpdate}
      dismissible={false}
      footer={
        <Button variant="primary" size="medium" fullWidth onClick={applyUpdate}>
          Update now
        </Button>
      }
    >
      <div className="space-y-3 p-4">
        <p className="text-xs leading-relaxed text-ink-faint">
          {t("A new version of the game is available.")}
        </p>
        <div className="divide-y divide-line rounded-md border border-line">
          <DataRow label="Current version" value={"v" + GAME_VERSION} />
          {updateVersion ? <DataRow label="New version" value={"v" + updateVersion} /> : null}
        </div>
        <p className="text-xs leading-relaxed text-ink-faint">
          {t(
            "Updating reloads the page and clears the cache. If you are hunting, training, mining or forging, the work resumes where it stopped.",
          )}
        </p>
      </div>
    </Modal>
  );
}
