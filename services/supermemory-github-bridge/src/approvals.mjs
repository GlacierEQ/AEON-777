import { createHmac, randomUUID } from "node:crypto";
import { safeEqual, sha256 } from "./canonical.mjs";
import { fail } from "./errors.mjs";

const TOKEN_TTL_MS = 10 * 60 * 1_000;

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decode(value) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    fail(400, "invalid_receipt", "The bridge receipt is malformed.");
  }
}

function signature(secret, payload) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function signReceipt(secret, body) {
  const payload = encode(body);
  return `${payload}.${signature(secret, payload)}`;
}

export function verifyReceipt(secret, receipt, expectedKind, now = new Date()) {
  if (typeof receipt !== "string") fail(400, "receipt_required", "A signed bridge receipt is required.");
  const [payload, suppliedSignature, ...rest] = receipt.split(".");
  if (!payload || !suppliedSignature || rest.length !== 0 || !safeEqual(suppliedSignature, signature(secret, payload))) {
    fail(400, "invalid_receipt", "The bridge receipt signature is invalid.");
  }
  const body = decode(payload);
  if (body.kind !== expectedKind || !body.expires_at || Date.parse(body.expires_at) < now.getTime()) fail(410, "expired_receipt", "The bridge receipt has expired or is not valid for this operation.");
  return body;
}

export function createPlanReceipt({ config, actor, actionHash, memoryReceiptHash, action, now = new Date() }) {
  const body = {
    kind: "plan",
    id: randomUUID(),
    actor,
    action_sha256: actionHash,
    action: {
      type: action.type,
      repository: action.repository,
      repository_id: action.repositoryId,
      branch: action.branch,
      ...(action.expectedHeadSha ? { expected_head_sha: action.expectedHeadSha } : {})
    },
    memory_receipt_sha256: memoryReceiptHash,
    policy_sha256: config.policyHash,
    issued_at: now.toISOString(),
    expires_at: new Date(now.getTime() + TOKEN_TTL_MS).toISOString()
  };
  return { body, token: signReceipt(config.signingSecret, body) };
}

export function createConfirmation({ config, plan, approver, now = new Date() }) {
  const body = {
    kind: "confirmation",
    id: randomUUID(),
    plan_id: plan.id,
    actor: plan.actor,
    approver,
    action_sha256: plan.action_sha256,
    policy_sha256: plan.policy_sha256,
    issued_at: now.toISOString(),
    expires_at: new Date(now.getTime() + TOKEN_TTL_MS).toISOString()
  };
  return { body, token: signReceipt(config.signingSecret, body) };
}

export async function consumeConfirmation({ config, ledger, confirmationToken, actor, actionHash, now = new Date() }) {
  const confirmation = verifyReceipt(config.signingSecret, confirmationToken, "confirmation", now);
  if (confirmation.actor !== actor || confirmation.action_sha256 !== actionHash || confirmation.policy_sha256 !== config.policyHash) {
    fail(403, "confirmation_mismatch", "The confirmation does not bind to this exact actor, action, and policy.");
  }
  const consumed = await ledger.consumeConfirmation({ id: confirmation.id, expiresAt: confirmation.expires_at });
  if (!consumed) fail(409, "confirmation_already_used", "The confirmation was already used or is no longer available.");
  return confirmation;
}

export function actionHash(action) {
  return sha256(action);
}
