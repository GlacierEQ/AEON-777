import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { evaluatePhysicalDeleteRequest } from "./memory_delete_gate.mjs";

const read = (name) => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), "utf8"));
const schema = read("./MEMORY_BACKEND_CAPABILITY_PROBE_SCHEMA.json");
const probe = read("./MEMORY_BACKEND_CAPABILITY_PROBE_2026-07-24.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);
if (!validate(probe)) throw new Error(JSON.stringify(validate.errors));

const blocked = evaluatePhysicalDeleteRequest({
  namespace: probe.namespace,
  stable_target_id: null,
  immutable_receipt_required: true,
  negative_recall_required: true
}, probe);
if (blocked.executable || blocked.action !== "retain_logical_tombstone") throw new Error("unsupported deletion did not fail closed");
for (const required of ["stable_target_id_missing", "addressable_backend_id_unavailable", "delete_by_id_unsupported"]) {
  if (!blocked.reasons.includes(required)) throw new Error(`missing block reason: ${required}`);
}

const wrongNamespace = evaluatePhysicalDeleteRequest({
  namespace: "sm_project_default",
  stable_target_id: "synthetic-id",
  immutable_receipt_required: true,
  negative_recall_required: true
}, probe);
if (!wrongNamespace.reasons.includes("namespace_mismatch")) throw new Error("namespace drift was not blocked");

const unsafeReceipt = evaluatePhysicalDeleteRequest({
  namespace: probe.namespace,
  stable_target_id: "synthetic-id",
  immutable_receipt_required: false,
  negative_recall_required: false
}, probe);
if (!unsafeReceipt.reasons.includes("immutable_receipt_not_required") ||
    !unsafeReceipt.reasons.includes("negative_recall_not_required")) {
  throw new Error("receipt or negative-recall gate was bypassed");
}

const serialized = JSON.stringify(probe);
for (const pattern of [/\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\b/i, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, /\b\d{3}-\d{2}-\d{4}\b/]) {
  if (pattern.test(serialized)) throw new Error(`forbidden sensitive pattern: ${pattern}`);
}
console.log("PASS: memory backend capability probe is schema-valid and physical deletion fails closed");
