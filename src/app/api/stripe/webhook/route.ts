import { NextResponse } from "next/server";
import { withTransaction } from "@/models/repositories/server/database";
import { fulfillSession } from "../../_lib/fulfill";
import { verifyStripeSignature, type StripeSession } from "../../_lib/stripe";

export async function POST(request: Request) {
  const payload = await request.text();
  if (payload.length > 65536) {
    return NextResponse.json({ received: false }, { status: 413 });
  }
  if (!verifyStripeSignature(payload, request.headers.get("stripe-signature"))) {
    return NextResponse.json({ received: false }, { status: 400 });
  }
  let event: { type?: string; data?: { object?: unknown } } = {};
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }
  if (event.type !== "checkout.session.completed" || !event.data?.object) {
    return NextResponse.json({ received: true });
  }
  const raw = event.data.object as Record<string, unknown>;
  const session: StripeSession = {
    id: String(raw.id ?? ""),
    url: null,
    payment_status: String(raw.payment_status ?? ""),
    payment_intent: typeof raw.payment_intent === "string" ? raw.payment_intent : null,
    amount_total: typeof raw.amount_total === "number" ? raw.amount_total : null,
    metadata: (raw.metadata ?? {}) as Record<string, string>,
  };
  try {
    const outcome = await withTransaction((client) => fulfillSession(client, session));
    return NextResponse.json({ received: true, ok: outcome.ok });
  } catch (error) {
    console.error("[api] POST /api/stripe/webhook", error);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
