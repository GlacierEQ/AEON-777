import fs from "node:fs";
import { evaluateWisebaseCandidate } from "./wisebase_retrieval_guard.mjs";

const readText = (name) => fs.readFileSync(new URL(name, import.meta.url), "utf8");
const control = JSON.parse(readText("./WISEBASE_RETRIEVAL_CONTROL.json"));
const protocol = readText("./WISEBASE_RETRIEVAL_CONTROL.md");
const readme = readText("./README.md");

if (control.status !== "operative") throw new Error("Wisebase retrieval control is not operative");
if (control.authority.wisebase_role !== "candidate_retrieval_and_historical_research_plane") {
  throw new Error("Wisebase authority drifted from governed retrieval and historical research");
}
if (!control.witness_journal_policy.first_person_account_is_evidence_bearing_source) {
  throw new Error("first-person witness authority is not preserved");
}
if (!control.witness_journal_policy.missing_connector_access_is_not_absence) {
  throw new Error("missing connector support was permitted to become factual negation");
}
for (const phrase of [
  "Legacy raw preservation doctrine",
  "Preserve first",
  "Candidate evidence only",
  "Restricted material fails closed for exposure and promotion, not retention",
  "Project identities remain separate",
  "Similarity is not duplication",
  "Supersession is append-only"
]) {
  if (!protocol.includes(phrase)) throw new Error(`Wisebase protocol missing rule: ${phrase}`);
}
if (!readme.includes("WISEBASE_RETRIEVAL_CONTROL.md")) {
  throw new Error("README does not route workers through Wisebase retrieval control");
}

const baseCandidate = {
  candidate_id: "synthetic://wisebase/candidate/1",
  query: "1FDV-23-0001009 Dkt 191 193 NEF timestamps",
  query_profile: "legal_record",
  exact_anchor_count: 4,
  source_name: "certified-record.pdf",
  source_pointer: "source://certified-record/pages/128-140",
  raw_preservation_pointer: "source://certified-record/original",
  source_retention_decision: "preserve_raw",
  legacy_source: false,
  captured_at: "2026-07-29T10:00:00Z",
  moment_context_status: "not_required_for_nonlegacy_source",
  speaker_attribution: "official-record",
  personal_knowledge_scope: "official-record-content",
  support_state: "corroborated",
  claimed_additional_support: false,
  journal_series_id: null,
  occurrence_count: 1,
  event_vectors: null,
  truth_class: "verified_source_fact",
  sensitivity: "confidential",
  proposition: "Dkt. 191 and Dkt. 193 were entered one minute apart",
  current_or_historical: "historical",
  mutable_state: false,
  current_run_receipt: null,
  last_verified_at: "2026-07-29T10:00:00Z",
  contradictions: [],
  promotion_decision: "promote",
  supersession_pointer: null,
  rewrite_source: false,
  deletion_requested: false,
  duplicate_action: "none",
  exact_hash_verified: false,
  project_identity_action: "none",
  source_proven_relationship: false,
  remaining_gate: null,
  restricted_content_classes: [],
  support_basis: "source_linked"
};

const valid = evaluateWisebaseCandidate(baseCandidate, control);
if (!valid.compliant) throw new Error(`valid source-linked candidate rejected: ${valid.reasons}`);

const legacyRaw = evaluateWisebaseCandidate({
  ...baseCandidate,
  candidate_id: "synthetic://wisebase/candidate/legacy",
  query: "legacy export 2025 AEON strategy evolution",
  query_profile: "historical_evolution",
  exact_anchor_count: 3,
  source_name: "legacy-chat-export.pdf",
  source_pointer: "source://legacy-chat-export/passage/42",
  raw_preservation_pointer: "source://legacy-chat-export/original",
  legacy_source: true,
  captured_at: "2025-06-25T18:36:00-07:00",
  moment_context_status: "captured_with_available_evidence_model_state_and_emotional_register",
  speaker_attribution: "casey",
  personal_knowledge_scope: "in-the-moment-account-and-theory",
  support_state: "support_not_currently_loaded",
  claimed_additional_support: true,
  truth_class: "hypothesis",
  proposition: "In-the-moment symbolic and strategic theory",
  promotion_decision: "hold",
  last_verified_at: null,
  support_basis: "historical_context"
}, control);
if (!legacyRaw.compliant) throw new Error(`legacy raw preservation rejected: ${legacyRaw.reasons}`);
if (legacyRaw.source_disposition !== "preserve_raw") throw new Error("legacy raw source was not preserved");

const witness = evaluateWisebaseCandidate({
  ...baseCandidate,
  candidate_id: "synthetic://wisebase/candidate/witness",
  query: "Casey March 27 2025 repeated chat journal court event",
  query_profile: "witness_journal",
  exact_anchor_count: 4,
  source_name: "chat-thread",
  source_pointer: "chat://thread/entry/3",
  raw_preservation_pointer: "chat://thread/raw",
  captured_at: "2025-03-27T12:00:00-10:00",
  moment_context_status: "preserved",
  speaker_attribution: "casey",
  personal_knowledge_scope: "personally_perceived_and_experienced",
  support_state: "support_inaccessible_current_run",
  claimed_additional_support: true,
  journal_series_id: "journal://series/march-27-event",
  occurrence_count: 5,
  event_vectors: {
    who: "casey-and-institution",
    what: "reported-event",
    when: "2025-03-27",
    where: "court",
    communication_channel: "chat-journal"
  },
  truth_class: "first_person_witness_statement",
  proposition: "Casey's firsthand account of the event",
  promotion_decision: "hold",
  last_verified_at: null,
  support_basis: "first_person_source"
}, control);
if (!witness.compliant) throw new Error(`valid witness candidate rejected: ${witness.reasons}`);
if (witness.support_disposition !== "support_gap_not_factual_negation") {
  throw new Error("witness support gap became factual negation");
}
if (witness.repetition_disposition !== "longitudinal_thread_required") {
  throw new Error("repeated witness account did not require longitudinal thread");
}

