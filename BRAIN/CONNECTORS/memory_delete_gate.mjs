export function evaluatePhysicalDeleteRequest(request, capabilityProbe) {
  const reasons = [];
  if (request.namespace !== capabilityProbe.namespace) reasons.push("namespace_mismatch");
  if (!request.stable_target_id) reasons.push("stable_target_id_missing");
  if (!capabilityProbe.graph_observation.document_ids_exposed &&
      !capabilityProbe.graph_observation.chunk_ids_exposed) {
    reasons.push("addressable_backend_id_unavailable");
  }
  if (!capabilityProbe.mutation_interface.delete_by_id_supported) reasons.push("delete_by_id_unsupported");

  const receipt = request.deletion_evidence?.immutable_receipt;
  const receiptVerified = receipt?.verified === true && receipt?.immutable === true &&
    receipt?.namespace === request.namespace && receipt?.target_id === request.stable_target_id;
  if (!receiptVerified) reasons.push("immutable_deletion_receipt_unverified");

  const negativeRecall = request.deletion_evidence?.negative_recall;
  const negativeRecallVerified = negativeRecall?.verified === true && negativeRecall?.result === "not_found" &&
    negativeRecall?.namespace === request.namespace && negativeRecall?.target_id === request.stable_target_id;
  if (!negativeRecallVerified) reasons.push("negative_recall_unverified");

  return {
    executable: reasons.length === 0,
    action: reasons.length === 0 ? "physical_delete" : "retain_logical_tombstone",
    reasons
  };
}
