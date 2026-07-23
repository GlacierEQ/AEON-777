import fs from "node:fs";

const path = new URL("./CONNECTOR_FABRIC.json", import.meta.url);
const registry = JSON.parse(fs.readFileSync(path, "utf8"));
const connector = registry.connectors.find((item) => item.connector_id === "supermemory");
if (!connector) throw new Error("supermemory connector is not registered");

const observedAt = "2026-07-19T17:52:41-10:00";
const receipt = "github://GlacierEQ/AEON-777/BRAIN/CONNECTORS/MEMORY_ARCHITECTURE_LIVE_CONSUMER_RECEIPT_2026-07-19.json";
registry.generated_at = observedAt;
connector.last_successful_probe = observedAt;
connector.freshness = {
  status: "fresh",
  evaluated_at: observedAt,
  max_age_hours: 24,
  reason: "Bounded recall from explicit sm_project_memory_master returned one text block; request and response digests are preserved in the consumer receipt."
};
connector.evidence.push("A bounded live recall from explicit sm_project_memory_master succeeded on 2026-07-19; the unstructured payload was rejected by the guard and only the pinned GitHub status pointer was promoted.");
connector.provenance_coverage.covered_fields = [...new Set([
  ...connector.provenance_coverage.covered_fields,
  "request_sha256",
  "response_sha256",
  "consumer_receipt"
])];
connector.provenance_coverage.evidence_refs = [...new Set([
  ...connector.provenance_coverage.evidence_refs,
  receipt
])];
connector.error_state = {
  status: "degraded",
  code: "MEMORY_BACKEND_UNSTRUCTURED_AND_LEGACY_GAPS",
  detail: "Connector output is unstructured at the consumer boundary; shared-tag leakage, default routing, exact-forget limits, and raw 3/5 correction precedence remain. The application guard prevents raw payload promotion but does not repair backend data.",
  observed_at: observedAt,
  receipt_uri: receipt
};
connector.next_gate = "Generalize typed candidate normalization, integrate one actor-profile consumer, assign an owner and approved namespaces, and define deterministic write/deletion receipts.";
connector.next_human_gate = connector.next_gate;
connector.connector_quality_components.freshness.evidence = ["2026-07-19 bounded live consumer probe receipt"];
connector.connector_quality_components.provenance_support.evidence = ["Stable memory IDs, quarantine registry, and hashed live-consumer receipt"];
connector.connector_quality_components.observable_receipts.evidence = ["Write IDs, recall read-back, and deterministic live-consumer receipt"];

fs.writeFileSync(path, `${JSON.stringify(registry, null, 2)}\n`);
console.log("Recorded Supermemory live-consumer probe; quality scores unchanged at connector 50 and data 0");
