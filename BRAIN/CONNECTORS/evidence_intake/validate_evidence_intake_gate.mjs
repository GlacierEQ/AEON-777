import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const gateSchema = JSON.parse(
  fs.readFileSync(new URL("./EVIDENCE_INTAKE_GATE_SCHEMA.json", import.meta.url), "utf8"),
);
const pointerSchema = JSON.parse(
  fs.readFileSync(new URL("../../RESOURCE_POINTER_SCHEMA.json", import.meta.url), "utf8"),
);
const provenanceSchema = JSON.parse(
  fs.readFileSync(new URL("../PROVENANCE_RECEIPT_SCHEMA.json", import.meta.url), "utf8"),
);

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(pointerSchema);
const validateGateSchema = ajv.compile(gateSchema);
const validateProvenance = ajv.compile(provenanceSchema);

const restrictedSensitivity = new Set([
  "restricted",
  "privileged",
  "minor_sensitive",
  "medical",
  "school",
  "psychological",
  "sealed",
]);
const evidentiaryClaimClasses = new Set([
  "source_fact",
  "procedural_record",
  "court_finding",
  "party_allegation",
  "witness_statement",
]);
const evidentiarySourceKinds = new Set(["court_record", "evidence", "communication", "filing"]);

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeSha256(value) {
  if (!nonEmpty(value)) return null;
  const normalized = value.toLowerCase().replace(/^sha256:/, "");
  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : null;
}

function semanticBlockers(record) {
  const blockers = new Set();
  const pointer = record.source.resource_pointer;
  const pointerHash = normalizeSha256(pointer.content_hash);
  const exactHash = normalizeSha256(record.integrity.sha256_exact_bytes);

  if (!nonEmpty(record.source.approved_root_ref)) blockers.add("missing_approved_root");
  if (!["stable_immutable", "stable_versioned"].includes(record.source.pointer_stability)) {
    blockers.add("unstable_source_pointer");
  }
  if (!nonEmpty(record.source.original_filename)) blockers.add("missing_original_filename");
  if (!nonEmpty(record.source.source_version)) blockers.add("missing_source_version");

  if (pointer.resolution_status !== "verified") blockers.add("resource_pointer_not_verified");
  if (pointer.case_id !== record.case_id) blockers.add("resource_pointer_case_mismatch");
  if (!evidentiarySourceKinds.has(pointer.source_kind)) blockers.add("resource_pointer_not_evidence_source");
  if (!nonEmpty(pointer.source_system)) blockers.add("resource_pointer_missing_source_system");
  if (!pointerHash) blockers.add("resource_pointer_missing_hash");

  if (!exactHash) blockers.add("missing_sha256_exact_bytes");
  if (pointerHash && exactHash && pointerHash !== exactHash) blockers.add("resource_pointer_hash_mismatch");
  if (!Number.isInteger(record.integrity.byte_count) || record.integrity.byte_count < 0) {
    blockers.add("missing_byte_count");
  }
  if (!nonEmpty(record.integrity.mime_type)) blockers.add("missing_mime_type");

  if (!nonEmpty(record.acquisition.acquired_at)) blockers.add("missing_acquired_at");
  if (!nonEmpty(record.acquisition.custodian)) blockers.add("missing_custodian");
  if (!nonEmpty(record.acquisition.acquisition_method)) blockers.add("missing_acquisition_method");

  if (!["original", "derivative"].includes(record.artifact.class)) blockers.add("unknown_artifact_class");
  if (record.artifact.class === "derivative" && !nonEmpty(record.artifact.derivative_of)) {
    blockers.add("missing_derivative_parent");
  }

  if (record.duplicate.status === "unknown") blockers.add("duplicate_unresolved");
  if (record.duplicate.status === "exact_duplicate") {
    if (!nonEmpty(record.duplicate.group_id)) blockers.add("exact_duplicate_missing_group");
    if (record.duplicate.is_controlling_copy !== true && !nonEmpty(record.duplicate.controlling_copy_ref)) {
      blockers.add("exact_duplicate_controlling_copy_unresolved");
    }
  }

  if (record.sensitivity.class === "unclassified") blockers.add("sensitivity_unclassified");
  if (!["not_required", "preserved"].includes(record.chain_of_custody.status)) {
    blockers.add("chain_of_custody_unresolved");
  }
  if (!evidentiaryClaimClasses.has(record.claim_class)) blockers.add("non_evidentiary_claim_class");
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
    if (!nonEmpty(record.human_review.reviewer)) blockers.add("missing_human_reviewer");
    if (!nonEmpty(record.human_review.reviewed_at)) blockers.add("missing_human_review_time");
  }

  if (record.truth_partition === "filing_ready_assertion") {
    blockers.add("filing_ready_assertion_requires_separate_gate");
  }

  return [...blockers].sort();
}

function mappedSensitivity(record) {
  if (record.sensitivity.contains_protected_minor) return "sealed";
  if (record.sensitivity.class === "public") return "public";
  if (record.sensitivity.class === "internal") return "private";
  if (record.sensitivity.class === "restricted") return "restricted";
  return "sealed";
}

