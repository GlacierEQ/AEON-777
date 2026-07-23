import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { consumeTimelineEvent } from "./timeline_event_consumer.mjs";

const read = (name) => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), "utf8"));
const envelopeSchema = read("./CONNECTOR_CANDIDATE_ENVELOPE_SCHEMA.json");
const guardSchema = read("./MEMORY_RETRIEVAL_GUARD_SCHEMA.json");
const consumerSchema = read("./TIMELINE_EVENT_CONSUMER_SCHEMA.json");
const expected = read("./TIMELINE_EVENT_LIVE_CONSUMER_RECEIPT_2026-07-21.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(envelopeSchema);
ajv.addSchema(guardSchema);
const validate = ajv.compile(consumerSchema);

const live = expected.candidate_envelopes[0];
const canonical = expected.candidate_envelopes[1];
const probe = { connector: "supermemory", status: "success", container_tag: live.container_tag, query_sha256: live.source.query_sha256, response_sha256: live.source.response_sha256, content_block_count: live.source.content_block_count };
const control = { ...expected.event, source_locator: canonical.source.locator, source_version: canonical.source.version, provenance_ref: canonical.provenance_ref };
const actual = consumeTimelineEvent(probe, control, expected.generated_at);

if (!validate(actual)) throw new Error(JSON.stringify(validate.errors));
if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("timeline consumer receipt is not deterministic");
if (actual.guard_receipt.promoted.length !== 1 || actual.guard_receipt.promoted[0].candidate_id !== "mrg_timeline_canonical_control") throw new Error("canonical timeline control was not the sole promotion");
if (!actual.guard_receipt.rejected.some((item) => item.candidate_id.startsWith("mrg_timeline_live_") && item.reason === "review_state_unknown")) throw new Error("raw timeline payload rejection missing");
if (actual.event.evidentiary_status !== "non_evidentiary" || actual.event.timeline_status !== "pointer_only") throw new Error("unsafe timeline projection");

for (const bad of [
  { probe: { ...probe, container_tag: "sm_project_default" }, control },
  { probe: { ...probe, response_sha256: "invalid" }, control },
  { probe, control: { ...control, event_class: "evidentiary_event" } },
  { probe, control: { ...control, deadline_authorized: true } },
  { probe, control: { ...control, source_version: null } }
]) {
  let rejected = false;
  try { consumeTimelineEvent(bad.probe, bad.control, expected.generated_at); } catch { rejected = true; }
  if (!rejected) throw new Error("timeline consumer negative control unexpectedly passed");
}

const serialized = JSON.stringify(expected);
for (const pattern of [/\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\b/i, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, /\b\d{3}-\d{2}-\d{4}\b/]) {
  if (pattern.test(serialized)) throw new Error(`forbidden sensitive pattern: ${pattern}`);
}
console.log("PASS: typed timeline envelope validated; raw recall rejected; non-evidentiary control projected pointer-only");