const discardWitness = evaluateWisebaseCandidate({
  ...witness,
  candidate_id: "synthetic://wisebase/candidate/witness-discard",
  promotion_decision: "discard"
}, control);
if (
  discardWitness.compliant ||
  !discardWitness.reasons.includes("witness_discard_for_missing_corroboration_prohibited")
) {
  throw new Error("discard of witness account for missing connected corroboration was not rejected");
}

const witnessNoSeries = evaluateWisebaseCandidate({
  ...witness,
  candidate_id: "synthetic://wisebase/candidate/witness-no-series",
  journal_series_id: null
}, control);
if (
  witnessNoSeries.compliant ||
  !witnessNoSeries.reasons.includes("witness_repetition_series_missing")
) {
  throw new Error("repeated witness account without journal series was not rejected");
}

const broad = evaluateWisebaseCandidate({
  ...baseCandidate,
  candidate_id: "synthetic://wisebase/candidate/broad",
  query: "memory architecture",
  query_profile: "architecture",
  exact_anchor_count: 0,
  broad_query_unsplit: true,
  promotion_decision: "hold"
}, control);
if (broad.compliant || !broad.reasons.includes("broad_architecture_query_unsplit")) {
  throw new Error("unsplit broad architecture query was not rejected");
}

const restrictedPromotion = evaluateWisebaseCandidate({
  ...baseCandidate,
  candidate_id: "synthetic://wisebase/candidate/restricted",
  restricted_content_classes: ["credential"],
  source_retention_decision: "preserve_restricted",
  promotion_decision: "promote"
}, control);
if (
  restrictedPromotion.compliant ||
  !restrictedPromotion.reasons.includes("restricted_content_promotion_attempt")
) {
  throw new Error("restricted-content promotion was not rejected");
}
if (restrictedPromotion.source_disposition !== "preserve_restricted") {
  throw new Error("restricted source was not preserved despite failed promotion");
}

const deletionAttempt = evaluateWisebaseCandidate({
  ...legacyRaw,
  candidate_id: "synthetic://wisebase/candidate/delete-attempt",
  deletion_requested: true
}, control);
if (
  deletionAttempt.compliant ||
  !deletionAttempt.reasons.includes("legacy_source_deletion_prohibited")
) {
  throw new Error("legacy deletion attempt was not rejected");
}

const mutableWithoutReceipt = evaluateWisebaseCandidate({
  ...baseCandidate,
  candidate_id: "synthetic://wisebase/candidate/runtime",
  truth_class: "runtime_state",
  proposition: "connector is currently active",
  mutable_state: true,
  current_run_receipt: null,
  promotion_decision: "promote"
}, control);
if (
  mutableWithoutReceipt.compliant ||
  !mutableWithoutReceipt.reasons.includes("mutable_state_receipt_missing")
) {
  throw new Error("mutable-state promotion without a receipt was not rejected");
}

const duplicateWithoutHash = evaluateWisebaseCandidate({
  ...baseCandidate,
  candidate_id: "synthetic://wisebase/candidate/duplicate",
  promotion_decision: "hold",
  duplicate_action: "consolidate",
  exact_hash_verified: false
}, control);
if (
  duplicateWithoutHash.compliant ||
  !duplicateWithoutHash.reasons.includes("duplicate_consolidation_without_exact_hash")
) {
  throw new Error("duplicate consolidation without exact hash was not rejected");
}

const identityMerge = evaluateWisebaseCandidate({
  ...baseCandidate,
  candidate_id: "synthetic://wisebase/candidate/identity",
  proposition: "Megamind and Mastermind are the same project",
  promotion_decision: "hold",
  project_identity_action: "merge",
  source_proven_relationship: false
}, control);
if (
  identityMerge.compliant ||
  !identityMerge.reasons.includes("project_identity_merge_without_source_proof")
) {
  throw new Error("unsupported project-identity merge was not rejected");
}

for (const supportBasis of ["relevance_only", "repetition_only"]) {
  const weakPromotion = evaluateWisebaseCandidate({
    ...baseCandidate,
    candidate_id: `synthetic://wisebase/candidate/${supportBasis}`,
    support_basis: supportBasis
  }, control);
  if (weakPromotion.compliant) throw new Error(`${supportBasis} promotion was not rejected`);
}

console.log(
  "PASS: Wisebase preserves legacy raw and firsthand witness sources, treats inaccessible support as a support gap, links repeated journal entries longitudinally, and independently enforces promotion, restriction, receipt, duplicate, and project-identity gates"
);
