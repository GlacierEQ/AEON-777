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

  assert(value.identity.active_memory_id !== value.identity.superseded_memory_id, 'active and superseded memory IDs must differ');
  assert(value.source_authority_order.map((entry) => entry.backend).length === new Set(value.source_authority_order.map((entry) => entry.backend)).size, 'authority backend keys must be unique');
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

  assert(Object.keys(value.synchronized_bindings).sort().join(',') === 'mem,memoryplugin', 'only Mem and MemoryPlugin may be represented as synchronized');
  assert(value.synchronized_bindings.mem.content_hash === value.synchronized_bindings.memoryplugin.content_hash, 'synchronized binding content hashes must agree');
  assert(value.synchronized_bindings.mem.projection_status === 'synced', 'Mem binding must be synchronized');
  assert(value.synchronized_bindings.memoryplugin.projection_status === 'synced', 'MemoryPlugin binding must be synchronized');

  const state = value.runtime_state;
  assert(state.active_objects + state.superseded_objects === state.global_memory_objects, 'memory object lifecycle counts do not reconcile');
  assert(state.synchronized_bindings === Object.keys(value.synchronized_bindings).length, 'binding count does not reconcile');
  assert(Object.values(state.sync_events).reduce((sum, count) => sum + count, 0) === 7, 'sync event counts do not reconcile');

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

  assert(value.completion_state.blocked.includes('casebrain_current_write_route'), 'CASEBRAIN route gate must remain explicit');
  assert(value.completion_state.unresolved.includes('external_queue_ack_dlq_acceptance_proof'), 'HI-46 queue proof must remain unresolved');
}

validateSemantic(manifest);

for (const [name, mutate, expected] of [
  ['silent-overwrite', (x) => { x.identity.silent_overwrite_allowed = true; }, 'schema validation failed'],
  ['vector-authority', (x) => { x.backends.pinecone.truth_authority = true; }, 'cannot become a truth authority'],
  ['unsafe-portable-ceiling', (x) => { x.backends.memoryplugin.sensitivity_ceiling = 'restricted'; }, 'MemoryPlugin sensitivity ceiling drift'],
  ['false-sync', (x) => { x.synchronized_bindings.supermemory = structuredClone(x.synchronized_bindings.mem); }, 'schema validation failed'],
  ['pending-event', (x) => { x.runtime_state.sync_events.pending = 1; }, 'schema validation failed'],
  ['missing-protected-data-rule', (x) => { x.safety_policy.sensitive_data_excluded_from_portable_and_broad_projections = x.safety_policy.sensitive_data_excluded_from_portable_and_broad_projections.filter((v) => v !== 'protected_minor_identifiers'); }, 'missing sensitive-data exclusion'],
]) {
  const candidate = structuredClone(manifest);
  mutate(candidate);
  let error = null;
  try { validateSemantic(candidate); } catch (caught) { error = caught; }
  assert(error && error.message.includes(expected), `${name} negative control failed for wrong reason: ${error?.message ?? 'passed'}`);
}

console.log('PASS: canonical ChatGPT memory manifest schema, authority, bindings, safety, and lifecycle controls');
