import { NextResponse } from "next/server";
import { withTransaction } from "@/models/repositories/server/database";
import { fulfillInvoice, fulfillSession, fulfillSubscriptionEnded } from "../../_lib/fulfill";
import { sessionFromRaw, subscriptionFromRaw, verifyStripeSignature } from "../../_lib/stripe";

function invoiceSubscriptionId(raw: Record<string, unknown>): string {
  if (typeof raw.subscription === "string") return raw.subscription;
  const parent = raw.parent as Record<string, unknown> | undefined;
  const details = parent?.subscription_details as Record<string, unknown> | undefined;
  if (typeof details?.subscription === "string") return details.subscription;
  return "";
}

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
  const object = event.data?.object;
  if (!object || typeof object !== "object") {
    return NextResponse.json({ received: true });
  }
  const raw = object as Record<string, unknown>;
  try {
    if (event.type === "checkout.session.completed") {
      const outcome = await withTransaction((client) =>
        fulfillSession(client, sessionFromRaw(raw)),
      );
      return NextResponse.json({ received: true, ok: outcome.ok });
    }
    if (event.type === "invoice.paid") {
      const subscriptionId = invoiceSubscriptionId(raw);
      if (!subscriptionId) return NextResponse.json({ received: true });
      const outcome = await withTransaction((client) => fulfillInvoice(client, subscriptionId));
      return NextResponse.json({ received: true, ok: outcome.ok });
    }
    if (event.type === "customer.subscription.deleted") {
      const outcome = await withTransaction((client) =>
        fulfillSubscriptionEnded(client, subscriptionFromRaw(raw)),
      );
      return NextResponse.json({ received: true, ok: outcome.ok });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[api] POST /api/stripe/webhook", error);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
