import { AUTOMATIONS, type AutomationKey } from "@/models/entities/automation";
import { failure, success } from "@/models/entities/result";
import { isVip } from "@/models/rules/vip";
import { asText, withGame } from "../_lib/api";

export async function PUT(request: Request) {
  return withGame(request, (state, body) => {
    const key = asText(body.key, 20) as AutomationKey;
    if (!AUTOMATIONS.some((entry) => entry.key === key)) {
      return failure(state, "Chave de automação desconhecida.");
    }

    const on = body.on === true;
    if (on && !isVip(state.character, Date.now())) {
      return failure(state, "A automação é um recurso VIP.");
    }
    const next = { ...state, automation: { ...state.automation, [key]: on } };
    return success(next, "", { key, on });
  });
}
