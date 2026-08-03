import fs from 'node:fs';

const receipt = JSON.parse(fs.readFileSync(
  new URL('./receipts/MEMORY_FEDERATION_RECONCILIATION_2026-08-03.json', import.meta.url),
  'utf8',
));

const GIT_SHA = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const THREAD = 'MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validate(value) {
  assert(value?.schema_version === '1.0.0', 'schema version drift');
  assert(value.thread_anchor === THREAD, 'thread anchor drift');
  assert(!Number.isNaN(Date.parse(value.generated_at)), 'generated_at must be ISO date-time');

  assert(value.canonical_runtime.repository === 'GlacierEQ/AEON-777', 'canonical repository drift');
  assert(value.canonical_runtime.pull_request === 72, 'canonical runtime PR drift');
  assert(GIT_SHA.test(value.canonical_runtime.merge_sha), 'runtime merge Git SHA invalid');

  assert(value.deployment.supabase_project === 'dyhprklicgewmrimecey', 'Supabase project drift');
  assert(value.deployment.edge_function === 'memory-federation-dispatcher', 'dispatcher name drift');
  assert(value.deployment.function_status === 'ACTIVE', 'dispatcher must be active');
  assert(value.deployment.verify_jwt === true, 'dispatcher JWT verification must remain enabled');
  assert(SHA256.test(value.deployment.deployment_sha256), 'deployment digest invalid');

  const state = value.durable_state;
  assert(state.backends === 10, 'backend count drift');
  assert(state.assigned_owners === state.backends, 'every backend must have an owner');
  assert(state.namespace_scoped_backends === 9, 'namespace scope count drift');
  assert(state.memory_objects === 2, 'memory object count drift');
  assert(state.active_objects === 1, 'exactly one active object required');
  assert(state.superseded_objects === 1, 'exactly one superseded object required');
  assert(state.synced_bindings === 2, 'Mem and MemoryPlugin bindings must be synchronized');
  assert(state.events.blocked === 6, 'historical blocked event count drift');
  assert(state.events.succeeded === 1, 'exactly one succeeded projection event required');
  assert(state.events.pending === 0, 'pending federation events remain');
  assert(state.events.claimed === 0, 'claimed federation events remain');
  assert(state.events.failed === 0, 'failed federation events remain');
  assert(state.events.ambiguous === 0, 'ambiguous federation events remain');
  assert(state.stale_claims === 0, 'stale federation claims remain');
  assert(state.client_grants === 0, 'client grants detected');
  assert(state.restrictive_deny_policies === 6, 'restrictive deny policy count drift');

  const active = value.identity_graph.active;
  const old = value.identity_graph.superseded;
  assert(UUID.test(active.memory_id) && UUID.test(old.memory_id), 'memory IDs must be UUIDs');
  assert(active.canonical_status === 'active', 'active object status invalid');
  assert(old.canonical_status === 'superseded', 'old object status invalid');
  assert(active.supersedes === old.memory_id, 'active object does not supersede old object');
  assert(old.superseded_by === active.memory_id, 'old object does not point to active successor');
  assert(active.source_version === '3', 'Mem source version drift');
  assert(SHA256.test(active.content_hash), 'active content hash invalid');

  const mem = value.bindings.mem;
  assert(mem.memory_id === active.memory_id, 'Mem binding targets wrong object');
  assert(mem.external_version === '3', 'Mem binding version drift');
  assert(mem.external_hash === active.content_hash, 'Mem binding hash mismatch');
  assert(mem.projection_status === 'synced', 'Mem binding not synchronized');
  assert(mem.hash_scope === 'safe_summary_projection', 'Mem hash scope must remain qualified');
  assert(mem.raw_note_bytes_hashed === false, 'raw Mem note hash was overstated');

  const plugin = value.bindings.memoryplugin;
  assert(plugin.memory_id === active.memory_id, 'MemoryPlugin binding targets wrong object');
  assert(plugin.event_id === 7 && plugin.event_status === 'succeeded', 'MemoryPlugin event receipt invalid');
  assert(plugin.projection_status === 'synced', 'MemoryPlugin binding not synchronized');
  assert(plugin.external_hash === active.content_hash, 'MemoryPlugin source hash mismatch');
  assert(plugin.external_object_id === plugin.result_hash, 'MemoryPlugin result identity mismatch');
  assert(SHA256.test(plugin.result_hash), 'MemoryPlugin result hash invalid');
  assert(plugin.receipt_ref.endsWith(plugin.result_hash), 'MemoryPlugin receipt is not hash-bound');
  assert(['public', 'internal'].includes(plugin.sensitivity_ceiling), 'MemoryPlugin sensitivity ceiling unsafe');

  for (const count of Object.values({
    missingRls: value.advisor_state.federation_missing_rls_policy_findings,
    exposedDefiner: value.advisor_state.federation_exposed_security_definer_findings,
    unindexedFk: value.advisor_state.federation_unindexed_foreign_key_findings,
    duplicateIndex: value.advisor_state.federation_duplicate_index_findings,
  })) assert(count === 0, 'federation advisor finding remains');

  assert(value.provider_gates.supermemory === 'credential_required', 'Supermemory gate drift');
  assert(value.provider_gates.mem0 === 'credential_and_user_id_required', 'Mem0 gate drift');
  assert(value.provider_gates.pinecone === 'credential_and_index_host_required', 'Pinecone gate drift');
  assert(value.provider_gates.qdrant === 'endpoint_and_collection_required', 'Qdrant gate drift');

  const safety = value.safety_boundaries;
  assert(safety.vector_stores_truth_authority === false, 'vector store promoted to truth authority');
  assert(safety.raw_source_bytes_persisted === false, 'raw source bytes persisted');
  assert(safety.credentials_persisted === false, 'credentials persisted');
  assert(safety.protected_identifiers_persisted === false, 'protected identifiers persisted');
  assert(safety.sealed_content_portably_projected === false, 'sealed content portably projected');
  assert(safety.historical_blocked_events_silently_requeued === false, 'historical blockers silently requeued');
}

validate(receipt);

for (const [label, mutate, expected] of [
  ['pending-event', (x) => { x.durable_state.events.pending = 1; }, 'pending federation events remain'],
  ['client-grant', (x) => { x.durable_state.client_grants = 1; }, 'client grants detected'],
  ['vector-authority', (x) => { x.safety_boundaries.vector_stores_truth_authority = true; }, 'vector store promoted'],
  ['portable-sensitivity', (x) => { x.bindings.memoryplugin.sensitivity_ceiling = 'restricted'; }, 'sensitivity ceiling unsafe'],
  ['broken-supersession', (x) => { x.identity_graph.active.supersedes = null; }, 'does not supersede'],
  ['wrong-hash-type', (x) => { x.canonical_runtime.merge_sha = x.deployment.deployment_sha256; }, 'Git SHA invalid'],
]) {
  const candidate = structuredClone(receipt);
  mutate(candidate);
  let error = null;
  try { validate(candidate); } catch (caught) { error = caught; }
  assert(error && error.message.includes(expected), `${label} negative control failed for wrong reason: ${error?.message ?? 'passed'}`);
}

console.log('PASS: final memory federation identity, bindings, runtime state, provider gates, and safety boundaries are reconciled');
