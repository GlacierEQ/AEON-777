import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const base = new URL('./memory_federation/', import.meta.url);
const schema = JSON.parse(fs.readFileSync(new URL('schemas/chatgpt_memory_manifest.schema.json', base), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(new URL('manifests/chatgpt_memory_manifest.v1.json', base), 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateSemantic(value) {
  assert(validateSchema(value), `schema validation failed: ${ajv.errorsText(validateSchema.errors, { separator: '; ' })}`);

  assert(value.manifest_identity.memory_id !== value.manifest_identity.supersedes, 'manifest successor must differ from predecessor');
  assert(value.charter_identity.active_memory_id !== value.charter_identity.superseded_memory_id, 'charter active and superseded memory IDs must differ');
  assert(value.manifest_identity.memory_id !== value.charter_identity.active_memory_id, 'manifest and charter identities must remain separate objects');

  const authorityKeys = value.source_authority_order.map((entry) => entry.backend);
  assert(authorityKeys.length === new Set(authorityKeys).size, 'authority backend keys must be unique');
  assert(value.source_authority_order[0].backend === 'approved_source_bytes', 'approved source bytes must remain highest authority');
  assert(value.source_authority_order.at(-1).backend === 'memoryplugin', 'MemoryPlugin must remain the lowest authority projection');

  for (const key of ['approved_source_bytes', 'github', 'supabase']) {
    assert(value.backends[key].truth_authority === true, `${key} must remain a truth authority`);
    assert(value.backends[key].write_mode === 'canonical', `${key} must remain canonical`);
  }

  for (const key of ['casebrain', 'mem', 'supermemory', 'mem0', 'pinecone', 'qdrant', 'memoryplugin']) {
    assert(value.backends[key].truth_authority === false, `${key} cannot become a truth authority`);
  }

  for (const key of ['pinecone', 'qdrant']) {
    assert(value.backends[key].rebuildable === true, `${key} must remain rebuildable`);
    assert(value.backends[key].write_mode === 'projection', `${key} must remain a projection`);
  }

  assert(value.backends.memoryplugin.sensitivity_ceiling === 'internal', 'MemoryPlugin sensitivity ceiling drift');
  assert(value.backends.memoryplugin.write_mode === 'portable_projection', 'MemoryPlugin write mode drift');

  assert(Object.keys(value.charter_synchronized_bindings).sort().join(',') === 'mem,memoryplugin', 'charter may only represent Mem and MemoryPlugin as synchronized');
  assert(value.charter_synchronized_bindings.mem.content_hash === value.charter_synchronized_bindings.memoryplugin.content_hash, 'charter binding content hashes must agree');
  assert(value.charter_synchronized_bindings.mem.projection_status === 'synced', 'charter Mem binding must be synchronized');
  assert(value.charter_synchronized_bindings.memoryplugin.projection_status === 'synced', 'charter MemoryPlugin binding must be synchronized');

  assert(value.manifest_expected_bindings.join(',') === 'github,mem,memoryplugin', 'manifest expected bindings must remain GitHub, Mem, and MemoryPlugin');

  const snapshot = value.runtime_snapshot;
  assert(snapshot.snapshot_is_historical === true, 'runtime snapshot must be explicitly historical');
  assert(snapshot.source === 'supabase_readback', 'runtime snapshot must be Supabase-grounded');
  assert(snapshot.assigned_backend_owners === snapshot.registered_backends, 'every registered backend must have an owner in the snapshot');
  assert(snapshot.active_objects + snapshot.superseded_objects === snapshot.global_memory_objects, 'snapshot memory lifecycle counts do not reconcile');
  assert(snapshot.global_memory_objects === 3, 'pre-successor snapshot object count drift');
  assert(snapshot.active_objects === 2 && snapshot.superseded_objects === 1, 'pre-successor snapshot lifecycle drift');
  assert(snapshot.synchronized_bindings === 5, 'pre-successor synchronized binding count drift');
  assert(snapshot.sync_events.blocked_historical === 6, 'historical blocked event count drift');
  assert(snapshot.sync_events.succeeded === 3, 'pre-successor succeeded event count drift');
  assert(snapshot.sync_events.pending === 0, 'snapshot contains pending events');
  assert(snapshot.sync_events.claimed === 0, 'snapshot contains claimed events');
  assert(snapshot.sync_events.failed === 0, 'snapshot contains failed events');
  assert(snapshot.sync_events.ambiguous === 0, 'snapshot contains ambiguous events');
  assert(Object.values(snapshot.sync_events).reduce((sum, count) => sum + count, 0) === 9, 'snapshot sync-event counts do not reconcile');

  const requiredSensitiveExclusions = new Set([
    'credentials',
    'protected_minor_identifiers',
    'medical_data',
    'sealed_content',
    'privileged_material',
    'raw_original_source_bytes'
  ]);
  for (const item of requiredSensitiveExclusions) {
    assert(value.safety_policy.sensitive_data_excluded_from_portable_and_broad_projections.includes(item), `missing sensitive-data exclusion: ${item}`);
  }

  for (const receiptType of ['authentication', 'synchronization', 'mutation', 'deletion']) {
    assert(value.chatgpt_operating_behavior.require_receipts_for.includes(receiptType), `missing receipt requirement: ${receiptType}`);
  }

  assert(value.completion_state.completed.includes('self_registration_safe_manifest_identity'), 'self-registration-safe identity control missing');
  assert(value.completion_state.completed.includes('historical_runtime_snapshot'), 'historical snapshot control missing');
  assert(value.completion_state.blocked.includes('casebrain_current_write_route'), 'CASEBRAIN route gate must remain explicit');
  assert(value.completion_state.unresolved.includes('external_queue_ack_dlq_acceptance_proof'), 'HI-46 queue proof must remain unresolved');
}

validateSemantic(manifest);

for (const [name, mutate, expected] of [
  ['silent-overwrite', (x) => { x.manifest_identity.silent_overwrite_allowed = true; }, 'schema validation failed'],
  ['identity-collapse', (x) => { x.manifest_identity.memory_id = x.charter_identity.active_memory_id; }, 'identities must remain separate'],
  ['vector-authority', (x) => { x.backends.pinecone.truth_authority = true; }, 'cannot become a truth authority'],
  ['unsafe-portable-ceiling', (x) => { x.backends.memoryplugin.sensitivity_ceiling = 'restricted'; }, 'MemoryPlugin sensitivity ceiling drift'],
  ['false-manifest-binding', (x) => { x.manifest_expected_bindings[2] = 'supermemory'; }, 'schema validation failed'],
  ['live-snapshot-mislabel', (x) => { x.runtime_snapshot.snapshot_is_historical = false; }, 'schema validation failed'],
  ['pending-event', (x) => { x.runtime_snapshot.sync_events.pending = 1; }, 'snapshot contains pending events'],
  ['client-grant', (x) => { x.runtime_snapshot.direct_client_grants = 1; }, 'schema validation failed'],
  ['missing-protected-data-rule', (x) => { x.safety_policy.sensitive_data_excluded_from_portable_and_broad_projections = x.safety_policy.sensitive_data_excluded_from_portable_and_broad_projections.filter((v) => v !== 'protected_minor_identifiers'); }, 'missing sensitive-data exclusion']
]) {
  const candidate = structuredClone(manifest);
  mutate(candidate);
  let error = null;
  try { validateSemantic(candidate); } catch (caught) { error = caught; }
  assert(error && error.message.includes(expected), `${name} negative control failed for wrong reason: ${error?.message ?? 'passed'}`);
}

console.log('PASS: ChatGPT memory manifest v1.1 identity, historical snapshot, authority, bindings, safety, and lifecycle controls');