function provenanceVerification(record) {
  return ["party_allegation", "witness_statement"].includes(record.claim_class)
    ? "partially_verified"
    : "verified";
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function toProvenanceReceipt(record) {
  const pointer = record.source.resource_pointer;
  const exactHash = normalizeSha256(record.integrity.sha256_exact_bytes);
  const sensitivity = mappedSensitivity(record);
  const receiptId = `prv_${record.gate_id.slice(4)}`;
  const bucket = sensitivity === "sealed"
    ? "sealed_evidence"
    : record.artifact.class === "derivative"
      ? "derived_work"
      : "original_evidence";
  const projectionAllowed = ["metadata_only", "allowed"].includes(record.projection_policy);
  const idempotencyInput = [
    record.source.connector_id,
    pointer.canonical_uri,
    record.source.source_version,
    exactHash,
    record.artifact.class,
  ].join("|");

  return {
    schema_version: "1.0.0",
    receipt_id: receiptId,
    case_id: record.case_id,
    source: {
      connector_id: record.source.connector_id,
      canonical_uri: pointer.canonical_uri,
      source_version: record.source.source_version,
      original_filename: record.source.original_filename,
    },
    acquired_at: record.acquisition.acquired_at,
    custodian: record.acquisition.custodian,
    artifact_class: record.artifact.class,
    derivative_of: record.artifact.derivative_of,
    integrity: {
      sha256_exact_bytes: exactHash,
      byte_count: record.integrity.byte_count,
      mime_type: record.integrity.mime_type,
    },
    sensitivity,
    protected_minor: record.sensitivity.contains_protected_minor,
    bucket,
    claim_class: record.claim_class,
    verification_status: provenanceVerification(record),
    projection_allowed: projectionAllowed,
    human_review: {
      state: "approved",
      reviewer: record.human_review.reviewer,
      reviewed_at: record.human_review.reviewed_at,
    },
    idempotency_key: {
      algorithm: "sha256(source_connector|canonical_uri|source_version|sha256_exact_bytes|artifact_class)",
      value: sha256(idempotencyInput),
      collision_scope: "case_id",
    },
    created_at: record.created_at,
  };
}

function evaluate(record) {
  const schemaOk = validateGateSchema(record);
  if (!schemaOk) return { ok: false, class: "schema_reject", errors: validateGateSchema.errors };

  const blockers = semanticBlockers(record);
  const declared = [...record.promotion.blockers].sort();
  if (JSON.stringify(declared) !== JSON.stringify(blockers)) {
    return { ok: false, class: "blocker_receipt_mismatch", blockers, declared };
  }

  if (record.promotion.status === "promotion_ready") {
    const nonReviewBlockers = blockers.filter((item) => item !== "human_review_not_approved");
    if (nonReviewBlockers.length !== 0) return { ok: false, class: "not_promotion_ready", blockers };
    if (record.promotion.provenance_receipt_required !== true) {
      return { ok: false, class: "provenance_receipt_required" };
    }
  }

  if (record.promotion.status === "verified_evidence") {
    if (blockers.length !== 0) return { ok: false, class: "promotion_blocked", blockers };
    if (record.promotion.provenance_receipt_required !== true) {
      return { ok: false, class: "provenance_receipt_required" };
    }
    const provenance = toProvenanceReceipt(record);
    const provenanceOk = validateProvenance(provenance);
    if (!provenanceOk) {
      return { ok: false, class: "provenance_receipt_reject", errors: validateProvenance.errors };
    }
    return { ok: true, blockers, provenance };
  }

  return { ok: true, blockers, provenance: null };
}

const HASH_A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const HASH_B = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

function verifiedFixture() {
  return {
    schema_version: "1.0.0",
    gate_id: "eig_synthetic_verified_001",
    thread_anchor: "MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51",
    case_id: "SYNTHETIC-CASE",
    source: {
      connector_id: "synthetic_vault",
      approved_root_ref: "approved_source_fixture",
      resource_pointer: {
        resource_id: "synthetic-evidence-001",
        canonical_uri: "vault://synthetic/evidence/fixture/v1",
        source_kind: "evidence",
        locator: null,
        content_hash: `sha256:${HASH_A}`,
        last_checked_at: "2026-08-08T15:56:00Z",
        case_id: "SYNTHETIC-CASE",
        source_system: "synthetic_vault",
        native_id: "fixture-001",
        aliases: [],
        resolution_status: "verified",
        replaced_by: null,
        notes: null
      },
      pointer_stability: "stable_versioned",
      original_filename: "fixture.pdf",
      source_version: "v1",
      exact_bytes_accessible: true,
      source_bytes_preserved: true
    },
    integrity: { sha256_exact_bytes: HASH_A, byte_count: 1234, mime_type: "application/pdf" },
    acquisition: {
      acquired_at: "2026-08-08T15:56:00Z",
      custodian: "authorized_source_connector",
      acquisition_method: "bounded_connector_read"
    },
    artifact: { class: "original", derivative_of: null },
    duplicate: { status: "unique", group_id: null, is_controlling_copy: true, controlling_copy_ref: null },
    sensitivity: { class: "internal", contains_protected_minor: false },
    chain_of_custody: { status: "preserved", requirements: [] },
    claim_class: "source_fact",
    truth_partition: "verified_record",
    projection_policy: "metadata_only",
    promotion: { status: "verified_evidence", blockers: [], provenance_receipt_required: true },
    human_review: { state: "approved", reviewer: "synthetic_operator", reviewed_at: "2026-08-08T15:56:30Z" },
    created_at: "2026-08-08T15:56:30Z"
  };
}

const verified = verifiedFixture();
const verifiedResult = evaluate(verified);
assert.equal(verifiedResult.ok, true, JSON.stringify(verifiedResult));
assert.deepEqual(verifiedResult.blockers, []);
assert.equal(verifiedResult.provenance.verification_status, "verified");
assert.equal(verifiedResult.provenance.integrity.sha256_exact_bytes, HASH_A);

const discovery = verifiedFixture();
discovery.gate_id = "eig_synthetic_discovery_001";
discovery.source.resource_pointer.content_hash = null;
discovery.source.resource_pointer.resolution_status = "unverified";
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
discovery.claim_class = "not_applicable";
discovery.truth_partition = "discovery_signal";
discovery.projection_policy = "no_projection";
discovery.promotion = { status: "discovery_only", blockers: [], provenance_receipt_required: false };
discovery.human_review = { state: "required", reviewer: null, reviewed_at: null };
discovery.promotion.blockers = semanticBlockers(discovery);
const discoveryResult = evaluate(discovery);
assert.equal(discoveryResult.ok, true, JSON.stringify(discoveryResult));
assert.ok(discoveryResult.blockers.includes("resource_pointer_not_verified"));
assert.ok(discoveryResult.blockers.includes("missing_sha256_exact_bytes"));
assert.ok(discoveryResult.blockers.includes("duplicate_unresolved"));

const promotionReady = verifiedFixture();
promotionReady.gate_id = "eig_synthetic_ready_001";
promotionReady.promotion.status = "promotion_ready";
promotionReady.human_review = { state: "required", reviewer: null, reviewed_at: null };
promotionReady.promotion.blockers = semanticBlockers(promotionReady);
const promotionReadyResult = evaluate(promotionReady);
assert.equal(promotionReadyResult.ok, true, JSON.stringify(promotionReadyResult));
assert.deepEqual(promotionReadyResult.blockers, ["human_review_not_approved"]);

const allegation = verifiedFixture();
allegation.gate_id = "eig_synthetic_allegation_001";
allegation.claim_class = "party_allegation";
const allegationResult = evaluate(allegation);
assert.equal(allegationResult.ok, true, JSON.stringify(allegationResult));
assert.equal(allegationResult.provenance.verification_status, "partially_verified");

const hashMismatch = verifiedFixture();
hashMismatch.gate_id = "eig_synthetic_hash_mismatch_001";
hashMismatch.source.resource_pointer.content_hash = `sha256:${HASH_B}`;
const hashMismatchResult = evaluate(hashMismatch);
assert.equal(hashMismatchResult.ok, false);
assert.equal(hashMismatchResult.class, "blocker_receipt_mismatch");
assert.ok(hashMismatchResult.blockers.includes("resource_pointer_hash_mismatch"));

const unsafeSensitive = verifiedFixture();
unsafeSensitive.gate_id = "eig_synthetic_sensitive_reject_001";
unsafeSensitive.sensitivity.class = "privileged";
unsafeSensitive.projection_policy = "allowed";
unsafeSensitive.promotion.blockers = semanticBlockers(unsafeSensitive);
const unsafeSensitiveResult = evaluate(unsafeSensitive);
assert.equal(unsafeSensitiveResult.ok, false);
assert.equal(unsafeSensitiveResult.class, "promotion_blocked");
assert.ok(unsafeSensitiveResult.blockers.includes("unsafe_sensitive_projection"));

const filingAssertion = verifiedFixture();
filingAssertion.gate_id = "eig_synthetic_filing_reject_001";
filingAssertion.truth_partition = "filing_ready_assertion";
filingAssertion.promotion.blockers = semanticBlockers(filingAssertion);
const filingAssertionResult = evaluate(filingAssertion);
assert.equal(filingAssertionResult.ok, false);
assert.equal(filingAssertionResult.class, "promotion_blocked");
assert.ok(filingAssertionResult.blockers.includes("truth_partition_not_verified_record"));
assert.ok(filingAssertionResult.blockers.includes("filing_ready_assertion_requires_separate_gate"));

console.log("PASS: evidence intake gate compiles against canonical Resource Pointer and Provenance Receipt schemas");
console.log("PASS: discovery signals cannot silently omit blockers or promote without exact-byte integrity, provenance, duplicate, sensitivity, custody, and review gates");
console.log("PASS: verified evidence can preserve an allegation as an authenticated record without upgrading the allegation itself to a verified fact");
console.log("PASS: filing-ready assertions remain a separate current-evidence-and-authority gate");
