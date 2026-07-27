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
if (receipt.physical_delete_confirmed !== false || receipt.post_delete_recall.idempotency_key_found !== true) throw new Error("deletion receipt overstates backend result");
if (policy.approval_state !== "pending_human_approval" || policy.owner !== "unassigned" || policy.activation_allowed) throw new Error("policy overstates approval");

const inactive = structuredClone(registry);
inactive.entries[0].logical_delete_active = false;
inactive.entries[0].physical_delete_confirmed = true;
inactive.entries[0].retrieval_action = "none";
if (applyMemoryTombstones([target], inactive).rejected.length !== 0) throw new Error("inactive tombstone unexpectedly rejected candidate");
const wrongNamespace = { ...target, namespace: "sm_project_default" };
if (applyMemoryTombstones([wrongNamespace], registry).rejected.length !== 0) throw new Error("tombstone leaked across namespace");
const currentConsumerShape = {
  candidate_id: "current_consumer_canary",
  container_tag: receipt.namespace,
  idempotency_key: receipt.target.idempotency_key
};
if (applyMemoryTombstones([currentConsumerShape], registry).rejected.length !== 1) throw new Error("container_tag recall candidate escaped tombstone filter");
const conflictingTombstoneRoute = { ...target, namespace: "sm_project_default", container_tag: receipt.namespace };
const conflictResult = applyMemoryTombstones([conflictingTombstoneRoute], registry);
if (conflictResult.rejected[0]?.reason !== "logical_tombstone" || !conflictResult.rejected[0]?.tombstone_id) throw new Error("conflicting namespace bypassed live tombstone");
const conflictingCleanRoute = { ...control, container_tag: "sm_project_default" };
if (applyMemoryTombstones([conflictingCleanRoute], registry).rejected[0]?.reason !== "cross_container_leakage") throw new Error("conflicting clean routing fields did not fail closed");
const missingRoute = { candidate_id: "missing_route", idempotency_key: "0".repeat(64) };
if (applyMemoryTombstones([missingRoute], registry).rejected[0]?.reason !== "missing_required_status_or_routing_field") throw new Error("missing route did not fail closed");

const completed = structuredClone(registry);
completed.entries[0].logical_delete_active = false;
completed.entries[0].physical_delete_confirmed = true;
completed.entries[0].retrieval_action = "none";
const lifecycleAjv = new Ajv2020({ allErrors: true, strict: true });
addFormats(lifecycleAjv);
const validateLifecycle = lifecycleAjv.compile(read("./MEMORY_TOMBSTONE_REGISTRY_SCHEMA.json"));
if (!validateLifecycle(completed)) throw new Error(`completed cleanup cannot be represented: ${JSON.stringify(validateLifecycle.errors)}`);
for (const invalidPair of [[true, true, "reject_by_idempotency_key"], [false, false, "none"]]) {
  const invalid = structuredClone(registry);
  [invalid.entries[0].logical_delete_active, invalid.entries[0].physical_delete_confirmed, invalid.entries[0].retrieval_action] = invalidPair;
  if (validateLifecycle(invalid)) throw new Error(`contradictory lifecycle accepted: ${JSON.stringify(invalidPair)}`);
}

const serialized = JSON.stringify({ policy, receipt, registry });
for (const pattern of [/\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\b/i, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, /\b\d{3}-\d{2}-\d{4}\b/]) {
  if (pattern.test(serialized)) throw new Error(`forbidden sensitive pattern: ${pattern}`);
}
console.log("PASS: physical deletion failure preserved; routing conflicts and contradictory tombstone lifecycle states fail closed");
