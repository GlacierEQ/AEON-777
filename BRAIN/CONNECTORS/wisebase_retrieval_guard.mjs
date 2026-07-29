const hasValue = (value) => value !== undefined && value !== null && value !== "";

export function evaluateWisebaseCandidate(candidate, control) {
  const reasons = [];

  for (const field of control.required_candidate_fields) {
    if (!Object.prototype.hasOwnProperty.call(candidate, field)) {
      reasons.push(`missing_field:${field}`);
    }
  }

  if (!control.allowed_truth_classes.includes(candidate.truth_class)) {
    reasons.push("unsupported_truth_class");
  }
  if (!control.allowed_sensitivity_classes.includes(candidate.sensitivity)) {
    reasons.push("unsupported_sensitivity_class");
  }
  if (!control.allowed_source_retention_decisions.includes(candidate.source_retention_decision)) {
    reasons.push("unsupported_source_retention_decision");
  }
  if (!hasValue(candidate.source_pointer)) {
    reasons.push("source_pointer_missing");
  }
  if (!hasValue(candidate.raw_preservation_pointer)) {
    reasons.push("raw_preservation_pointer_missing");
  }
  if (candidate.legacy_source === true && !hasValue(candidate.captured_at)) {
    reasons.push("legacy_capture_time_missing");
  }
  if (candidate.legacy_source === true && !hasValue(candidate.moment_context_status)) {
    reasons.push("legacy_moment_context_missing");
  }

  if (
    control.source_preservation_policy.rewrite_legacy_source_prohibited &&
    candidate.rewrite_source === true
  ) {
    reasons.push("legacy_source_rewrite_prohibited");
  }
  if (
    control.source_preservation_policy.delete_legacy_source_by_default_prohibited &&
    candidate.deletion_requested === true
  ) {
    reasons.push("legacy_source_deletion_prohibited");
  }

  const profile = control.query_profiles[candidate.query_profile];
  if (!profile) {
    reasons.push("unknown_query_profile");
  } else if (
    Number.isInteger(profile.minimum_exact_anchor_count) &&
    candidate.exact_anchor_count < profile.minimum_exact_anchor_count
  ) {
    reasons.push("query_insufficiently_anchored");
  }

  if (
    candidate.query_profile === "architecture" &&
    profile?.must_split_broad_query &&
    candidate.broad_query_unsplit === true
  ) {
    reasons.push("broad_architecture_query_unsplit");
  }

  const restrictedClasses = new Set(control.restricted_content_classes);
  const candidateRestricted = Array.isArray(candidate.restricted_content_classes)
    ? candidate.restricted_content_classes.filter((item) => restrictedClasses.has(item))
    : [];
  if (candidateRestricted.length > 0 && candidate.promotion_decision !== "quarantine") {
    reasons.push("restricted_content_promotion_attempt");
  }

  if (
    candidate.mutable_state === true &&
    control.promotion_policy.mutable_state_requires_current_run_receipt &&
    !hasValue(candidate.current_run_receipt)
  ) {
    reasons.push("mutable_state_receipt_missing");
  }

  if (
    candidate.promotion_decision === "promote" &&
    (!hasValue(candidate.last_verified_at) || !hasValue(candidate.source_pointer))
  ) {
    reasons.push("promotion_verification_incomplete");
  }

  if (
    candidate.duplicate_action === "consolidate" &&
    control.duplicate_policy.consolidation_requires_exact_hash &&
    candidate.exact_hash_verified !== true
  ) {
    reasons.push("duplicate_consolidation_without_exact_hash");
  }

  if (
    candidate.project_identity_action === "merge" &&
    control.project_identity_policy.source_proven_relationship_required &&
    candidate.source_proven_relationship !== true
  ) {
    reasons.push("project_identity_merge_without_source_proof");
  }

  if (
    candidate.promotion_decision === "promote" &&
    control.promotion_policy.relevance_alone_is_insufficient &&
    candidate.support_basis === "relevance_only"
  ) {
    reasons.push("relevance_only_promotion");
  }

  if (
    candidate.promotion_decision === "promote" &&
    control.promotion_policy.repetition_alone_is_insufficient &&
    candidate.support_basis === "repetition_only"
  ) {
    reasons.push("repetition_only_promotion");
  }

  return {
    compliant: reasons.length === 0,
    reasons,
    source_disposition:
      reasons.includes("legacy_source_deletion_prohibited") ||
      reasons.includes("legacy_source_rewrite_prohibited")
        ? "preserve_raw"
        : candidate.source_retention_decision,
    claim_disposition: reasons.length === 0 ? candidate.promotion_decision : "reject_or_quarantine"
  };
}
