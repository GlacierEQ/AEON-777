import fs from "node:fs";

const path = new URL("./CONNECTOR_FABRIC.json", import.meta.url);
const registry = JSON.parse(fs.readFileSync(path, "utf8"));
const connector = registry.connectors.find((item) => item.connector_id === "supermemory");
if (!connector) throw new Error("supermemory connector is not registered");

const observedAt = "2026-07-20T17:58:08-10:00";
const receipt = "github://GlacierEQ/AEON-777/BRAIN/CONNECTORS/ACTOR_PROFILE_LIVE_CONSUMER_RECEIPT_2026-07-20.json";
registry.generated_at = observedAt;
connector.last_successful_probe = observedAt;
connector.freshness = {
  status: "fresh",
  evaluated_at: observedAt,
  max_age_hours: 24,
  reason: "Bounded recall from explicit actor container returned one text block; request and response digests are preserved without raw text."
};
connector.evidence.push("A bounded live actor-container recall succeeded on 2026-07-20; typed normalization rejected the raw payload and projected only a conflicted, pointer-only GitHub actor control.");
connector.provenance_coverage.evidence_refs = [...new Set([...connector.provenance_coverage.evidence_refs, receipt])];
connector.error_state = {
  status: "degraded",
  code: "MEMORY_BACKEND_UNSTRUCTURED_AND_LEGACY_GAPS",
  detail: "Actor-container output is unstructured at the connector boundary. Typed envelopes and the application guard prevent raw promotion, but backend source/version/review fields and raw 3/5 correction precedence remain unresolved.",
  observed_at: observedAt,
  receipt_uri: receipt
};
connector.next_gate = "Apply typed envelopes to a timeline/event consumer, approve namespaces and owner, and define deterministic write/retry/deletion receipts.";
connector.next_human_gate = connector.next_gate;
connector.connector_quality_components.freshness.evidence = ["2026-07-20 bounded actor-profile consumer probe receipt"];

fs.writeFileSync(path, `${JSON.stringify(registry, null, 2)}\n`);
console.log("Recorded typed actor-consumer probe; Supermemory quality remains connector 50 and data 0");
