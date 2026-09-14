"use client";

import { useGame } from "@/controllers/game.context";
import { useT } from "@/controllers/use-locale";
import { DEMO_LIMIT, type DemoAction } from "@/shared/constants/demo";
import { Button } from "./button";
import { DataRow } from "./data-row";
import { Modal } from "./modal";

const ACTION_LABEL: Record<DemoAction, string> = {
  forge: "Forges",
  hunt: "Hunts",
  train: "Training sessions",
  fight: "Arena fights",
};

export function DemoGate() {
  const { demoLimit, dismissDemoLimit } = useGame();
  const t = useT();
  return (
    <Modal
      open={demoLimit !== null}
      title="Project demonstration"
      onClose={dismissDemoLimit}
      footer={
        <Button variant="primary" size="medium" fullWidth onClick={dismissDemoLimit}>
          Understood
        </Button>
      }
    >
      <div className="space-y-3 p-4">
        <p className="text-xs leading-relaxed text-ink-faint">
          {t("Wizold is a portfolio project, open only as a demonstration.")}
        </p>
        <p className="text-xs leading-relaxed text-ink-faint">
          {t("Every account can try each activity a limited number of times:")}
        </p>
        <div className="divide-y divide-line rounded-md border border-line">
          {(Object.keys(ACTION_LABEL) as DemoAction[]).map((action) => (
            <DataRow
              key={action}
              label={ACTION_LABEL[action]}
              value={
                <span className={action === demoLimit ? "text-blood" : undefined}>
                  {action === demoLimit ? DEMO_LIMIT + " / " + DEMO_LIMIT : "≤ " + DEMO_LIMIT}
                </span>
              }
            />
          ))}
        </div>
        <p className="text-xs leading-relaxed text-ink-faint">
          {t("You reached the limit for this activity. Thanks for trying the game.")}
        </p>
      </div>
    </Modal>
  );
}
