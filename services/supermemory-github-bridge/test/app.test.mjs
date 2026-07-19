import assert from "node:assert/strict";
import test from "node:test";
import { createApplication } from "../src/bridge-runtime.mjs";
import { hmac, signingInput } from "../src/auth.mjs";
import { AGENT_SECRET, FakeGithub, FakeLedger, FakeMemory, config, verifyAction } from "./helpers.mjs";

function signedHeaders(rawBody, nonce = "0123456789abcdef") {
  const timestamp = "2026-07-19T12:00:00.000Z";
  const input = signingInput({ timestamp, nonce, method: "POST", pathname: "/v1/bridge", body: rawBody });
  return {
    "content-type": "application/json",
    "x-bridge-role": "agent",
    "x-bridge-timestamp": timestamp,
    "x-bridge-nonce": nonce,
    authorization: `Bridge-HMAC remote-agent:${hmac(AGENT_SECRET, input)}`
  };
}

test("application accepts a valid signed call and rejects nonce replay", async () => {
  const now = () => new Date("2026-07-19T12:00:00.000Z");
  const settings = config();
  const ledger = new FakeLedger();
  const app = await createApplication({ config: settings, ledger, github: new FakeGithub(), memory: new FakeMemory(), now });
  const rawBody = JSON.stringify({ op: "verify", action: verifyAction() });
  const headers = signedHeaders(rawBody);
  const first = await app.handle({ method: "POST", pathname: "/v1/bridge", headers, rawBody });
  assert.equal(first.status, 200);
  const second = await app.handle({ method: "POST", pathname: "/v1/bridge", headers, rawBody });
  assert.equal(second.status, 409);
  assert.equal(JSON.parse(second.body).error.code, "replayed_request");
});

test("unconfigured application is locked and does not disclose missing secret names", async () => {
  const app = await createApplication({ env: { NODE_ENV: "production" } });
  const result = await app.handle({ method: "POST", pathname: "/v1/bridge", headers: {}, rawBody: "{}" });
  assert.equal(result.status, 503);
  assert.equal(JSON.parse(result.body).error.code, "bridge_not_configured");
  assert.equal(result.body.includes("BRIDGE_SIGNING_SECRET"), false);
});
