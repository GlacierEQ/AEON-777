import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { applyMemoryTombstones } from "./memory_tombstone_filter.mjs";

const read = (name) => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), "utf8"));
const policy = read("./MEMORY_RETENTION_DELETION_POLICY.json");
const receipt = read("./MEMORY_DELETION_RECEIPT_2026-07-23.json");
const registry = read("./MEMORY_TOMBSTONE_REGISTRY.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const [schemaName, data] of [
  ["./MEMORY_RETENTION_DELETION_POLICY_SCHEMA.json", policy],
  ["./MEMORY_DELETION_RECEIPT_SCHEMA.json", receipt],
  ["./MEMORY_TOMBSTONE_REGISTRY_SCHEMA.json", registry]
]) {
  const validate = ajv.compile(read(schemaName));
  if (!validate(data)) throw new Error(`${schemaName}: ${JSON.stringify(validate.errors)}`);
}

const target = {
  candidate_id: "synthetic_canary",
  namespace: receipt.namespace,
  idempotency_key: receipt.target.idempotency_key
};
const control = { candidate_id: "current_control", namespace: receipt.namespace, idempotency_key: "0".repeat(64) };
const filtered = applyMemoryTombstones([target, control], registry);
if (filtered.eligible.length !== 1 || filtered.eligible[0].candidate_id !== "current_control") throw new Error("non-tombstoned control was not preserved");
if (filtered.rejected.length !== 1 || filtered.rejected[0].reason !== "logical_tombstone") throw new Error("retired canary escaped tombstone filter");
if (receipt.physical_delete_confirmed || !receipt.post_delete_recall.idempotency_key_found) throw new Error("deletion receipt overstates backend result");
if (policy.approval_state !== "pending_human_approval" || policy.owner !== "unassigned" || policy.activation_allowed) throw new Error("policy overstates approval");

const inactive = structuredClone(registry);
inactive.entries[0].logical_delete_active = false;
if (applyMemoryTombstones([target], inactive).rejected.length !== 0) throw new Error("inactive tombstone unexpectedly rejected candidate");
const wrongNamespace = { ...target, namespace: "sm_project_default" };
if (applyMemoryTombstones([wrongNamespace], registry).rejected.length !== 0) throw new Error("tombstone leaked across namespace");

const serialized = JSON.stringify({ policy, receipt, registry });
for (const pattern of [/\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\b/i, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, /\b\d{3}-\d{2}-\d{4}\b/]) {
  if (pattern.test(serialized)) throw new Error(`forbidden sensitive pattern: ${pattern}`);
}
console.log("PASS: physical deletion failure preserved; retired canary blocked by namespace-scoped logical tombstone");
