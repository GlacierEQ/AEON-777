import crypto from "node:crypto";
import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const read = (name) => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), "utf8"));
const controlSchema = read("./MEMORY_NAMESPACE_CONTROL_SCHEMA.json");
const replaySchema = read("./MEMORY_REPLAY_RECEIPT_SCHEMA.json");
const control = read("./MEMORY_NAMESPACE_CONTROL.json");
const receipt = read("./MEMORY_REPLAY_RECEIPT_2026-07-22.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validateControl = ajv.compile(controlSchema);
const validateReceipt = ajv.compile(replaySchema);
if (!validateControl(control)) throw new Error(JSON.stringify(validateControl.errors));
if (!validateReceipt(receipt)) throw new Error(JSON.stringify(validateReceipt.errors));

const expectedKey = crypto.createHash("sha256").update([
  receipt.connector_id,
  receipt.namespace,
  receipt.fixture.record_class,
  receipt.fixture.source_version,
  receipt.fixture.payload_sha256
].join("|")).digest("hex");
if (expectedKey !== receipt.fixture.idempotency_key) throw new Error("idempotency key does not match canonical expression");
if (new Set(receipt.write_attempts.map((item) => item.memory_id)).size !== 1) throw new Error("replay produced duplicate memory IDs");
if (receipt.write_attempts.some((item) => item.namespace !== control.namespace)) throw new Error("write escaped controlled namespace");
if (control.approval_state !== "pending_human_approval" || control.owner !== "unassigned" || control.activation_allowed) throw new Error("control record overstates approval");

for (const bad of [
  { ...receipt, namespace: "sm_project_default" },
  { ...receipt, fixture: { ...receipt.fixture, idempotency_key: "0".repeat(64) } },
  { ...receipt, write_attempts: [receipt.write_attempts[0], { ...receipt.write_attempts[1], memory_id: "differentMemoryId123" }] },
  { ...receipt, boundaries: { ...receipt.boundaries, production_activation_authorized: true } }
]) {
  const schemaValid = validateReceipt(bad);
  let semanticValid = schemaValid;
  if (schemaValid) {
    const key = crypto.createHash("sha256").update([bad.connector_id, bad.namespace, bad.fixture.record_class, bad.fixture.source_version, bad.fixture.payload_sha256].join("|")).digest("hex");
    semanticValid = key === bad.fixture.idempotency_key && new Set(bad.write_attempts.map((item) => item.memory_id)).size === 1;
  }
  if (semanticValid) throw new Error("memory replay negative control unexpectedly passed");
}

const serialized = JSON.stringify({ control, receipt });
for (const pattern of [/\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\b/i, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, /\b\d{3}-\d{2}-\d{4}\b/]) {
  if (pattern.test(serialized)) throw new Error(`forbidden sensitive pattern: ${pattern}`);
}
console.log("PASS: explicit namespace replay returned one stable memory ID; approval and activation remain closed");
