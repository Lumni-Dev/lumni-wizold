import { createHmac, timingSafeEqual } from "node:crypto";

const STRIPE_API = "https://api.stripe.com/v1";
const SIGNATURE_TOLERANCE_MS = 300000;

const live = process.env.VERCEL_ENV === "production";

function secretKey(): string {
  const value = live ? process.env.STRIPE_LIVE_SECRET_KEY : process.env.STRIPE_TEST_SECRET_KEY;
  if (!value) throw new Error("Chave secreta do Stripe ausente no ambiente.");
  return value;
}

export function webhookSecret(): string {
  const value = live
    ? process.env.STRIPE_LIVE_WEBHOOK_SECRET
    : process.env.STRIPE_TEST_WEBHOOK_SECRET;
  if (!value) throw new Error("Segredo do webhook do Stripe ausente no ambiente.");
  return value;
}

async function stripeCall(
  method: "GET" | "POST",
  path: string,
  data?: Record<string, string>,
): Promise<Record<string, unknown>> {
  const answer = await fetch(STRIPE_API + path, {
    method,
    headers: {
      authorization: "Bearer " + secretKey(),
      ...(data ? { "content-type": "application/x-www-form-urlencoded" } : {}),
    },
    body: data ? new URLSearchParams(data).toString() : undefined,
    cache: "no-store",
  });
  const body = (await answer.json()) as Record<string, unknown>;
  if (!answer.ok) {
    const error = body.error as { message?: string } | undefined;
    throw new Error(error?.message ?? "O Stripe recusou a chamada (" + answer.status + ").");
  }
  return body;
}

export interface StripeSession {
  id: string;
  url: string | null;
  mode: string;
  payment_status: string;
  payment_intent: string | null;
  subscription: string | null;
  amount_total: number | null;
  currency: string;
  metadata: Record<string, string>;
}

export function sessionFromRaw(body: Record<string, unknown>): StripeSession {
  return {
    id: String(body.id),
    url: typeof body.url === "string" ? body.url : null,
    mode: String(body.mode ?? ""),
    payment_status: String(body.payment_status ?? ""),
    payment_intent: typeof body.payment_intent === "string" ? body.payment_intent : null,
    subscription: typeof body.subscription === "string" ? body.subscription : null,
    amount_total: typeof body.amount_total === "number" ? body.amount_total : null,
    currency: String(body.currency ?? ""),
    metadata: (body.metadata ?? {}) as Record<string, string>,
  };
}

export interface StripeSubscription {
  id: string;
  status: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  metadata: Record<string, string>;
}

export function subscriptionFromRaw(body: Record<string, unknown>): StripeSubscription {
  const topPeriodEnd = typeof body.current_period_end === "number" ? body.current_period_end : 0;
  const items = (body.items as { data?: Array<Record<string, unknown>> } | undefined)?.data;
  const itemPeriodEnd =
    items && items[0] && typeof items[0].current_period_end === "number"
      ? (items[0].current_period_end as number)
      : 0;
  return {
    id: String(body.id),
    status: String(body.status ?? ""),
    currentPeriodEnd: topPeriodEnd > 0 ? topPeriodEnd : itemPeriodEnd,
    cancelAtPeriodEnd: body.cancel_at_period_end === true,
    metadata: (body.metadata ?? {}) as Record<string, string>,
  };
}

export async function createCheckoutSession(input: {
  name: string;
  amountCents: number;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  paymentMethods?: readonly string[];
}): Promise<StripeSession> {
  const data: Record<string, string> = {
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "brl",
    "line_items[0][price_data][unit_amount]": String(input.amountCents),
    "line_items[0][price_data][product_data][name]": input.name,
  };
  for (const [index, method] of (input.paymentMethods ?? []).entries()) {
    data["payment_method_types[" + index + "]"] = method;
  }
  for (const [key, value] of Object.entries(input.metadata)) {
    data["metadata[" + key + "]"] = value;
  }
  return sessionFromRaw(await stripeCall("POST", "/checkout/sessions", data));
}

export async function createSubscriptionSession(input: {
  name: string;
  amountCents: number;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}): Promise<StripeSession> {
  const data: Record<string, string> = {
    mode: "subscription",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "brl",
    "line_items[0][price_data][unit_amount]": String(input.amountCents),
    "line_items[0][price_data][recurring][interval]": "month",
    "line_items[0][price_data][product_data][name]": input.name,
  };
  for (const [key, value] of Object.entries(input.metadata)) {
    data["metadata[" + key + "]"] = value;
    data["subscription_data[metadata][" + key + "]"] = value;
  }
  return sessionFromRaw(await stripeCall("POST", "/checkout/sessions", data));
}

export async function retrieveSession(sessionId: string): Promise<StripeSession | null> {
  try {
    return sessionFromRaw(
      await stripeCall("GET", "/checkout/sessions/" + encodeURIComponent(sessionId)),
    );
  } catch {
    return null;
  }
}

export async function retrieveSubscription(
  subscriptionId: string,
): Promise<StripeSubscription | null> {
  try {
    return subscriptionFromRaw(
      await stripeCall("GET", "/subscriptions/" + encodeURIComponent(subscriptionId)),
    );
  } catch {
    return null;
  }
}

export async function setSubscriptionCancel(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean,
): Promise<StripeSubscription | null> {
  try {
    return subscriptionFromRaw(
      await stripeCall("POST", "/subscriptions/" + encodeURIComponent(subscriptionId), {
        cancel_at_period_end: cancelAtPeriodEnd ? "true" : "false",
      }),
    );
  } catch {
    return null;
  }
}

export async function refundPayment(paymentIntent: string): Promise<boolean> {
  try {
    await stripeCall("POST", "/refunds", { payment_intent: paymentIntent });
    return true;
  } catch {
    return false;
  }
}

export function verifyStripeSignature(payload: string, header: string | null): boolean {
  if (!header) return false;
  let timestamp = "";
  const given: string[] = [];
  for (const part of header.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key === "t") timestamp = value ?? "";
    if (key === "v1" && value) given.push(value);
  }
  const at = Number(timestamp) * 1000;
  if (!Number.isFinite(at) || Math.abs(Date.now() - at) > SIGNATURE_TOLERANCE_MS) return false;
  const wanted = createHmac("sha256", webhookSecret())
    .update(timestamp + "." + payload)
    .digest("hex");
  const expected = Buffer.from(wanted);
  return given.some((candidate) => {
    const bytes = Buffer.from(candidate);
    return bytes.length === expected.length && timingSafeEqual(bytes, expected);
  });
}
