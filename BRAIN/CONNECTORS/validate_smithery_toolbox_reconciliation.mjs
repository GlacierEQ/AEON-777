import assert from "node:assert/strict";
import fs from "node:fs";

const receipt = JSON.parse(fs.readFileSync(new URL("./receipts/SMITHERY_TOOLBOX_RECONCILIATION_2026-08-07.json", import.meta.url), "utf8"));
assert.equal(receipt.schema_version, "1.0.0");
assert.equal(receipt.aggregate.total, receipt.connections.length);
assert.equal(receipt.aggregate.total, receipt.aggregate.connected + receipt.aggregate.auth_required + receipt.aggregate.input_required + receipt.aggregate.error);
assert.equal(new Set(receipt.connections.map((item) => item.connector_key)).size, receipt.connections.length);
for (const item of receipt.connections) {
  assert.ok(["connected", "auth_required", "input_required", "error"].includes(item.observed_state));
  assert.deepEqual(item.approved_roots, []);
  assert.equal(item.capabilities_enabled, false);
  assert.equal(item.connector_quality.score, 0);
  assert.equal(item.data_quality.score, 0);
  if (item.observed_state === "connected") assert.equal(item.authentication_state, "unknown");
  if (item.observed_state === "auth_required") assert.equal(item.authentication_state, "auth_required");
  if (item.observed_state === "input_required") assert.equal(item.authentication_state, "configuring");
  if (item.observed_state === "error") assert.equal(item.authentication_state, "error");
}
const serialized = JSON.stringify(receipt);
for (const forbidden of ["setupUrl", "identityUserId", "SMITHERY_KEY=", "token="]) {
  assert.equal(serialized.includes(forbidden), false, `forbidden sensitive field: ${forbidden}`);
}
assert.equal(receipt.supabase_remediation.smithery_inventory_rows, receipt.aggregate.total);
assert.equal(receipt.supabase_remediation.source_linked_rows, receipt.aggregate.total);
assert.equal(receipt.supabase_remediation.fixture_nonterminal_jobs, 0);
assert.equal(receipt.supabase_remediation.enabled_open_or_half_open_routes, 0);
assert.equal(receipt.supabase_remediation.enabled_unsafe_mutation_routes, 0);
assert.equal(receipt.supabase_remediation.connector_quality_promotions, 0);
assert.equal(receipt.supabase_remediation.data_quality_promotions, 0);
assert.equal(receipt.boundaries.connection_state_does_not_prove_authentication, true);
assert.equal(receipt.boundaries.no_route_promoted_live, true);
console.log("Smithery toolbox reconciliation receipt: valid");
