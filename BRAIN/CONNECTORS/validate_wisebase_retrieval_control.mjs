import fs from "node:fs";
import { evaluateWisebaseCandidate } from "./wisebase_retrieval_guard.mjs";

const readText = (name) => fs.readFileSync(new URL(name, import.meta.url), "utf8");
const control = JSON.parse(readText("./WISEBASE_RETRIEVAL_CONTROL.json"));
const protocol = readText("./WISEBASE_RETRIEVAL_CONTROL.md");
const readme = readText("./README.md");

if (control.status !== "operative") throw new Error("Wisebase retrieval control is not operative");
if (control.authority.wisebase_role !== "candidate_retrieval_plane") {
  throw new Error("Wisebase authority drifted from candidate retrieval");
}
for (const phrase of [
  "Exact anchors first",
  "Candidate evidence only",
  "Restricted material fails closed",
  "Project identities remain separate",
  "Similarity is not duplication"
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
  truth_class: "verified_source_fact",
  sensitivity: "confidential",
  proposition: "Dkt. 191 and Dkt. 193 were entered one minute apart",
  current_or_historical: "historical",
  mutable_state: false,
  current_run_receipt: null,
  last_verified_at: "2026-07-29T10:00:00Z",
  contradictions: [],
  promotion_decision: "promote",
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
  promotion_decision: "promote"
}, control);
if (
  restrictedPromotion.compliant ||
  !restrictedPromotion.reasons.includes("restricted_content_promotion_attempt")
) {
  throw new Error("restricted-content promotion was not rejected");
}

const restrictedQuarantine = evaluateWisebaseCandidate({
  ...baseCandidate,
  candidate_id: "synthetic://wisebase/candidate/quarantine",
  truth_class: "unresolved",
  sensitivity: "restricted",
  restricted_content_classes: ["credential"],
  proposition: "restricted source family contains credential-bearing material",
  promotion_decision: "quarantine"
}, control);
if (!restrictedQuarantine.compliant) {
  throw new Error(`valid quarantine disposition rejected: ${restrictedQuarantine.reasons}`);
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
  "PASS: Wisebase retrieval control requires exact anchors, source-linked promotion, restricted-content quarantine, current receipts, exact-hash duplicate proof, and project-identity separation"
);
