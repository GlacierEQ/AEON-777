import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { SqliteLedger } from "../src/ledger.mjs";

test("SQLite ledger creates a signed hash chain and atomically consumes capabilities", async () => {
  const folder = await mkdtemp(join(tmpdir(), "bridge-ledger-"));
  try {
    const ledger = await new SqliteLedger({ path: join(folder, "ledger.sqlite"), auditSigningSecret: "audit-signing-secret-which-is-longer-than-twenty-four" }).init();
    const first = await ledger.append({ event_id: "event-one", trace_id: "trace", phase: "received", status: "accepted" });
    const second = await ledger.append({ event_id: "event-two", trace_id: "trace", phase: "completed", status: "succeeded" });
    assert.equal(second.previousEventSha256, first.eventSha256);
    assert.equal(await ledger.claimNonce({ subject: "agent:a", nonce: "n", expiresAt: "2999-01-01T00:00:00.000Z" }), true);
    assert.equal(await ledger.claimNonce({ subject: "agent:a", nonce: "n", expiresAt: "2999-01-01T00:00:00.000Z" }), false);
    assert.equal(await ledger.consumeConfirmation({ id: "confirmation", expiresAt: "2999-01-01T00:00:00.000Z" }), true);
    assert.equal(await ledger.consumeConfirmation({ id: "confirmation", expiresAt: "2999-01-01T00:00:00.000Z" }), false);
    assert.equal((await ledger.reserveIdempotency({ actor: "agent", key: "key", requestSha256: "request" })).reserved, true);
    assert.equal(await ledger.completeIdempotency({ actor: "agent", key: "key", requestSha256: "request", status: "completed", response: { ok: true } }), true);
    assert.deepEqual(await ledger.getIdempotency({ actor: "agent", key: "key" }), { requestSha256: "request", status: "completed", response: { ok: true } });
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
