import { createHmac, randomUUID } from "node:crypto";
import { safeEqual, sha256 } from "./canonical.mjs";
import { fail } from "./errors.mjs";

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1_000;

function header(headers, name) {
  if (typeof headers?.get === "function") return headers.get(name);
  return headers?.[name] ?? headers?.[name.toLowerCase()] ?? headers?.[name.toUpperCase()];
}

export function signingInput({ timestamp, nonce, method, pathname, body }) {
  return `${timestamp}\n${nonce}\n${String(method).toUpperCase()}\n${pathname}\n${sha256(body)}`;
}

export function hmac(secret, input) {
  return createHmac("sha256", secret).update(input).digest("hex");
}

export async function authenticateRequest({ headers, method, pathname, rawBody, config, ledger, now = new Date() }) {
  const authorization = header(headers, "authorization") || "";
  const role = header(headers, "x-bridge-role") || "";
  const timestamp = header(headers, "x-bridge-timestamp") || "";
  const nonce = header(headers, "x-bridge-nonce") || "";
  const match = /^Bridge-HMAC\s+([A-Za-z0-9._:@-]{1,128}):([a-f0-9]{64})$/.exec(authorization);
  if (!match || !new Set(["agent", "approver"]).has(role)) fail(401, "authentication_required", "A valid signed bridge identity is required.");
  if (!/^[A-Za-z0-9._:-]{16,256}$/.test(nonce)) fail(400, "invalid_nonce", "The request nonce is malformed.");
  const instant = Date.parse(timestamp);
  if (!Number.isFinite(instant) || Math.abs(now.getTime() - instant) > MAX_CLOCK_SKEW_MS) fail(401, "stale_request", "The signed request timestamp is outside the allowed clock skew.");
  const [actor, suppliedSignature] = match.slice(1);
  const secret = (role === "agent" ? config.agentSecrets : config.approverSecrets)[actor];
  if (!secret) fail(403, "actor_not_authorized", "This actor is not authorized for the requested bridge role.");
  const expectedSignature = hmac(secret, signingInput({ timestamp, nonce, method, pathname, body: rawBody }));
  if (!safeEqual(suppliedSignature, expectedSignature)) fail(401, "invalid_signature", "The bridge request signature is invalid.");
  const claimed = await ledger.claimNonce({ subject: `${role}:${actor}`, nonce, expiresAt: new Date(instant + MAX_CLOCK_SKEW_MS).toISOString() });
  if (!claimed) fail(409, "replayed_request", "This signed request nonce has already been used.");
  return { actor, role, requestId: header(headers, "x-request-id") || randomUUID(), authenticatedAt: now.toISOString() };
}

export function isSecureRequest({ headers, encrypted = false, config }) {
  if (encrypted) return true;
  if (!config.production) return true;
  if (!config.trustedProxy) return false;
  return String(header(headers, "x-forwarded-proto") || "").split(",")[0].trim().toLowerCase() === "https";
}
