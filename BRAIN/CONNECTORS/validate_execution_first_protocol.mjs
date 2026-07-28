import fs from "node:fs";
import { evaluateExecutionFirstCompletion } from "./execution_first_guard.mjs";

const readText = (name) => fs.readFileSync(new URL(name, import.meta.url), "utf8");
const control = JSON.parse(readText("./EXECUTION_FIRST_CONTROL.json"));
const protocol = readText("./EXECUTION_FIRST_OPERATING_PROTOCOL.md");
const readme = readText("./README.md");

if (control.status !== "operative") throw new Error("execution-first control is not operative");
if (control.authority_scope !== "internal_reversible_previously_authorized") {
  throw new Error("execution-first authority scope drifted");
}
for (const phrase of [
  "No routine review handoff",
  "Continue through partial failure",
  "Never transfer system supervision back to the operator",
  "Use receipts, not confidence language"
]) {
  if (!protocol.includes(phrase)) throw new Error(`protocol missing required rule: ${phrase}`);
}
if (!readme.includes("EXECUTION_FIRST_OPERATING_PROTOCOL.md")) {
  throw new Error("README does not route workers through the execution-first protocol");
}

const completeReceipt = {
  work_item: "synthetic-control",
  action_class: "internal_reversible",
  authority_source: "operator_directive",
  operation_performed: "synthetic mutation",
  result: "success",
  evidence_reference: "synthetic://receipt/1",
  verified_at: "2026-07-28T13:30:00Z",
  remaining_blocker: null,
  next_executable_step: "none",
  operator_action_required: false
};

const completed = evaluateExecutionFirstCompletion({
  action_class: "internal_reversible",
  authorized: true,
  completion_state: "completed",
  system_side_executable_remaining: false,
  partial_failure_count: 0,
  unaffected_work_continued: true,
  operator_action_required: false,
  receipt: completeReceipt
}, control);
if (!completed.compliant) throw new Error(`valid completion rejected: ${completed.reasons}`);

const reviewHandoff = evaluateExecutionFirstCompletion({
  action_class: "internal_reversible",
  authorized: true,
  completion_state: "ready_for_review",
  system_side_executable_remaining: true,
  partial_failure_count: 0,
  unaffected_work_continued: true,
  operator_action_required: true
}, control);
if (reviewHandoff.compliant || !reviewHandoff.reasons.includes("routine_review_handoff")) {
  throw new Error("routine review handoff was not rejected");
}
if (!reviewHandoff.reasons.includes("operator_handoff_premature")) {
  throw new Error("premature operator handoff was not rejected");
}

const partialCompleted = evaluateExecutionFirstCompletion({
  action_class: "internal_reversible",
  authorized: true,
  completion_state: "partial_completed",
  system_side_executable_remaining: false,
  partial_failure_count: 1,
  unaffected_work_continued: true,
  operator_action_required: false,
  receipt: {
    ...completeReceipt,
    result: "partial_success",
    remaining_blocker: "one connector unavailable"
  }
}, control);
if (!partialCompleted.compliant) throw new Error(`valid partial completion rejected: ${partialCompleted.reasons}`);

const abortedOnPartial = evaluateExecutionFirstCompletion({
  action_class: "internal_reversible",
  authorized: true,
  completion_state: "partial_completed",
  system_side_executable_remaining: true,
  partial_failure_count: 1,
  unaffected_work_continued: false,
  operator_action_required: true,
  receipt: completeReceipt
}, control);
if (abortedOnPartial.compliant || !abortedOnPartial.reasons.includes("partial_failure_aborted_lane")) {
  throw new Error("partial-failure lane abort was not rejected");
}

const exactBlocker = evaluateExecutionFirstCompletion({
  action_class: "external_irreversible",
  authorized: false,
  completion_state: "blocked_exact",
  system_side_executable_remaining: false,
  partial_failure_count: 0,
  unaffected_work_continued: true,
  operator_action_required: true,
  stop_reason: "irreversible_external_action_without_authority",
  exact_blocker: "authority not granted",
  nearest_completed_deliverable: "complete bounded package"
}, control);
if (!exactBlocker.compliant) throw new Error(`valid exact blocker rejected: ${exactBlocker.reasons}`);

console.log("PASS: execution-first protocol rejects routine review handoffs, requires receipts, and continues through partial failure");
