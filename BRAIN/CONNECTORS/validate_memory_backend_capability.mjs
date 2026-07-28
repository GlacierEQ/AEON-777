import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  authorizationDecisionDigest,
  evaluatePhysicalDeleteAuthorization,
  evaluatePhysicalDeleteClosure,
  evaluatePhysicalDeleteRequest
} from "./memory_delete_gate.mjs";

const read = (name) => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), "utf8"));
const probe = read("./MEMORY_BACKEND_CAPABILITY_PROBE_2026-07-24.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validateProbe = ajv.compile(read("./MEMORY_BACKEND_CAPABILITY_PROBE_SCHEMA.json"));
const assertProbe = (candidate, label) => {
  if (!validateProbe(candidate)) throw new Error(`${label}: ${JSON.stringify(validateProbe.errors)}`);
};
assertProbe(probe, "observed blocked capability probe");

const validateDecision = ajv.compile(read("./MEMORY_DELETION_GATE_DECISION_SCHEMA.json"));
const assertDecision = (decision, label) => {
  if (!validateDecision(decision)) throw new Error(`${label}: ${JSON.stringify(validateDecision.errors)}`);
};

const blocked = evaluatePhysicalDeleteAuthorization({
  namespace: probe.namespace,
  stable_target_id: null,
  requested_at: "2026-07-25T04:30:00Z"
}, probe);
assertDecision(blocked, "blocked pre-delete decision");
if (blocked.authorized || blocked.executable || blocked.action !== "retain_logical_tombstone") {
  throw new Error("unsupported deletion did not fail closed");
}
for (const required of [
  "stable_target_id_missing",
  "addressable_backend_id_unavailable",
  "delete_by_id_unsupported",
  "target_not_observed_in_capability_probe",
  "namespace_authorization_unverified"
]) {
  if (!blocked.reasons.includes(required)) throw new Error(`missing authorization block reason: ${required}`);
}
for (const postDeleteReason of ["immutable_deletion_receipt_unverified", "negative_recall_unverified"]) {
  if (blocked.reasons.includes(postDeleteReason)) throw new Error(`pre-delete gate improperly required post-delete proof: ${postDeleteReason}`);
}

const wrongNamespace = evaluatePhysicalDeleteAuthorization({
  namespace: "sm_project_default",
  stable_target_id: "synthetic-id",
  requested_at: "2026-07-25T04:30:00Z",
  authorization_evidence: {
    namespace_control: {
      verified: true,
      approval_state: "approved",
      namespace: "sm_project_default",
      owner_ref: "synthetic-owner",
      approved_at: "2026-07-25T04:29:00Z"
    }
  }
}, probe);
assertDecision(wrongNamespace, "wrong-namespace decision");
if (!wrongNamespace.reasons.includes("namespace_mismatch")) throw new Error("namespace drift was not blocked");

const targetId = "synthetic-id";
const evidenceCapableProbe = {
  ...probe,
  graph_observation: {
    ...probe.graph_observation,
    document_ids_exposed: true,
    target_observations: [{
      target_id: targetId,
      target_kind: "document",
      namespace: probe.namespace,
      observed_at: probe.observed_at,
      addressable: true
    }]
  },
  recall_observation: {
    ...probe.recall_observation,
    stable_target_ids_exposed: true
  },
  mutation_interface: {
    actions: ["save", "forget", "delete_by_id"],
    target_selector: "stable_id",
    delete_by_id_supported: true,
    delete_document_chunks_supported: false
  },
  deletion_contract: {
    physical_delete_claim_allowed: false,
    negative_recall_confirmed: false,
    logical_tombstone_required: true,
    next_gate: "pre_delete_authorization"
  }
};
assertProbe(evidenceCapableProbe, "synthetic capable probe");

const authorizationRequest = {
  namespace: probe.namespace,
  stable_target_id: targetId,
  requested_at: "2026-07-25T04:30:00Z",
  authorization_evidence: {
    namespace_control: {
      verified: true,
      approval_state: "approved",
      namespace: probe.namespace,
      owner_ref: "synthetic-owner",
      approved_at: "2026-07-25T04:29:00Z"
    }
  },
  deletion_evidence: {
    immutable_receipt_required: true,
    negative_recall_required: true
  }
};

const wrongTarget = evaluatePhysicalDeleteAuthorization({
  ...authorizationRequest,
  stable_target_id: "synthetic-other-id"
}, evidenceCapableProbe);
assertDecision(wrongTarget, "wrong-target decision");
if (wrongTarget.authorized || !wrongTarget.reasons.includes("target_not_observed_in_capability_probe")) {
  throw new Error("unobserved target was authorized from a generic capability claim");
}

const authorization = evaluatePhysicalDeleteRequest(authorizationRequest, evidenceCapableProbe);
assertDecision(authorization, "authorized pre-delete decision");
if (!authorization.authorized || !authorization.executable || authorization.action !== "authorize_physical_delete") {
  throw new Error(`capable pre-delete request was not authorized: ${authorization.reasons}`);
}
if (authorization.action === "physical_delete") throw new Error("pre-delete gate claimed that deletion already occurred");

const staleAuthorization = evaluatePhysicalDeleteAuthorization({
  ...authorizationRequest,
  requested_at: "2026-07-27T04:30:00Z"
}, evidenceCapableProbe);
assertDecision(staleAuthorization, "stale-capability decision");
if (!staleAuthorization.reasons.includes("capability_probe_stale")) throw new Error("stale capability probe was accepted");

const missingClosureEvidence = evaluatePhysicalDeleteClosure(authorization, {});
assertDecision(missingClosureEvidence, "missing-evidence closure decision");
if (missingClosureEvidence.closable ||
    !missingClosureEvidence.reasons.includes("immutable_authorization_record_unverified") ||
    !missingClosureEvidence.reasons.includes("immutable_deletion_receipt_unverified") ||
    !missingClosureEvidence.reasons.includes("negative_recall_unverified") ||
    !missingClosureEvidence.reasons.includes("evidence_identifier_missing")) {
  throw new Error("tombstone closure accepted without immutable proof identifiers");
}

const verifiedEvidence = {
  immutable_authorization_record: {
    record_id: "synthetic-authorization-record-v1",
    verified: true,
    immutable: true,
    authorization_id: authorization.authorization_id,
    decision_sha256: authorizationDecisionDigest(authorization)
  },
  immutable_receipt: {
    receipt_id: "synthetic-delete-receipt-v1",
    verified: true,
    immutable: true,
    result: "deleted",
    authorization_id: authorization.authorization_id,
    namespace: authorization.namespace,
    target_id: authorization.target_id,
    deleted_at: "2026-07-25T04:31:00Z"
  },
  negative_recall: {
    recall_id: "synthetic-negative-recall-v1",
    verified: true,
    result: "not_found",
    authorization_id: authorization.authorization_id,
    namespace: authorization.namespace,
    target_id: authorization.target_id,
    checked_at: "2026-07-25T04:32:00Z"
  }
};
const closure = evaluatePhysicalDeleteClosure(authorization, verifiedEvidence);
assertDecision(closure, "verified closure decision");
if (!closure.closable || closure.action !== "close_logical_tombstone") {
  throw new Error(`verified post-delete sequence was rejected: ${closure.reasons}`);
}

const forgedAuthorization = structuredClone(authorization);
forgedAuthorization.target_id = "synthetic-forged-id";
const forgedClosure = evaluatePhysicalDeleteClosure(forgedAuthorization, verifiedEvidence);
assertDecision(forgedClosure, "forged-authorization closure decision");
if (forgedClosure.closable ||
    !forgedClosure.reasons.includes("prior_authorization_unverified") ||
    !forgedClosure.reasons.includes("immutable_authorization_record_unverified")) {
  throw new Error("fabricated authorization decision was accepted");
}

for (const [field, label] of [["receipt_id", "deletion receipt"], ["recall_id", "negative recall"]]) {
  const missingId = structuredClone(verifiedEvidence);
  if (field === "receipt_id") missingId.immutable_receipt.receipt_id = "";
  else missingId.negative_recall.recall_id = "";
  const result = evaluatePhysicalDeleteClosure(authorization, missingId);
  assertDecision(result, `missing ${label} identifier decision`);
  if (result.closable || !result.reasons.includes("evidence_identifier_missing")) {
    throw new Error(`missing ${label} identifier was accepted`);
  }
}

const deletionBeforeAuthorization = structuredClone(verifiedEvidence);
deletionBeforeAuthorization.immutable_receipt.deleted_at = "2026-07-25T04:29:30Z";
const invertedDeletion = evaluatePhysicalDeleteClosure(authorization, deletionBeforeAuthorization);
assertDecision(invertedDeletion, "temporally inverted deletion decision");
if (!invertedDeletion.reasons.includes("deletion_precedes_authorization")) {
  throw new Error("deletion receipt preceding authorization was accepted");
}

const recallBeforeDeletion = structuredClone(verifiedEvidence);
recallBeforeDeletion.negative_recall.checked_at = "2026-07-25T04:30:30Z";
const invertedRecall = evaluatePhysicalDeleteClosure(authorization, recallBeforeDeletion);
assertDecision(invertedRecall, "temporally inverted recall decision");
if (!invertedRecall.reasons.includes("negative_recall_precedes_deletion")) {
  throw new Error("negative recall preceding deletion receipt was accepted");
}

const mismatchedAuthorization = structuredClone(verifiedEvidence);
mismatchedAuthorization.immutable_receipt.authorization_id = "0".repeat(64);
const mismatchClosure = evaluatePhysicalDeleteClosure(authorization, mismatchedAuthorization);
assertDecision(mismatchClosure, "authorization-mismatch closure decision");
if (!mismatchClosure.reasons.includes("immutable_deletion_receipt_unverified")) {
  throw new Error("post-delete receipt was not bound to prior authorization");
}

const serialized = JSON.stringify({ probe, blocked, authorization, closure });
for (const pattern of [/\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\b/i, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, /\b\d{3}-\d{2}-\d{4}\b/]) {
  if (pattern.test(serialized)) throw new Error(`forbidden sensitive pattern: ${pattern}`);
}
console.log("PASS: target-bound deletion authorization and immutable tombstone closure proofs fail closed");
