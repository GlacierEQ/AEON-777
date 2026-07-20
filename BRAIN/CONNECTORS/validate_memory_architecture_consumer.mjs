import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { consumeMemoryArchitectureStatus } from "./memory_architecture_status_consumer.mjs";

const schema = JSON.parse(fs.readFileSync(new URL("./MEMORY_ARCHITECTURE_CONSUMER_SCHEMA.json", import.meta.url), "utf8"));
const guardSchema = JSON.parse(fs.readFileSync(new URL("./MEMORY_RETRIEVAL_GUARD_SCHEMA.json", import.meta.url), "utf8"));
const expected = JSON.parse(fs.readFileSync(new URL("./MEMORY_ARCHITECTURE_LIVE_CONSUMER_RECEIPT_2026-07-19.json", import.meta.url), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(guardSchema);
const validate = ajv.compile(schema);

const probe = { connector: expected.connector, ...expected.live_probe };
const actual = consumeMemoryArchitectureStatus(probe, expected.generated_at);
if (!validate(actual)) throw new Error(JSON.stringify(validate.errors));
if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("live consumer receipt is not deterministic");
if (actual.guard_receipt.promoted.length !== 1 || actual.normalization.raw_payload_promoted !== 0) {
  throw new Error("live connector payload escaped the fail-closed boundary");
}
if (!actual.guard_receipt.rejected.some((item) => item.reason === "review_state_unknown")) {
  throw new Error("unstructured live payload rejection was not preserved");
}

for (const bad of [
  { ...probe, query_sha256: "invalid" },
  { ...probe, content_block_count: 0 },
  { ...probe, container_tag: "sm_project_default" },
  { ...probe, status: "error" }
]) {
  let rejected = false;
  try { consumeMemoryArchitectureStatus(bad, expected.generated_at); } catch { rejected = true; }
  if (!rejected) throw new Error("consumer negative control unexpectedly passed");
}

const serialized = JSON.stringify(expected);
for (const pattern of [/\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\b/i, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, /\b\d{3}-\d{2}-\d{4}\b/]) {
  if (pattern.test(serialized)) throw new Error(`forbidden sensitive pattern: ${pattern}`);
}
console.log("PASS: live Supermemory probe normalized; raw payload rejected; canonical status pointer promoted with deterministic receipt");
