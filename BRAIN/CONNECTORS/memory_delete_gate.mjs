export function evaluatePhysicalDeleteRequest(request, capabilityProbe) {
  const reasons = [];
  if (request.namespace !== capabilityProbe.namespace) reasons.push("namespace_mismatch");
  if (!request.stable_target_id) reasons.push("stable_target_id_missing");
  if (!capabilityProbe.graph_observation.document_ids_exposed &&
      !capabilityProbe.graph_observation.chunk_ids_exposed) {
    reasons.push("addressable_backend_id_unavailable");
  }
  if (!capabilityProbe.mutation_interface.delete_by_id_supported) reasons.push("delete_by_id_unsupported");
  if (!request.immutable_receipt_required) reasons.push("immutable_receipt_not_required");
  if (!request.negative_recall_required) reasons.push("negative_recall_not_required");

  return {
    executable: reasons.length === 0,
    action: reasons.length === 0 ? "physical_delete" : "retain_logical_tombstone",
    reasons
  };
}
