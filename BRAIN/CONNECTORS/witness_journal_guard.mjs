const hasValue = (value) => value !== undefined && value !== null && value !== "";

export function evaluateWitnessJournalEntry(entry, control) {
  const reasons = [];

  for (const field of control.required_entry_fields) {
    if (!Object.prototype.hasOwnProperty.call(entry, field)) {
      reasons.push(`missing_field:${field}`);
    }
  }

  if (!control.allowed_statement_classes.includes(entry.statement_class)) {
    reasons.push("unsupported_statement_class");
  }
  if (!control.allowed_support_states.includes(entry.support_state)) {
    reasons.push("unsupported_support_state");
  }
  if (!control.allowed_legal_use_statuses.includes(entry.legal_use_status)) {
    reasons.push("unsupported_legal_use_status");
  }
  if (!hasValue(entry.source_pointer) || !hasValue(entry.statement_pointer)) {
    reasons.push("source_or_statement_pointer_missing");
  }
  if (entry.raw_source_preserved !== true) reasons.push("raw_source_not_preserved");
  if (entry.historical_voice_preserved !== true) reasons.push("historical_voice_not_preserved");
  if (entry.assistant_text_separated !== true) reasons.push("assistant_attribution_not_separated");

  if (!entry.event_vectors || typeof entry.event_vectors !== "object") {
    reasons.push("event_vectors_missing");
  } else {
    for (const field of control.required_event_vector_fields) {
      if (!Object.prototype.hasOwnProperty.call(entry.event_vectors, field)) {
        reasons.push(`missing_event_vector:${field}`);
      }
    }
  }

  if (!entry.journal_series || typeof entry.journal_series !== "object") {
    reasons.push("journal_series_missing");
  } else {
    for (const field of control.required_series_fields) {
      if (!Object.prototype.hasOwnProperty.call(entry.journal_series, field)) {
        reasons.push(`missing_series_field:${field}`);
      }
    }
    if (
      Number(entry.journal_series.occurrence_count) > 1 &&
      !hasValue(entry.journal_series.journal_series_id)
    ) {
      reasons.push("repeated_issue_missing_series_id");
    }
    if (
      Number(entry.journal_series.occurrence_count) > 1 &&
      entry.journal_series.salience !== "elevated"
    ) {
      reasons.push("repeated_issue_salience_not_elevated");
    }
  }

  if (!entry.regular_activity_foundation || typeof entry.regular_activity_foundation !== "object") {
    reasons.push("regular_activity_foundation_missing");
  } else {
    for (const field of control.required_regular_activity_foundation_fields) {
      if (!Object.prototype.hasOwnProperty.call(entry.regular_activity_foundation, field)) {
        reasons.push(`missing_regular_activity_foundation:${field}`);
      }
    }
  }

  if (entry.discard_due_to_uncorroborated === true) {
    reasons.push("firsthand_account_discard_prohibited");
  }
  if (entry.strip_emotional_language === true) {
    reasons.push("historical_voice_stripping_prohibited");
  }
  if (entry.rewrite_source === true) {
    reasons.push("historical_source_rewrite_prohibited");
  }
  if (entry.deletion_requested === true) {
    reasons.push("raw_source_deletion_prohibited");
  }

  if (
    ["support_not_currently_loaded", "support_inaccessible_current_run"].includes(entry.support_state) &&
    entry.claimed_additional_support === false
  ) {
    reasons.push("support_gap_misrepresented_as_no_support_claimed");
  }

  if (
    entry.statement_class === "model_analysis" &&
    entry.speaker_attribution === entry.witness_id
  ) {
    reasons.push("assistant_analysis_misattributed_to_witness");
  }

  if (
    entry.statement_class === "legal_characterization" &&
    !hasValue(entry.personal_knowledge_scope)
  ) {
    reasons.push("legal_characterization_missing_observation_scope");
  }

  const foundation = entry.regular_activity_foundation || {};
  const claimsHre803b6 = entry.legal_use_status === "hre_803_b_6_regularly_conducted_activity";

  if (claimsHre803b6) {
    if (!hasValue(foundation.regularly_conducted_activity)) {
      reasons.push("hre_803_b_6_activity_not_identified");
    }
    if (!hasValue(foundation.regular_practice_description)) {
      reasons.push("hre_803_b_6_regular_practice_not_described");
    }
    if (foundation.made_at_or_near_time !== true) {
      reasons.push("hre_803_b_6_near_time_foundation_incomplete");
    }
    if (!hasValue(foundation.person_with_knowledge)) {
      reasons.push("hre_803_b_6_person_with_knowledge_missing");
    }
    if (!hasValue(foundation.custodian_or_qualified_witness)) {
      reasons.push("hre_803_b_6_qualified_witness_missing");
    }
    if (!hasValue(foundation.trustworthiness_factors)) {
      reasons.push("hre_803_b_6_trustworthiness_foundation_missing");
    }
  }

  if (
    entry.legal_use_status === "automatically_admissible" ||
    entry.legal_use_status === "automatically_admitted_without_foundation"
  ) {
    reasons.push("automatic_admission_without_foundation_prohibited");
  }

  if (
    entry.deny_hre_803_b_6_route === true &&
    control.admissibility_policy.journal_category_has_direct_hearsay_exception_route
  ) {
    reasons.push("hre_803_b_6_route_denial_prohibited");
  }

  if (
    entry.business_only_rule === true &&
    control.admissibility_policy.hre_803_b_6_applies_to_regularly_conducted_activity_not_only_business
  ) {
    reasons.push("business_only_limitation_prohibited");
  }

  const repeated = Number(entry.journal_series?.occurrence_count || 0) > 1;
  const foundationComplete = claimsHre803b6 && !reasons.some((reason) => reason.startsWith("hre_803_b_6_"));

  return {
    compliant: reasons.length === 0,
    reasons,
    source_disposition: "preserve_raw",
    support_disposition:
      entry.support_state === "support_not_currently_loaded" ||
      entry.support_state === "support_inaccessible_current_run"
        ? "support_gap_not_factual_negation"
        : entry.support_state,
    repetition_disposition: repeated ? "longitudinal_thread_required" : "single_entry_preserved",
    admissibility_disposition: claimsHre803b6
      ? foundationComplete
        ? "direct_hre_803_b_6_route_foundation_complete"
        : "direct_hre_803_b_6_route_foundation_incomplete"
      : "other_or_unclassified_route"
  };
}
