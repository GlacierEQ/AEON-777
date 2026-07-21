export function envelopeToGuardCandidate(envelope) {
  const source = envelope.source;
  return {
    candidate_id: `mrg_${envelope.envelope_id.slice(4)}`,
    scope: envelope.scope,
    semantic_key: `${envelope.subject_ref ?? "no_subject"}_profile_control`,
    record_class: envelope.classification.record_class,
    claim_class: envelope.classification.claim_class,
    review_state: envelope.classification.review_state,
    container_tag: envelope.container_tag,
    effective_at: source.observed_at,
    source_locator: source.locator,
    provenance_ref: envelope.provenance_ref,
    sensitivity: envelope.governance.sensitivity
  };
}
