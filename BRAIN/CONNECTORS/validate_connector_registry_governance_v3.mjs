import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const read = (name) => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), "utf8"));
const schema = read("./CONNECTOR_REGISTRY_GOVERNANCE_SCHEMA_V3.json");
const fixtureSet = read("./CONNECTOR_REGISTRY_GOVERNANCE_FIXTURES_V3.json");

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

function assertSchema(record, label) {
  if (!validate(record)) throw new Error(`${label}: ${JSON.stringify(validate.errors)}`);
}

function semanticReasons(record) {
  const reasons = [];
  if (record.lifecycle_state === "connected" && record.authentication_state !== "authenticated") {
    reasons.push("connected_requires_authenticated_state");
  }
  if (record.authentication_state === "authenticated" &&
      (!record.last_successful_probe_at || !record.last_successful_probe_receipt_ref)) {
    reasons.push("authenticated_requires_successful_probe_receipt");
  }
  if (record.provenance_coverage.status === "complete" &&
      (!record.provenance_coverage.covered_fields.length || !record.provenance_coverage.receipt_ref)) {
    reasons.push("complete_provenance_requires_fields_and_receipt");
  }
  if (record.idempotency_strategy.status === "verified" &&
      (!record.idempotency_strategy.expression || !record.idempotency_strategy.receipt_ref)) {
    reasons.push("verified_idempotency_requires_expression_and_receipt");
  }
  for (const [name, quality] of [["connector", record.connector_quality], ["data", record.data_quality]]) {
    if (quality.status === "unknown" && (quality.score !== 0 || quality.evidence.length !== 0)) {
      reasons.push(`${name}_unknown_quality_must_have_zero_score_and_no_evidence`);
    }
    if (quality.status === "measured" && quality.evidence.length === 0) {
      reasons.push(`${name}_measured_quality_requires_evidence`);
    }
  }
  if (record.data_quality.status === "measured" &&
      Object.values(record.data_quality.dimensions).some((value) => typeof value !== "number")) {
    reasons.push("measured_data_quality_requires_all_dimensions");
  }
  return reasons;
}

function assertSemantics(record, label) {
  const reasons = semanticReasons(record);
  if (reasons.length) throw new Error(`${label}: ${reasons.join(",")}`);
}

for (const [index, record] of fixtureSet.records.entries()) {
  assertSchema(record, `fixture ${index}`);
  assertSemantics(record, `fixture ${index}`);
}

const unknown = fixtureSet.records[0];
const verified = fixtureSet.records[1];
const negativeControls = [
  ["invalid lifecycle", {...unknown, lifecycle_state:"live"}, "schema"],
  ["authentication inference", {...unknown, lifecycle_state:"connected"}, "connected_requires_authenticated_state"],
  ["unreceipted authentication", {...verified, last_successful_probe_receipt_ref:null}, "authenticated_requires_successful_probe_receipt"],
  ["unsupported quality score", {...unknown, connector_quality:{score:80,status:"unknown",evidence:[]}}, "connector_unknown_quality_must_have_zero_score_and_no_evidence"],
  ["unreceipted provenance", {...verified, provenance_coverage:{status:"complete",covered_fields:["sha256"],receipt_ref:null}}, "complete_provenance_requires_fields_and_receipt"],
  ["unreceipted idempotency", {...verified, idempotency_strategy:{status:"verified",expression:"sha256(payload)",receipt_ref:null}}, "verified_idempotency_requires_expression_and_receipt"]
];

for (const [label, candidate, expected] of negativeControls) {
  const schemaValid = validate(candidate);
  const reasons = schemaValid ? semanticReasons(candidate) : ["schema"];
  if (!reasons.includes(expected)) {
    throw new Error(`${label}: expected rejection ${expected}, observed ${JSON.stringify({schemaValid,reasons,errors:validate.errors})}`);
  }
}

const serialized = JSON.stringify(fixtureSet);
for (const pattern of [
  /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password)\b/i,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b\d{3}-\d{2}-\d{4}\b/
]) {
  if (pattern.test(serialized)) throw new Error(`forbidden projection pattern: ${pattern}`);
}

console.log("PASS: connector registry governance schema, semantics, and negative controls");
