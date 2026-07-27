export function applyMemoryTombstones(candidates, registry) {
  const active = new Map(
    registry.entries
      .filter((entry) => entry.logical_delete_active && entry.retrieval_action === "reject_by_idempotency_key")
      .map((entry) => [`${entry.namespace}|${entry.idempotency_key}`, entry])
  );
  const eligible = [];
  const rejected = [];
  for (const candidate of candidates) {
    const namespaces = [...new Set([candidate.namespace, candidate.container_tag].filter(Boolean))];
    if (namespaces.length === 0 || !candidate.idempotency_key) {
      rejected.push({ candidate_id: candidate.candidate_id, reason: "missing_required_status_or_routing_field" });
      continue;
    }
    const tombstone = namespaces
      .map((namespace) => active.get(`${namespace}|${candidate.idempotency_key}`))
      .find(Boolean);
    if (tombstone) {
      rejected.push({ candidate_id: candidate.candidate_id, reason: "logical_tombstone", tombstone_id: tombstone.tombstone_id });
    } else if (namespaces.length > 1) {
      rejected.push({ candidate_id: candidate.candidate_id, reason: "cross_container_leakage" });
    } else {
      eligible.push(candidate);
    }
  }
  return { eligible, rejected };
}
