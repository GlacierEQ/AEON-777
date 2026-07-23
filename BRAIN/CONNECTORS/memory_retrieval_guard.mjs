const REJECTED_STATES = new Set(["pending", "disputed", "quarantined", "superseded", "unknown"]);

function reject(candidate, reason) {
  return { candidate_id: candidate.candidate_id ?? "missing_candidate_id", reason };
}

function eligibility(candidate, request) {
  const required = ["candidate_id", "scope", "semantic_key", "record_class", "claim_class", "review_state", "container_tag", "effective_at"];
  if (required.some((field) => !candidate[field])) return "missing_required_status_or_routing_field";
  if (candidate.scope !== request.scope) return "scope_mismatch";
  if (candidate.container_tag !== request.container_tag) return "cross_container_leakage";
  if (candidate.sensitivity === "sealed") return "sealed_content_not_retrievable";
  if (REJECTED_STATES.has(candidate.review_state)) return `review_state_${candidate.review_state}`;
  if (!candidate.source_locator || !candidate.provenance_ref) return "missing_source_or_provenance";

  if (candidate.record_class === "correction_overlay") {
    return candidate.review_state === "applied_correction" && candidate.claim_class === "correction_rule"
      ? null
      : "invalid_correction_state";
  }
  if (candidate.record_class === "source_fact") {
    return candidate.review_state === "verified" && candidate.claim_class === "documented_source_statement"
      ? null
      : "unqualified_source_fact";
  }
  return "record_class_not_promotable";
}

function rank(candidate) {
  const classScore = candidate.record_class === "correction_overlay" ? 300 : 200;
  return classScore + Date.parse(candidate.effective_at) / 1e13;
}

export function guardRecall(request, candidates, generatedAt = new Date().toISOString()) {
  const rejected = [];
  const eligible = [];
  for (const candidate of candidates) {
    const reason = eligibility(candidate, request);
    if (reason) rejected.push(reject(candidate, reason));
    else eligible.push(candidate);
  }

  const promoted = [];
  for (const semanticKey of [...new Set(eligible.map((item) => item.semantic_key))].sort()) {
    const group = eligible.filter((item) => item.semantic_key === semanticKey);
    const corrections = group.filter((item) => item.record_class === "correction_overlay");
    const facts = group.filter((item) => item.record_class === "source_fact");
    const factDigests = new Set(facts.map((item) => item.assertion_digest).filter(Boolean));

    if (!corrections.length && factDigests.size > 1) {
      for (const item of group) rejected.push(reject(item, "conflicting_verified_candidates_fail_closed"));
      continue;
    }

    group.sort((a, b) => rank(b) - rank(a) || a.candidate_id.localeCompare(b.candidate_id));
    const selected = group[0];
    promoted.push({
      candidate_id: selected.candidate_id,
      scope: selected.scope,
      semantic_key: selected.semantic_key,
      output_class: selected.record_class === "correction_overlay" ? "qualified_correction_rule" : "source_linked_fact",
      source_locator: selected.source_locator,
      provenance_ref: selected.provenance_ref
    });
    for (const item of group.slice(1)) rejected.push(reject(item, "lower_precedence_qualified_candidate"));
  }

  rejected.sort((a, b) => a.candidate_id.localeCompare(b.candidate_id));
  return {
    schema_version: "1.0.0",
    generated_at: generatedAt,
    request: { scope: request.scope, container_tag: request.container_tag },
    decision: promoted.length ? "qualified_output" : "fail_closed",
    promoted,
    rejected,
    raw_content_persisted: false
  };
}
