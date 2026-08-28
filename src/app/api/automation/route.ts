import { AUTOMATIONS, type AutomationKey } from "@/models/entities/automation";
import { failure, success } from "@/models/entities/result";
import { asText, withGame } from "../_lib/api";

export async function PUT(request: Request) {
  return withGame(request, (state, body) => {
    const key = asText(body.key, 20) as AutomationKey;
    if (!AUTOMATIONS.some((entry) => entry.key === key)) {
      return failure(state, "Chave de automação desconhecida.");
    }

    const on = body.on === true;
    const next = { ...state, automation: { ...state.automation, [key]: on } };
    return success(next, "", { key, on });
  });
}
