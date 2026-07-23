import { guardRecall } from "./memory_retrieval_guard.mjs";
import { envelopeToGuardCandidate } from "./typed_candidate_normalizer.mjs";

const HASH = /^[a-f0-9]{64}$/;

export function consumeTimelineEvent(probe, control, generatedAt = new Date().toISOString()) {
  if (!probe || probe.connector !== "supermemory" || probe.status !== "success") throw new Error("invalid connector probe");
  if (probe.container_tag !== "sm_project_memory_master") throw new Error("unexpected timeline container");
  if (!HASH.test(probe.query_sha256) || !HASH.test(probe.response_sha256)) throw new Error("invalid probe digest");
  if (!Number.isInteger(probe.content_block_count) || probe.content_block_count < 1) throw new Error("empty connector response");
  if (control.event_id !== "memory-architecture-control-event-2026-07-21") throw new Error("unexpected control event");
  if (control.event_class !== "control_event" || control.evidentiary_status !== "non_evidentiary") throw new Error("event qualification drift");
  if (control.deadline_authorized !== false || control.legal_conclusion_authorized !== false) throw new Error("unsafe event authority");
  if (!control.source_locator || !control.source_version || !control.provenance_ref) throw new Error("incomplete canonical event pointer");

  const envelopes = [
    {
      schema_version: "1.0.0",
      envelope_id: `env_timeline_live_${probe.response_sha256.slice(0, 12)}`,
      connector_id: "supermemory",
      consumer_id: "timeline_event_pointer",
      scope: "timeline_event",
      container_tag: probe.container_tag,
      subject_ref: control.event_id,
      source: { kind: "connector_payload", locator: null, version: null, query_sha256: probe.query_sha256, response_sha256: probe.response_sha256, content_block_count: probe.content_block_count, observed_at: generatedAt },
      classification: { record_class: "connector_payload", claim_class: "unknown", review_state: "unknown" },
      governance: { sensitivity: "restricted", projection_mode: "reject", raw_content_persisted: false },
      provenance_ref: null
    },
    {
      schema_version: "1.0.0",
      envelope_id: "env_timeline_canonical_control",
      connector_id: "github",
      consumer_id: "timeline_event_pointer",
      scope: "timeline_event",
      container_tag: probe.container_tag,
      subject_ref: control.event_id,
      source: { kind: "canonical_pointer", locator: control.source_locator, version: control.source_version, query_sha256: null, response_sha256: null, content_block_count: null, observed_at: generatedAt },
      classification: { record_class: "correction_overlay", claim_class: "correction_rule", review_state: "applied_correction" },
      governance: { sensitivity: "internal", projection_mode: "pointer_only", raw_content_persisted: false },
      provenance_ref: control.provenance_ref
    }
  ];

  const guardReceipt = guardRecall({ scope: "timeline_event", container_tag: probe.container_tag }, envelopes.map(envelopeToGuardCandidate), generatedAt);
  return {
    schema_version: "1.0.0",
    thread_anchor: "MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51",
    generated_at: generatedAt,
    consumer: "timeline_event_pointer",
    event: {
      event_id: control.event_id,
      event_class: control.event_class,
      evidentiary_status: control.evidentiary_status,
      timeline_status: "pointer_only",
      deadline_authorized: false,
      legal_conclusion_authorized: false
    },
    candidate_envelopes: envelopes,
    guard_receipt: guardReceipt,
    raw_content_persisted: false
  };
}
