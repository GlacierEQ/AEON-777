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

  if (
    entry.legal_use_status === "automatically_admissible" &&
    control.legal_use_policy.automatic_admissibility_claim_prohibited
  ) {
    reasons.push("automatic_admissibility_claim_prohibited");
  }

  const repeated = Number(entry.journal_series?.occurrence_count || 0) > 1;

  return {
    compliant: reasons.length === 0,
    reasons,
    source_disposition: "preserve_raw",
    support_disposition:
      entry.support_state === "support_not_currently_loaded" ||
      entry.support_state === "support_inaccessible_current_run"
        ? "support_gap_not_factual_negation"
        : entry.support_state,
    repetition_disposition: repeated ? "longitudinal_thread_required" : "single_entry_preserved"
  };
}
