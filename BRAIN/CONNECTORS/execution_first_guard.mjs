export function evaluateExecutionFirstCompletion(packet, control) {
  const reasons = [];
  const prohibited = new Set(control?.completion_states?.prohibited_handoffs ?? []);
  const allowed = new Set(control?.completion_states?.allowed ?? []);
  const requiredReceiptFields = control?.required_receipt_fields ?? [];
  const stopBoundaries = new Set(control?.stop_boundaries ?? []);

  if (!packet || typeof packet !== "object") {
    return { compliant: false, reasons: ["packet_missing"] };
  }

  if (!allowed.has(packet.completion_state) && !prohibited.has(packet.completion_state)) {
    reasons.push("completion_state_unknown");
  }

  const routineInternal = packet.action_class === "internal_reversible" && packet.authorized === true;
  if (routineInternal && packet.system_side_executable_remaining === true && prohibited.has(packet.completion_state)) {
    reasons.push("routine_review_handoff");
  }

  if (packet.partial_failure_count > 0 && packet.unaffected_work_continued !== true) {
    reasons.push("partial_failure_aborted_lane");
  }

  if (packet.operator_action_required === true && packet.system_side_executable_remaining === true) {
    reasons.push("operator_handoff_premature");
  }

  if (packet.completion_state === "blocked_exact") {
    if (!stopBoundaries.has(packet.stop_reason)) reasons.push("unsupported_stop_boundary");
    if (!packet.exact_blocker) reasons.push("exact_blocker_missing");
    if (!packet.nearest_completed_deliverable) reasons.push("nearest_completed_deliverable_missing");
  }

  if (packet.completion_state === "completed" || packet.completion_state === "partial_completed") {
    const receipt = packet.receipt;
    if (!receipt || typeof receipt !== "object") {
      reasons.push("completion_receipt_missing");
    } else {
      for (const field of requiredReceiptFields) {
        if (!(field in receipt)) reasons.push(`receipt_field_missing:${field}`);
      }
    }
  }

  return {
    compliant: reasons.length === 0,
    decision: reasons.length === 0 ? "execution_first_compliant" : "execution_first_rejected",
    reasons
  };
}
