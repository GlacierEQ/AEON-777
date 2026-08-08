import fs from "node:fs";
import assert from "node:assert/strict";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const schema = JSON.parse(
  fs.readFileSync(new URL("./EVIDENCE_INTAKE_GATE_SCHEMA.json", import.meta.url), "utf8"),
);

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const restrictedSensitivity = new Set([
  "restricted",
  "privileged",
  "minor_sensitive",
  "medical",
  "school",
  "psychological",
  "sealed",
]);

function isNonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function semanticBlockers(record) {
  const blockers = new Set();

  if (!isNonEmpty(record.source.source_pointer)) blockers.add("missing_source_pointer");
  if (!["stable_immutable", "stable_versioned"].includes(record.source.pointer_stability)) {
    blockers.add("unstable_source_pointer");
  }
  if (!isNonEmpty(record.source.original_filename)) blockers.add("missing_original_filename");
  if (!isNonEmpty(record.source.source_version)) blockers.add("missing_source_version");
  if (!/^[a-f0-9]{64}$/.test(record.integrity.sha256_exact_bytes ?? "")) {
    blockers.add("missing_sha256_exact_bytes");
  }
  if (!Number.isInteger(record.integrity.byte_count) || record.integrity.byte_count < 0) {
    blockers.add("missing_byte_count");
  }
  if (!isNonEmpty(record.integrity.mime_type)) blockers.add("missing_mime_type");
  if (!isNonEmpty(record.acquisition.acquired_at)) blockers.add("missing_acquired_at");
  if (!isNonEmpty(record.acquisition.custodian)) blockers.add("missing_custodian");
  if (!isNonEmpty(record.acquisition.acquisition_method)) blockers.add("missing_acquisition_method");

  if (!["original", "derivative"].includes(record.artifact.class)) blockers.add("unknown_artifact_class");
  if (record.artifact.class === "derivative" && !isNonEmpty(record.artifact.derivative_of)) {
    blockers.add("missing_derivative_parent");
  }

  if (record.duplicate.status === "unknown") blockers.add("duplicate_unresolved");
  if (record.duplicate.status === "exact_duplicate") {
    if (!isNonEmpty(record.duplicate.group_id)) blockers.add("exact_duplicate_missing_group");
    if (record.duplicate.is_controlling_copy !== true && !isNonEmpty(record.duplicate.controlling_copy_ref)) {
      blockers.add("exact_duplicate_controlling_copy_unresolved");
    }
  }

  if (record.sensitivity.class === "unclassified") blockers.add("sensitivity_unclassified");
  if (!["not_required", "preserved"].includes(record.chain_of_custody.status)) {
    blockers.add("chain_of_custody_unresolved");
  }
  if (record.truth_partition !== "verified_record") blockers.add("truth_partition_not_verified_record");

  if (record.source.exact_bytes_accessible && !record.source.source_bytes_preserved) {
    blockers.add("exact_bytes_not_preserved");
  }

  if (restrictedSensitivity.has(record.sensitivity.class) && !["no_projection", "pointer_only"].includes(record.projection_policy)) {
    blockers.add("unsafe_sensitive_projection");
  }
  if (record.sensitivity.contains_protected_minor && !["no_projection", "pointer_only"].includes(record.projection_policy)) {
    blockers.add("protected_minor_projection_forbidden");
  }

  if (record.human_review.state !== "approved") blockers.add("human_review_not_approved");
  if (record.human_review.state === "approved") {
    if (!isNonEmpty(record.human_review.reviewer)) blockers.add("missing_human_reviewer");
    if (!isNonEmpty(record.human_review.reviewed_at)) blockers.add("missing_human_review_time");
  }

  if (record.truth_partition === "filing_ready_assertion") {
    blockers.add("filing_ready_assertion_requires_separate_gate");
  }

  return [...blockers].sort();
}

function assertBlockerReceipt(record, expected) {
  assert.deepEqual([...record.promotion.blockers].sort(), expected, "promotion.blockers must exactly match computed blockers");
}

function evaluate(record) {
  const schemaOk = validate(record);
  if (!schemaOk) {
    return { ok: false, class: "schema_reject", errors: validate.errors };
  }

  const blockers = semanticBlockers(record);
  try {
    assertBlockerReceipt(record, blockers);
  } catch (error) {
    return { ok: false, class: "blocker_receipt_mismatch", error: error.message, blockers };
  }

  if (record.promotion.status === "verified_evidence") {
    if (blockers.length !== 0) return { ok: false, class: "promotion_blocked", blockers };
    if (record.promotion.provenance_receipt_required !== true) {
      return { ok: false, class: "provenance_receipt_required" };
    }
  }

  if (record.promotion.status === "promotion_ready") {
    const allowed = blockers.filter((item) => item !== "human_review_not_approved");
    if (allowed.length !== 0) return { ok: false, class: "not_promotion_ready", blockers };
    if (record.promotion.provenance_receipt_required !== true) {
      return { ok: false, class: "provenance_receipt_required" };
    }
  }

  if (["promotion_ready", "verified_evidence"].includes(record.promotion.status) && record.truth_partition === "filing_ready_assertion") {
    return { ok: false, class: "filing_assertion_gate_separate", blockers };
  }

  return { ok: true, blockers };
}

