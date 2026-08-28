import { generateId } from "@/shared/utils/id";
import { isFullName, isValidCpf } from "@/shared/utils/document";
import * as bazaarController from "@/controllers/bazaar.controller";
import { failure } from "@/models/entities/result";
import { recordWalletMovement } from "@/models/repositories/server/game.store";
import { asText, withGame } from "../../_lib/api";

// The payout half of the real-money loop: CPF and full name are validated
// here too, the wallet zeroes atomically, and the withdrawal row plus the
// negative movement are the audit trail the payment API will settle.
export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const pixKey = asText(body.pixKey, 120).trim();
    const fullName = asText(body.fullName, 120).trim();
    const cpf = asText(body.cpf, 20).trim();

    if (!isFullName(fullName)) return failure(state, "Escreva o nome completo do titular.");
    if (!isValidCpf(cpf)) return failure(state, "CPF inválido.");

    const amount = state.wallet.cents;
    const result = bazaarController.requestWithdraw(state, pixKey);
    if (!result.ok) return result;

    const withdrawalId = generateId("wd");
    await context.client.query(
      `insert into withdrawals (id, character_id, amount_cents, pix_key, full_name, cpf)
       values ($1, $2, $3, $4, $5, $6)`,
      [withdrawalId, context.characterId, amount, pixKey, fullName, cpf],
    );
    await recordWalletMovement(context.client, context.characterId, -amount, "withdrawal", withdrawalId);

    return result;
  });
}
