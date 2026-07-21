import { guardRecall } from "./memory_retrieval_guard.mjs";
import { envelopeToGuardCandidate } from "./typed_candidate_normalizer.mjs";

const HASH = /^[a-f0-9]{64}$/;

export function consumeActorProfile(probe, control, generatedAt = new Date().toISOString()) {
  if (!probe || probe.connector !== "supermemory" || probe.status !== "success") throw new Error("invalid connector probe");
  if (probe.container_tag !== "sm_project_judge_shaw") throw new Error("unexpected actor container");
  if (!HASH.test(probe.query_sha256) || !HASH.test(probe.response_sha256)) throw new Error("invalid probe digest");
  if (!Number.isInteger(probe.content_block_count) || probe.content_block_count < 1) throw new Error("empty connector response");
  if (control.actor_id !== "actor-judge-natasha-shaw") throw new Error("unexpected actor control pointer");
  if (control.profile_status !== "conflict_review" || control.identity_status !== "conflicted") throw new Error("actor qualification drift");
  if (!control.source_locator || !control.source_version || !control.provenance_ref) throw new Error("incomplete canonical actor pointer");

  const envelopes = [
    {
      schema_version: "1.0.0",
      envelope_id: `env_actor_live_${probe.response_sha256.slice(0, 12)}`,
      connector_id: "supermemory",
      consumer_id: "actor_profile_pointer",
      scope: "actor_profile",
      container_tag: probe.container_tag,
      subject_ref: control.actor_id,
      source: { kind: "connector_payload", locator: null, version: null, query_sha256: probe.query_sha256, response_sha256: probe.response_sha256, content_block_count: probe.content_block_count, observed_at: generatedAt },
      classification: { record_class: "connector_payload", claim_class: "unknown", review_state: "unknown" },
      governance: { sensitivity: "restricted", projection_mode: "reject", raw_content_persisted: false },
      provenance_ref: null
    },
    {
      schema_version: "1.0.0",
      envelope_id: "env_actor_canonical_control",
      connector_id: "github",
      consumer_id: "actor_profile_pointer",
      scope: "actor_profile",
      container_tag: probe.container_tag,
      subject_ref: control.actor_id,
      source: { kind: "canonical_pointer", locator: control.source_locator, version: control.source_version, query_sha256: null, response_sha256: null, content_block_count: null, observed_at: generatedAt },
      classification: { record_class: "correction_overlay", claim_class: "correction_rule", review_state: "applied_correction" },
      governance: { sensitivity: "restricted", projection_mode: "pointer_only", raw_content_persisted: false },
      provenance_ref: control.provenance_ref
    }
  ];
  const guardReceipt = guardRecall({ scope: "actor_profile", container_tag: probe.container_tag }, envelopes.map(envelopeToGuardCandidate), generatedAt);
  return {
    schema_version: "1.0.0",
    thread_anchor: "MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51",
    generated_at: generatedAt,
    consumer: "actor_profile_pointer",
    subject: { actor_id: control.actor_id, profile_status: control.profile_status, identity_status: control.identity_status, projection_mode: "pointer_only" },
    candidate_envelopes: envelopes,
    guard_receipt: guardReceipt,
    raw_content_persisted: false
  };
}