const verified = {
  schema_version: "1.0.0",
  gate_id: "eig_synthetic_verified_001",
  thread_anchor: "MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51",
  case_id: "SYNTHETIC-CASE",
  source: {
    approved_root_ref: "approved_source_fixture",
    source_pointer: "vault://synthetic/evidence/fixture/v1",
    pointer_stability: "stable_versioned",
    original_filename: "fixture.pdf",
    source_version: "v1",
    exact_bytes_accessible: true,
    source_bytes_preserved: true
  },
  integrity: {
    sha256_exact_bytes: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    byte_count: 1234,
    mime_type: "application/pdf"
  },
  acquisition: {
    acquired_at: "2026-08-08T15:56:00Z",
    custodian: "authorized_source_connector",
    acquisition_method: "bounded_connector_read"
  },
  artifact: { class: "original", derivative_of: null },
  duplicate: { status: "unique", group_id: null, is_controlling_copy: true, controlling_copy_ref: null },
  sensitivity: { class: "internal", contains_protected_minor: false },
  chain_of_custody: { status: "preserved", requirements: [] },
  truth_partition: "verified_record",
  projection_policy: "metadata_only",
  promotion: { status: "verified_evidence", blockers: [], provenance_receipt_required: true },
  human_review: { state: "approved", reviewer: "synthetic_operator", reviewed_at: "2026-08-08T15:56:30Z" },
  created_at: "2026-08-08T15:56:30Z"
};

const verifiedResult = evaluate(verified);
assert.equal(verifiedResult.ok, true, JSON.stringify(verifiedResult));
assert.deepEqual(verifiedResult.blockers, []);

const discovery = structuredClone(verified);
discovery.gate_id = "eig_synthetic_discovery_001";
discovery.source.source_pointer = null;
discovery.source.pointer_stability = "unknown";
discovery.source.source_version = null;
discovery.source.exact_bytes_accessible = false;
discovery.source.source_bytes_preserved = false;
discovery.integrity = { sha256_exact_bytes: null, byte_count: null, mime_type: null };
discovery.acquisition = { acquired_at: null, custodian: null, acquisition_method: null };
discovery.artifact = { class: "unknown", derivative_of: null };
discovery.duplicate = { status: "unknown", group_id: null, is_controlling_copy: null, controlling_copy_ref: null };
discovery.sensitivity = { class: "unclassified", contains_protected_minor: false };
discovery.chain_of_custody = { status: "unknown", requirements: ["acquire_exact_bytes"] };
discovery.truth_partition = "discovery_signal";
discovery.projection_policy = "no_projection";
discovery.promotion = { status: "discovery_only", blockers: [], provenance_receipt_required: false };
discovery.human_review = { state: "required", reviewer: null, reviewed_at: null };
discovery.promotion.blockers = semanticBlockers(discovery);
const discoveryResult = evaluate(discovery);
assert.equal(discoveryResult.ok, true, JSON.stringify(discoveryResult));
assert.ok(discoveryResult.blockers.includes("missing_sha256_exact_bytes"));
assert.ok(discoveryResult.blockers.includes("duplicate_unresolved"));

const promotionReady = structuredClone(verified);
promotionReady.gate_id = "eig_synthetic_ready_001";
promotionReady.promotion.status = "promotion_ready";
promotionReady.human_review = { state: "required", reviewer: null, reviewed_at: null };
promotionReady.promotion.blockers = semanticBlockers(promotionReady);
const promotionReadyResult = evaluate(promotionReady);
assert.equal(promotionReadyResult.ok, true, JSON.stringify(promotionReadyResult));
assert.deepEqual(promotionReadyResult.blockers, ["human_review_not_approved"]);

const unsafeSensitive = structuredClone(verified);
unsafeSensitive.gate_id = "eig_synthetic_sensitive_reject_001";
unsafeSensitive.sensitivity.class = "privileged";
unsafeSensitive.projection_policy = "allowed";
unsafeSensitive.promotion.blockers = semanticBlockers(unsafeSensitive);
const unsafeSensitiveResult = evaluate(unsafeSensitive);
assert.equal(unsafeSensitiveResult.ok, false);
assert.equal(unsafeSensitiveResult.class, "schema_reject");

const filingAssertion = structuredClone(verified);
filingAssertion.gate_id = "eig_synthetic_filing_reject_001";
filingAssertion.truth_partition = "filing_ready_assertion";
filingAssertion.promotion.blockers = semanticBlockers(filingAssertion);
const filingAssertionResult = evaluate(filingAssertion);
assert.equal(filingAssertionResult.ok, false);

console.log("PASS: evidence intake gate compiles and enforces discovery→promotion boundaries");
console.log("PASS: verified evidence requires source pointer, exact-byte SHA-256, custody, duplicate resolution, sensitivity, safe projection, and human review");
console.log("PASS: filing-ready assertions remain a separate current-evidence-and-authority gate");
