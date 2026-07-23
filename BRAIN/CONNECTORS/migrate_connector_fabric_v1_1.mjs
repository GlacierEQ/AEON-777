import fs from "node:fs";

const registryUrl = new URL("./CONNECTOR_FABRIC.json", import.meta.url);
const registry = JSON.parse(fs.readFileSync(registryUrl));
const assessedAt = "2026-07-15T18:06:57-10:00";

const authenticationAward = (connector) =>
  connector.auth_state === "authenticated" ? 15 : 0;

const sensitivityAward = (connector) =>
  !["tool_available_unassessed", "not_surfaced"].includes(connector.observed_state)
    && ["public", "private", "restricted", "sealed"].includes(connector.sensitivity_ceiling)
    ? 15
    : 0;

registry.schema_version = "1.1.0";
registry.generated_at = assessedAt;
registry.thread_anchor = "MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51";
registry.policy.unknown_quality_components_score_zero = true;
registry.policy.authentication_not_inferred_from_tool_availability = true;
registry.policy.protected_bytes_outside_control_planes = true;
registry.policy.task_systems_store_receipts_only = true;

registry.connectors = registry.connectors.map((connector) => {
  const authentication = authenticationAward(connector);
  const sensitivityControls = sensitivityAward(connector);
  const legacyConnectorQualityScore = connector.legacy_quality_snapshot?.connector_quality_score
    ?? connector.connector_quality_score;
  const legacyDataQualityScore = connector.legacy_quality_snapshot?.data_quality_score
    ?? connector.data_quality_score;
  const rootScopeState = connector.approved_root
    ? "approved_pointer_missing"
    : "not_approved";

  return {
    ...connector,
    approved_roots: [],
    root_scope_state: rootScopeState,
    last_successful_probe: null,
    freshness: {
      status: "unknown",
      evaluated_at: assessedAt,
      max_age_hours: null,
      reason: "No source-linked successful-probe timestamp is preserved in the v1.0 registry."
    },
    provenance_coverage: {
      status: "unknown",
      covered_fields: [],
      missing_fields: [
        "source_uri",
        "source_version",
        "observed_at",
        "custodian",
        "sha256_exact_bytes",
        "run_receipt"
      ],
      evidence_refs: []
    },
    idempotency_key_strategy: {
      status: "unknown",
      expression: null,
      collision_scope: null
    },
    error_state: {
      status: "unknown",
      code: null,
      detail: "The v1.0 narrative evidence is not a structured connector error receipt.",
      observed_at: null,
      receipt_uri: null
    },
    owner: "unassigned",
    next_human_gate: connector.next_gate,
    connector_quality_components: {
      authentication: {
        awarded: authentication,
        possible: 15,
        evidence: authentication ? ["auth_state=authenticated"] : []
      },
      scoped_access: {
        awarded: 0,
        possible: 15,
        evidence: []
      },
      freshness: {
        awarded: 0,
        possible: 15,
        evidence: []
      },
      provenance_support: {
        awarded: 0,
        possible: 20,
        evidence: []
      },
      idempotency_retry_safety: {
        awarded: 0,
        possible: 10,
        evidence: []
      },
      sensitivity_controls: {
        awarded: sensitivityControls,
        possible: 15,
        evidence: sensitivityControls ? [`sensitivity_ceiling=${connector.sensitivity_ceiling}`] : []
      },
      observable_receipts: {
        awarded: 0,
        possible: 10,
        evidence: []
      }
    },
    connector_quality_score: authentication + sensitivityControls,
    data_quality_dimensions: {
      completeness: null,
      uniqueness: null,
      validity: null,
      consistency: null,
      lineage: null,
      timeliness: null,
      duplicate_risk: null
    },
    data_quality_score: 0,
    legacy_quality_snapshot: {
      connector_quality_score: legacyConnectorQualityScore,
      data_quality_score: legacyDataQualityScore,
      status: "superseded_unreproducible",
      reason: "v1.0 did not preserve component awards and source-linked evidence for each score."
    }
  };
});

fs.writeFileSync(registryUrl, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Migrated ${registry.connectors.length} connectors to v1.1.0`);
