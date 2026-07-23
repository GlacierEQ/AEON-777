import fs from "node:fs";

const registryUrl = new URL("./CONNECTOR_FABRIC.json", import.meta.url);
const schemaUrl = new URL("./CONNECTOR_FABRIC_SCHEMA.json", import.meta.url);
const registry = JSON.parse(fs.readFileSync(registryUrl, "utf8"));
const schema = JSON.parse(fs.readFileSync(schemaUrl, "utf8"));
const observedAt = "2026-07-17T18:21:39-10:00";

registry.schema_version = "1.2.0";
registry.generated_at = observedAt;
if (!registry.requested_connector_ids.includes("supermemory")) {
  registry.requested_connector_ids.push("supermemory");
}

const connector = {
  connector_id: "supermemory",
  display_name: "Supermemory",
  category: "memory",
  observed_state: "connected_restricted",
  auth_state: "authenticated",
  allocated_role: "memory_backend",
  access_mode: "bounded_control_write",
  approved_root: false,
  connector_quality_score: 50,
  data_quality_score: 0,
  sensitivity_ceiling: "restricted",
  next_gate: "Require explicit containerTag routing, add application-layer precedence filtering, and obtain exact deletion/export/provenance receipts before wider sync.",
  evidence: [
    "Five topic-specific correction writes returned stable memory IDs and passed targeted recall read-back on 2026-07-16.",
    "Broad project recall on 2026-07-17 returned correction precedence first in 3 of 5 scopes; CSEA and Brower scopes still ranked unqualified legacy assertions first.",
    "Writes using project without containerTag reported sm_project_default; explicit containerTag equal to the target project routed writes to the requested project.",
    "A reused correction container returned unrelated topics; exact forget could not remove first-pass document chunks."
  ],
  notion_worker: "qa_exception",
  automation_lanes: ["memory_architecture", "memory_hygiene", "evidence_intake"],
  approved_roots: [],
  root_scope_state: "not_approved",
  last_successful_probe: observedAt,
  freshness: {
    status: "fresh",
    evaluated_at: observedAt,
    max_age_hours: 24,
    reason: "Five broad recall probes completed and returned ranked results during this audit."
  },
  provenance_coverage: {
    status: "partial",
    covered_fields: ["memory_id", "container_tag", "observed_at", "recall_result"],
    missing_fields: ["canonical_source_uri", "source_version", "content_hash", "immutable_backend_receipt"],
    evidence_refs: [
      "github://GlacierEQ/AEON-777/BRAIN/CONNECTORS/MEMORY_QUARANTINE_REGISTRY.json",
      "github://GlacierEQ/AEON-777/BRAIN/CONNECTORS/MEMORY_RECALL_REGRESSION_2026-07-17.json"
    ]
  },
  idempotency_key_strategy: {
    status: "unknown",
    expression: null,
    collision_scope: null
  },
  error_state: {
    status: "degraded",
    code: "MEMORY_ROUTING_AND_PRECEDENCE_GAPS",
    detail: "Shared container tags permit cross-topic retrieval; project-only writes route to default; exact forget does not remove document chunks; broad correction precedence passes 3/5 scopes.",
    observed_at: observedAt,
    receipt_uri: "github://GlacierEQ/AEON-777/BRAIN/CONNECTORS/MEMORY_RECALL_REGRESSION_2026-07-17.json"
  },
  owner: "unassigned",
  next_human_gate: "Require explicit containerTag routing, add application-layer precedence filtering, and obtain exact deletion/export/provenance receipts before wider sync.",
  connector_quality_components: {
    authentication: { awarded: 15, possible: 15, evidence: ["Successful save and recall tool results"] },
    scoped_access: { awarded: 0, possible: 15, evidence: [] },
    freshness: { awarded: 15, possible: 15, evidence: ["2026-07-17 broad recall probes"] },
    provenance_support: { awarded: 10, possible: 20, evidence: ["Stable memory IDs and canonical quarantine registry"] },
    idempotency_retry_safety: { awarded: 0, possible: 10, evidence: [] },
    sensitivity_controls: { awarded: 0, possible: 15, evidence: [] },
    observable_receipts: { awarded: 10, possible: 10, evidence: ["Write IDs plus targeted and broad recall read-back"] }
  },
  data_quality_dimensions: {
    completeness: null,
    uniqueness: null,
    validity: null,
    consistency: null,
    lineage: null,
    timeliness: null,
    duplicate_risk: null
  },
  legacy_quality_snapshot: {
    connector_quality_score: 0,
    data_quality_score: 0,
    status: "superseded_unreproducible",
    reason: "Supermemory was absent from connector fabric v1.1.0; zero is a migration placeholder, not a historical assessment."
  }
};

const existingIndex = registry.connectors.findIndex((item) => item.connector_id === connector.connector_id);
if (existingIndex === -1) registry.connectors.push(connector);
else registry.connectors[existingIndex] = connector;

schema.$id = "urn:casebrain:schema:connector-fabric:1.2.0";
schema.properties.schema_version.const = "1.2.0";
const roles = schema.$defs.connector.properties.allocated_role.enum;
if (!roles.includes("memory_backend")) roles.push("memory_backend");

fs.writeFileSync(registryUrl, `${JSON.stringify(registry, null, 2)}\n`);
fs.writeFileSync(schemaUrl, `${JSON.stringify(schema, null, 2)}\n`);
console.log(`Migrated connector fabric to v1.2.0 with ${registry.connectors.length} connectors`);
