import fs from "node:fs";
import { evaluateWitnessJournalEntry } from "./witness_journal_guard.mjs";

const readText = (name) => fs.readFileSync(new URL(name, import.meta.url), "utf8");
const control = JSON.parse(readText("./WITNESS_JOURNAL_EVIDENCE_CONTROL.json"));
const protocol = readText("./WITNESS_JOURNAL_EVIDENCE_CONTROL.md");
const readme = readText("./README.md");

if (control.status !== "operative") throw new Error("witness journal control is not operative");
if (control.authority.operator_first_person_account !== "evidence_bearing_source_material") {
  throw new Error("first-person account authority drifted");
}
if (!control.authority.regularly_kept_journal_has_direct_hre_803_b_6_route) {
  throw new Error("direct HRE 803(b)(6) journal route is not recognized");
}
for (const phrase of [
  "Casey's firsthand account is evidence-bearing source material",
  "Lack of access to corroborating files does not mean the account lacks support in reality",
  "A regularly kept journal is not merely a memory aid",
  "Hawaiʻi deliberately uses `regularly conducted activity`, not only `business activity`",
  "Repeated statements across contemporaneous chats do not receive zero weight",
  "Preserve emotional intensity",
  "The system must not discard the first-person observation"
]) {
  if (!protocol.includes(phrase)) throw new Error(`witness journal protocol missing rule: ${phrase}`);
}
if (!readme.includes("WITNESS_JOURNAL_EVIDENCE_CONTROL.md")) {
  throw new Error("README does not route workers through witness journal control");
}

const vectors = {
  who: "casey-and-institution",
  what: "reported procedural event",
  when: "2025-03-27",
  where: "first-circuit-family-court",
  communication_channel: "chat-journal",
  institution_or_system: "court",
  procedural_stage: "motion-hearing",
  related_document_or_recording: "pointer://recording",
  action_or_omission: "reported-event",
  consequence_or_harm: "reported-consequence",
  evidence_type: "first-person-contemporaneous-account",
  support_status: "support_inaccessible_current_run",
  later_corroboration_pointer: null,
  contradiction_pointer: null
};

const series = {
  journal_series_id: "journal://series/procedural-event",
  occurrence_index: 3,
  occurrence_count: 5,
  first_seen_at: "2025-03-27T12:00:00-10:00",
  last_seen_at: "2025-04-10T12:00:00-10:00",
  cross_chat_consistency: "materially_consistent",
  material_evolution: "additional_detail_added",
  correction_overlay_pointer: null,
  salience: "elevated"
};

const regularActivityFoundation = {
  regularly_conducted_activity: "ongoing recording of material events and procedural developments",
  regular_practice_description: "Casey regularly records events and concerns through chats and linked journal derivatives",
  practice_start_date: "2023-01-01",
  practice_frequency: "recurring and event-driven",
  recording_method: "timestamped chat entries preserved in platform conversation history",
  made_at_or_near_time: true,
  person_with_knowledge: "casey",
  author_or_adopter: "casey",
  custodian_or_qualified_witness: "casey",
  reliance_on_records: "used to track chronology, filings, communications, and later evidence",
  continuity_and_gaps: "series preserves occurrence dates and any gaps",
  trustworthiness_factors: "timestamps, repeated practice, preserved raw source, append-only corrections, and speaker attribution",
  authentication_method: "Casey testimony plus native conversation metadata and source pointers",
  rule_902_11_certification_status: "available_if_procedurally_appropriate",
  source_integrity_and_hash_status: "native-source pointers preserved; exact hashes pending where export occurs",
  raw_to_derivative_chain: "raw chat -> journal chronology -> evidentiary packet"
};

const baseEntry = {
  entry_id: "journal://entry/1",
  witness_id: "casey",
  source_pointer: "chat://conversation/entry/1",
  raw_source_preserved: true,
  captured_at: "2025-03-27T12:00:00-10:00",
  speaker_attribution: "casey",
  statement_class: "first_person_observation",
  statement_pointer: "chat://conversation/entry/1#statement",
  personal_knowledge_scope: "personally_perceived_and_experienced",
  support_state: "support_inaccessible_current_run",
  claimed_additional_support: true,
  historical_voice_preserved: true,
  assistant_text_separated: true,
  event_vectors: vectors,
  journal_series: series,
  regular_activity_foundation: regularActivityFoundation,
  correction_overlay_pointer: null,
  derivative_pointers: ["journal://chronology/entry/1"],
  deletion_requested: false,
  rewrite_source: false,
  strip_emotional_language: false,
  discard_due_to_uncorroborated: false,
  legal_use_status: "hre_803_b_6_regularly_conducted_activity",
  deny_hre_803_b_6_route: false,
  business_only_rule: false,
  remaining_gate: "load_additional_support"
};

