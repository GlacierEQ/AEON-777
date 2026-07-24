export function applyMemoryTombstones(candidates, registry) {
  const active = new Map(
    registry.entries
      .filter((entry) => entry.logical_delete_active && entry.retrieval_action === "reject_by_idempotency_key")
      .map((entry) => [`${entry.namespace}|${entry.idempotency_key}`, entry])
  );
  const eligible = [];
  const rejected = [];
  for (const candidate of candidates) {
    const key = `${candidate.namespace}|${candidate.idempotency_key}`;
    const tombstone = active.get(key);
    if (tombstone) {
      rejected.push({ candidate_id: candidate.candidate_id, reason: "logical_tombstone", tombstone_id: tombstone.tombstone_id });
    } else {
      eligible.push(candidate);
    }
  }
  return { eligible, rejected };
}
