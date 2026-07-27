import crypto from "node:crypto";

const SHA256_RE = /^[a-f0-9]{64}$/;
const MAX_CAPABILITY_AGE_MS = 24 * 60 * 60 * 1000;

function timestamp(value) {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function digest(parts) {
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex");
}

export function evaluatePhysicalDeleteAuthorization(request, capabilityProbe) {
  const reasons = [];
  const namespace = request?.namespace ?? null;
  const targetId = request?.stable_target_id ?? null;
  const requestedAt = timestamp(request?.requested_at);
  const observedAt = timestamp(capabilityProbe?.observed_at);

  if (!nonEmpty(namespace) || namespace !== capabilityProbe?.namespace) reasons.push("namespace_mismatch");
  if (!nonEmpty(targetId)) reasons.push("stable_target_id_missing");
  if (!capabilityProbe?.graph_observation?.document_ids_exposed &&
      !capabilityProbe?.graph_observation?.chunk_ids_exposed) {
    reasons.push("addressable_backend_id_unavailable");
  }
  if (capabilityProbe?.mutation_interface?.delete_by_id_supported !== true) reasons.push("delete_by_id_unsupported");

  if (requestedAt === null) {
    reasons.push("authorization_timestamp_invalid");
  }
  if (observedAt === null) {
    reasons.push("capability_probe_timestamp_invalid");
  } else if (requestedAt !== null) {
    if (observedAt > requestedAt) reasons.push("capability_probe_future_dated");
    if (requestedAt - observedAt > MAX_CAPABILITY_AGE_MS) reasons.push("capability_probe_stale");
  }

  const namespaceControl = request?.authorization_evidence?.namespace_control;
  const controlApprovedAt = timestamp(namespaceControl?.approved_at);
  const namespaceAuthorized = namespaceControl?.verified === true &&
    namespaceControl?.approval_state === "approved" &&
    namespaceControl?.namespace === namespace &&
    nonEmpty(namespaceControl?.owner_ref) && namespaceControl.owner_ref !== "unassigned";
  if (!namespaceAuthorized) reasons.push("namespace_authorization_unverified");
  if (namespaceControl && controlApprovedAt === null) reasons.push("namespace_approval_timestamp_invalid");
  if (controlApprovedAt !== null && requestedAt !== null && controlApprovedAt > requestedAt) {
    reasons.push("namespace_approval_future_dated");
  }

  const authorized = reasons.length === 0;
  const authorizationId = authorized
    ? digest([
        capabilityProbe.probe_id,
        namespace,
        targetId,
        namespaceControl.owner_ref,
        request.requested_at
      ])
    : null;

  return {
    phase: "pre_delete_authorization",
    authorized,
    executable: authorized,
    action: authorized ? "authorize_physical_delete" : "retain_logical_tombstone",
    authorization_id: authorizationId,
    namespace,
    target_id: targetId,
    authorized_at: authorized ? request.requested_at : null,
    reasons
  };
}

export function evaluatePhysicalDeleteClosure(authorizationDecision, deletionEvidence) {
  const reasons = [];
  const authorizationValid = authorizationDecision?.phase === "pre_delete_authorization" &&
    authorizationDecision?.authorized === true &&
    authorizationDecision?.executable === true &&
    authorizationDecision?.action === "authorize_physical_delete" &&
    SHA256_RE.test(authorizationDecision?.authorization_id ?? "");
  if (!authorizationValid) reasons.push("prior_authorization_unverified");

  const namespace = authorizationDecision?.namespace ?? null;
  const targetId = authorizationDecision?.target_id ?? null;
  const authorizedAt = timestamp(authorizationDecision?.authorized_at);
  if (authorizationValid && authorizedAt === null) reasons.push("authorization_timestamp_invalid");

  const receipt = deletionEvidence?.immutable_receipt;
  const receiptVerified = receipt?.verified === true &&
    receipt?.immutable === true &&
    receipt?.result === "deleted" &&
    receipt?.authorization_id === authorizationDecision?.authorization_id &&
    receipt?.namespace === namespace &&
    receipt?.target_id === targetId;
  if (!receiptVerified) reasons.push("immutable_deletion_receipt_unverified");

  const deletedAt = timestamp(receipt?.deleted_at);
  if (receipt && deletedAt === null) reasons.push("deletion_timestamp_invalid");
  if (authorizedAt !== null && deletedAt !== null && deletedAt < authorizedAt) {
    reasons.push("deletion_precedes_authorization");
  }

  const negativeRecall = deletionEvidence?.negative_recall;
  const negativeRecallVerified = negativeRecall?.verified === true &&
    negativeRecall?.result === "not_found" &&
    negativeRecall?.authorization_id === authorizationDecision?.authorization_id &&
    negativeRecall?.namespace === namespace &&
    negativeRecall?.target_id === targetId;
  if (!negativeRecallVerified) reasons.push("negative_recall_unverified");

  const recallCheckedAt = timestamp(negativeRecall?.checked_at);
  if (negativeRecall && recallCheckedAt === null) reasons.push("negative_recall_timestamp_invalid");
  if (deletedAt !== null && recallCheckedAt !== null && recallCheckedAt < deletedAt) {
    reasons.push("negative_recall_precedes_deletion");
  }

  const closable = reasons.length === 0;
  const closureId = closable
    ? digest([
        authorizationDecision.authorization_id,
        receipt.receipt_id,
        negativeRecall.recall_id,
        negativeRecall.checked_at
      ])
    : null;

  return {
    phase: "post_delete_closure",
    closable,
    action: closable ? "close_logical_tombstone" : "retain_logical_tombstone",
    closure_id: closureId,
    authorization_id: authorizationDecision?.authorization_id ?? null,
    namespace,
    target_id: targetId,
    closed_at: closable ? negativeRecall.checked_at : null,
    reasons
  };
}

export function evaluatePhysicalDeleteRequest(request, capabilityProbe) {
  return evaluatePhysicalDeleteAuthorization(request, capabilityProbe);
}