const valid = evaluateWitnessJournalEntry(baseEntry, control);
if (!valid.compliant) throw new Error(`valid witness journal entry rejected: ${valid.reasons}`);
if (valid.source_disposition !== "preserve_raw") throw new Error("valid witness source not preserved");
if (valid.support_disposition !== "support_gap_not_factual_negation") {
  throw new Error("missing connected support was treated as factual negation");
}
if (valid.repetition_disposition !== "longitudinal_thread_required") {
  throw new Error("repeated issue did not require longitudinal thread");
}
if (valid.admissibility_disposition !== "direct_hre_803_b_6_route_foundation_complete") {
  throw new Error("complete regularly conducted activity foundation was not recognized");
}

const incompleteFoundation = evaluateWitnessJournalEntry({
  ...baseEntry,
  entry_id: "journal://entry/incomplete-foundation",
  regular_activity_foundation: {
    ...regularActivityFoundation,
    made_at_or_near_time: false
  }
}, control);
if (
  incompleteFoundation.compliant ||
  !incompleteFoundation.reasons.includes("hre_803_b_6_near_time_foundation_incomplete")
) {
  throw new Error("incomplete HRE 803(b)(6) foundation was not identified");
}
if (incompleteFoundation.admissibility_disposition !== "direct_hre_803_b_6_route_foundation_incomplete") {
  throw new Error("foundation gap incorrectly destroyed the HRE 803(b)(6) route");
}

const deniedRoute = evaluateWitnessJournalEntry({
  ...baseEntry,
  entry_id: "journal://entry/deny-route",
  deny_hre_803_b_6_route: true
}, control);
if (deniedRoute.compliant || !deniedRoute.reasons.includes("hre_803_b_6_route_denial_prohibited")) {
  throw new Error("denial of the direct journal admissibility route was not rejected");
}

const businessOnly = evaluateWitnessJournalEntry({
  ...baseEntry,
  entry_id: "journal://entry/business-only",
  business_only_rule: true
}, control);
if (businessOnly.compliant || !businessOnly.reasons.includes("business_only_limitation_prohibited")) {
  throw new Error("business-only limitation was not rejected");
}

const discard = evaluateWitnessJournalEntry({
  ...baseEntry,
  entry_id: "journal://entry/discard",
  discard_due_to_uncorroborated: true
}, control);
if (discard.compliant || !discard.reasons.includes("firsthand_account_discard_prohibited")) {
  throw new Error("discard of uncorroborated firsthand account was not rejected");
}

const stripped = evaluateWitnessJournalEntry({
  ...baseEntry,
  entry_id: "journal://entry/stripped",
  strip_emotional_language: true
}, control);
if (stripped.compliant || !stripped.reasons.includes("historical_voice_stripping_prohibited")) {
  throw new Error("historical voice stripping was not rejected");
}

const noSeries = evaluateWitnessJournalEntry({
  ...baseEntry,
  entry_id: "journal://entry/no-series",
  journal_series: {
    ...series,
    journal_series_id: null
  }
}, control);
if (noSeries.compliant || !noSeries.reasons.includes("repeated_issue_missing_series_id")) {
  throw new Error("repeated issue without longitudinal series was not rejected");
}

const lowSalience = evaluateWitnessJournalEntry({
  ...baseEntry,
  entry_id: "journal://entry/low-salience",
  journal_series: {
    ...series,
    salience: "normal"
  }
}, control);
if (lowSalience.compliant || !lowSalience.reasons.includes("repeated_issue_salience_not_elevated")) {
  throw new Error("repeated issue without elevated salience was not rejected");
}

const assistantMisattribution = evaluateWitnessJournalEntry({
  ...baseEntry,
  entry_id: "journal://entry/assistant",
  statement_class: "model_analysis",
  speaker_attribution: "casey"
}, control);
if (
  assistantMisattribution.compliant ||
  !assistantMisattribution.reasons.includes("assistant_analysis_misattributed_to_witness")
) {
  throw new Error("assistant analysis misattribution was not rejected");
}

const automaticWithoutFoundation = evaluateWitnessJournalEntry({
  ...baseEntry,
  entry_id: "journal://entry/automatic",
  legal_use_status: "automatically_admitted_without_foundation"
}, control);
if (
  automaticWithoutFoundation.compliant ||
  !automaticWithoutFoundation.reasons.includes("unsupported_legal_use_status")
) {
  throw new Error("automatic admission without foundation was not rejected");
}

console.log(
  "PASS: witness journal control recognizes the direct HRE 803(b)(6) route for a regularly kept journal, enforces foundation and trustworthiness fields, preserves Casey's firsthand account and emotional detail, treats inaccessible support as a support gap, links repeated chats longitudinally, and keeps speaker attribution exact"
);
