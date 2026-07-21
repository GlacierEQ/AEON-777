import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { consumeActorProfile } from "./actor_profile_consumer.mjs";

const read = (name) => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), "utf8"));
const envelopeSchema = read("./CONNECTOR_CANDIDATE_ENVELOPE_SCHEMA.json");
const guardSchema = read("./MEMORY_RETRIEVAL_GUARD_SCHEMA.json");
const consumerSchema = read("./ACTOR_PROFILE_CONSUMER_SCHEMA.json");
const expected = read("./ACTOR_PROFILE_LIVE_CONSUMER_RECEIPT_2026-07-20.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(envelopeSchema);
ajv.addSchema(guardSchema);
const validate = ajv.compile(consumerSchema);

const live = expected.candidate_envelopes[0];
const canonical = expected.candidate_envelopes[1];
const probe = { connector: "supermemory", status: "success", container_tag: live.container_tag, query_sha256: live.source.query_sha256, response_sha256: live.source.response_sha256, content_block_count: live.source.content_block_count };
const control = { actor_id: expected.subject.actor_id, profile_status: expected.subject.profile_status, identity_status: expected.subject.identity_status, source_locator: canonical.source.locator, source_version: canonical.source.version, provenance_ref: canonical.provenance_ref };
const actual = consumeActorProfile(probe, control, expected.generated_at);
if (!validate(actual)) throw new Error(JSON.stringify(validate.errors));
if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("actor consumer receipt is not deterministic");
if (actual.guard_receipt.promoted.length !== 1 || actual.guard_receipt.promoted[0].candidate_id !== "mrg_actor_canonical_control") throw new Error("canonical actor control was not the sole promotion");
if (!actual.guard_receipt.rejected.some((item) => item.candidate_id.startsWith("mrg_actor_live_") && item.reason === "review_state_unknown")) throw new Error("raw actor payload rejection missing");

for (const bad of [
  { probe: { ...probe, container_tag: "sm_project_default" }, control },
  { probe: { ...probe, response_sha256: "invalid" }, control },
  { probe, control: { ...control, identity_status: "verified" } },
  { probe, control: { ...control, source_version: null } }
]) {
  let rejected = false;
  try { consumeActorProfile(bad.probe, bad.control, expected.generated_at); } catch { rejected = true; }
  if (!rejected) throw new Error("actor consumer negative control unexpectedly passed");
}

const serialized = JSON.stringify(expected);
for (const pattern of [/\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\b/i, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, /\b\d{3}-\d{2}-\d{4}\b/]) {
  if (pattern.test(serialized)) throw new Error(`forbidden sensitive pattern: ${pattern}`);
}
console.log("PASS: typed envelopes validated; raw actor recall rejected; conflicted actor control projected pointer-only");
