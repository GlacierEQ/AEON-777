import crypto from "node:crypto";
import fs from "node:fs";
import { guardRecall } from "./memory_retrieval_guard.mjs";
import { applyMemoryTombstones } from "./memory_tombstone_filter.mjs";

const HASH = /^[a-f0-9]{64}$/;
const VERSION = /^[0-9]+\.[0-9]+\.[0-9]+$/;
const tombstoneRegistry = JSON.parse(fs.readFileSync(new URL("./MEMORY_TOMBSTONE_REGISTRY.json", import.meta.url), "utf8"));

function deriveTrustedIdempotencyKey(probe) {
  if (probe.idempotency_key !== undefined) throw new Error("caller supplied idempotency key is untrusted");
  const inputs = [probe.record_class, probe.source_version, probe.payload_sha256];
  if (inputs.every((value) => value === undefined)) return undefined;
  if (typeof probe.record_class !== "string" || probe.record_class.length < 3 ||
      !VERSION.test(probe.source_version ?? "") || !HASH.test(probe.payload_sha256 ?? "")) {
    throw new Error("incomplete trusted idempotency inputs");
  }
  return crypto.createHash("sha256").update([
    probe.connector,
    probe.container_tag,
    probe.record_class,
    probe.source_version,
    probe.payload_sha256
  ].join("|")).digest("hex");
}

export function consumeMemoryArchitectureStatus(probe, generatedAt = new Date().toISOString()) {
  if (!probe || probe.connector !== "supermemory") throw new Error("unsupported connector");
  if (probe.container_tag !== "sm_project_memory_master") throw new Error("unexpected memory container");
  if (!HASH.test(probe.query_sha256) || !HASH.test(probe.response_sha256)) throw new Error("invalid probe digest");
  if (!Number.isInteger(probe.content_block_count) || probe.content_block_count < 1) throw new Error("empty connector response");
  if (probe.status !== "success") throw new Error("connector probe was not successful");
  const trustedIdempotencyKey = deriveTrustedIdempotencyKey(probe);

  const request = { scope: "memory_architecture", container_tag: "sm_project_memory_master" };
  const candidates = [
    {
      candidate_id: `mrg_live_payload_${probe.response_sha256.slice(0, 12)}`,
      scope: request.scope,
      semantic_key: "memory_architecture_current_status",
      record_class: "connector_payload",
      claim_class: "unknown",
      review_state: "unknown",
      container_tag: request.container_tag,
      effective_at: generatedAt,
      source_locator: null,
      provenance_ref: null,
      sensitivity: "restricted",
      idempotency_key: trustedIdempotencyKey
    },
    {
      candidate_id: "mrg_memory_architecture_canonical_status",
      scope: request.scope,
      semantic_key: "memory_architecture_current_status",
      record_class: "source_fact",
      claim_class: "documented_source_statement",
      review_state: "verified",
      container_tag: request.container_tag,
      effective_at: generatedAt,
      source_locator: "github://GlacierEQ/AEON-777@10e7cf6f6511885c1d772eb9e3627ba284dc1fe5/BRAIN/CONNECTORS/MEMORY_ARCHITECTURE_STATUS.md",
      provenance_ref: "github://GlacierEQ/AEON-777/BRAIN/CONNECTORS/MEMORY_ARCHITECTURE_LIVE_CONSUMER_RECEIPT_2026-07-19.json",
      sensitivity: "restricted"
    }
  ];

  const tombstoneResult = applyMemoryTombstones(candidates, tombstoneRegistry);
  const guardReceipt = guardRecall(request, tombstoneResult.eligible, generatedAt);
  guardReceipt.rejected.push(...tombstoneResult.rejected);
  return {
    schema_version: "1.0.0",
    thread_anchor: "MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51",
    generated_at: generatedAt,
    connector: "supermemory",
    consumer: "memory_architecture_status",
    live_probe: {
      container_tag: probe.container_tag,
      query_sha256: probe.query_sha256,
      response_sha256: probe.response_sha256,
      content_block_count: probe.content_block_count,
      status: probe.status
    },
    normalization: {
      raw_payload_candidates: 1,
      raw_payload_promoted: guardReceipt.promoted.filter((item) => item.candidate_id.startsWith("mrg_live_payload_")).length,
      canonical_pointer_candidates: 1,
      raw_content_persisted: false
    },
    guard_receipt: guardReceipt
  };
}
