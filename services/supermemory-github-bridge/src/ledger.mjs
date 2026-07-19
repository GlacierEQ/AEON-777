import { createHmac } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { canonicalize, redact, sha256 } from "./canonical.mjs";
import { fail } from "./errors.mjs";

function auditSignature(secret, hash) {
  return createHmac("sha256", secret).update(hash).digest("hex");
}

export class SqliteLedger {
  constructor({ path, auditSigningSecret }) {
    this.path = path;
    this.auditSigningSecret = auditSigningSecret;
  }

  async init() {
    await mkdir(dirname(this.path), { recursive: true });
    const { DatabaseSync } = await import("node:sqlite");
    this.db = new DatabaseSync(this.path);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS bridge_audit_event (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL UNIQUE,
        trace_id TEXT NOT NULL,
        phase TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        event_json TEXT NOT NULL,
        previous_event_sha256 TEXT,
        event_sha256 TEXT NOT NULL UNIQUE,
        signature TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS bridge_nonce (
        subject TEXT NOT NULL,
        nonce TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        PRIMARY KEY (subject, nonce)
      );
      CREATE TABLE IF NOT EXISTS bridge_confirmation_use (
        confirmation_id TEXT PRIMARY KEY,
        expires_at TEXT NOT NULL,
        used_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS bridge_idempotency (
        actor TEXT NOT NULL,
        idempotency_key TEXT NOT NULL,
        request_sha256 TEXT NOT NULL,
        status TEXT NOT NULL,
        response_json TEXT,
        created_at TEXT NOT NULL,
        PRIMARY KEY (actor, idempotency_key)
      );
    `);
    return this;
  }

  async append(event) {
    const safeEvent = redact(event);
    const now = new Date().toISOString();
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const previous = this.db.prepare("SELECT event_sha256 FROM bridge_audit_event ORDER BY sequence DESC LIMIT 1").get();
      const previousHash = previous?.event_sha256 || null;
      const payload = { ...safeEvent, previous_event_sha256: previousHash };
      const eventHash = sha256(payload);
      this.db.prepare(`INSERT INTO bridge_audit_event
        (event_id, trace_id, phase, status, created_at, event_json, previous_event_sha256, event_sha256, signature)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(
          event.event_id,
          event.trace_id,
          event.phase,
          event.status,
          now,
          canonicalize(payload),
          previousHash,
          eventHash,
          auditSignature(this.auditSigningSecret, eventHash)
        );
      this.db.exec("COMMIT");
      return { eventSha256: eventHash, previousEventSha256: previousHash, capturedAt: now };
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  async claimNonce({ subject, nonce, expiresAt }) {
    this.db.prepare("DELETE FROM bridge_nonce WHERE expires_at < ?").run(new Date().toISOString());
    const result = this.db.prepare("INSERT INTO bridge_nonce (subject, nonce, expires_at) VALUES (?, ?, ?) ON CONFLICT(subject, nonce) DO NOTHING").run(subject, nonce, expiresAt);
    return result.changes === 1;
  }

  async consumeConfirmation({ id, expiresAt }) {
    if (Date.parse(expiresAt) <= Date.now()) return false;
    this.db.prepare("DELETE FROM bridge_confirmation_use WHERE expires_at < ?").run(new Date().toISOString());
    const result = this.db.prepare("INSERT INTO bridge_confirmation_use (confirmation_id, expires_at, used_at) VALUES (?, ?, ?) ON CONFLICT(confirmation_id) DO NOTHING").run(id, expiresAt, new Date().toISOString());
    return result.changes === 1;
  }

  async getIdempotency({ actor, key }) {
    const record = this.db.prepare("SELECT request_sha256, status, response_json FROM bridge_idempotency WHERE actor = ? AND idempotency_key = ?").get(actor, key);
    if (!record) return null;
    return { requestSha256: record.request_sha256, status: record.status, response: record.response_json ? JSON.parse(record.response_json) : null };
  }

  async reserveIdempotency({ actor, key, requestSha256 }) {
    const result = this.db.prepare(`INSERT INTO bridge_idempotency (actor, idempotency_key, request_sha256, status, response_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(actor, idempotency_key) DO NOTHING`);
    const inserted = result.run(actor, key, requestSha256, "in_progress", null, new Date().toISOString());
    if (inserted.changes === 1) return { reserved: true, record: null };
    return { reserved: false, record: await this.getIdempotency({ actor, key }) };
  }

  async completeIdempotency({ actor, key, requestSha256, status, response }) {
    const result = this.db.prepare(`UPDATE bridge_idempotency SET status = ?, response_json = ?
      WHERE actor = ? AND idempotency_key = ? AND request_sha256 = ?`).run(status, canonicalize(redact(response)), actor, key, requestSha256);
    return result.changes === 1;
  }
}

export class HttpLedger {
  constructor({ url, auditSigningSecret, fetchImpl = fetch }) {
    this.url = new URL(url);
    this.auditSigningSecret = auditSigningSecret;
    this.fetchImpl = fetchImpl;
  }

  async request(path, payload) {
    const serialized = canonicalize(redact(payload));
    const signature = auditSignature(this.auditSigningSecret, serialized);
    let response;
    try {
      const endpoint = new URL(this.url);
      endpoint.pathname = `${endpoint.pathname.replace(/\/$/, "")}/${path}`;
      response = await this.fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-bridge-ledger-signature": signature
        },
        body: serialized,
        redirect: "error",
        signal: AbortSignal.timeout(8_000)
      });
    } catch {
      fail(503, "audit_ledger_unavailable", "The durable audit ledger is unavailable; the bridge will not proceed.");
    }
    if (!response.ok) fail(503, "audit_ledger_rejected", "The durable audit ledger rejected the bridge event.");
    let body = {};
    try { body = await response.json(); } catch { /* 2xx without a JSON body is valid for append events. */ }
    return body;
  }

  async append(event) {
    const result = await this.request("events", event);
    return { eventSha256: result.event_sha256 || sha256(event), previousEventSha256: result.previous_event_sha256 || null, capturedAt: result.captured_at || new Date().toISOString() };
  }

  async claimNonce(value) {
    return Boolean((await this.request("nonces/claim", value)).claimed);
  }

  async consumeConfirmation(value) {
    return Boolean((await this.request("confirmations/consume", value)).consumed);
  }

  async getIdempotency(value) {
    const result = await this.request("idempotency/get", value);
    return result.record || null;
  }

  async reserveIdempotency(value) {
    return await this.request("idempotency/reserve", value);
  }

  async completeIdempotency(value) {
    return Boolean((await this.request("idempotency/complete", value)).completed);
  }
}

export async function createLedger(config, options = {}) {
  if (config.ledger.driver === "sqlite") {
    return new SqliteLedger({ path: config.ledger.path, auditSigningSecret: config.auditSigningSecret }).init();
  }
  if (config.ledger.driver === "http") return new HttpLedger({ url: config.ledger.url, auditSigningSecret: config.auditSigningSecret, fetchImpl: options.fetchImpl });
  fail(500, "invalid_ledger_driver", "The bridge ledger driver is not supported.");
}
