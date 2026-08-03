import assert from 'node:assert/strict';
import { sha256Hex, deterministicSyncKey, assertProjectionAllowed } from '../adapter_contract.mjs';
import { MemoryFederationOrchestrator, mergeSearchResults } from '../orchestrator.mjs';
import { SupermemoryAdapter } from '../adapters/supermemory_adapter.mjs';
import { Mem0Adapter } from '../adapters/mem0_adapter.mjs';
import { PineconeAdapter } from '../adapters/pinecone_adapter.mjs';
import { QdrantAdapter } from '../adapters/qdrant_adapter.mjs';
import { MemoryPluginAdapter } from '../adapters/memoryplugin_adapter.mjs';
import { ToolBridgeAdapter } from '../adapters/tool_bridge_adapter.mjs';

const memory = {
  memoryId: '19858cb4-33a6-4db9-9192-0b842880e407',
  namespace: 'MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51',
  memoryType: 'system_control',
  safeSummary: 'Casey uses a governed memory federation.',
  contentHash: sha256Hex('Casey uses a governed memory federation.'),
  sourceSystem: 'mem',
  sourceObjectId: '63f1d7cd-9202-577a-8d0d-211c40a07606',
  sourceVersion: '1',
  sourceHash: sha256Hex('source'),
  provenanceClass: 'operator_directive',
  verificationStatus: 'verified',
  sensitivity: 'internal',
  canonicalStatus: 'active',
  canonicalPayloadRef: 'mem://63f1d7cd-9202-577a-8d0d-211c40a07606',
  metadata: { thread_anchor: 'MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51' },
};

function mockFetch(handler) {
  return async (url, init = {}) => {
    const result = await handler(String(url), init);
    return new Response(JSON.stringify(result.body ?? {}), { status: result.status ?? 200, headers: { 'content-type': 'application/json' } });
  };
}

{
  const a = deterministicSyncKey({ memoryId: memory.memoryId, contentHash: memory.contentHash, target: 'supermemory', operation: 'upsert' });
  const b = deterministicSyncKey({ operation: 'upsert', target: 'supermemory', contentHash: memory.contentHash, memoryId: memory.memoryId });
  assert.equal(a, b); assert.match(a, /^[0-9a-f]{64}$/);
}
{
  const portable = new MemoryPluginAdapter(); const result = await portable.upsert(memory);
  assert.equal(result.manualProjectionRequired, true);
  assert.equal(result.projectionLine, 'tool=memoryplugin&&memory=Casey uses a governed memory federation.');
  assert.throws(() => assertProjectionAllowed({ ...memory, sensitivity: 'restricted' }, portable), /Restricted memory cannot be projected|exceeds/);
}
{
  let request;
  const adapter = new SupermemoryAdapter({ apiKey: 'test-key', fetchImpl: mockFetch((url, init) => { request = { url, init, body: JSON.parse(init.body) }; return { body: { id: 'sm-1', status: 'queued' } }; }) });
  const result = await adapter.upsert(memory);
  assert.equal(result.externalObjectId, 'sm-1'); assert.equal(request.url, 'https://api.supermemory.ai/v3/memories');
  assert.equal(request.body.customId, memory.memoryId); assert.deepEqual(request.body.containerTags, [memory.namespace]); assert.equal(request.body.metadata.content_hash, memory.contentHash);
}
{
  let request;
  const adapter = new Mem0Adapter({ apiKey: 'm0-test', userId: 'casey', fetchImpl: mockFetch((url, init) => { request = { url, init, body: JSON.parse(init.body) }; return { body: { results: [{ id: 'm0-1', event: 'ADD' }] } }; }) });
  const result = await adapter.upsert(memory);
  assert.equal(result.externalObjectId, 'm0-1'); assert.equal(request.url, 'https://api.mem0.ai/v3/memories/add/'); assert.equal(request.body.user_id, 'casey'); assert.equal(request.body.metadata.memory_id, memory.memoryId);
}
{
  let request;
  const adapter = new PineconeAdapter({ apiKey: 'pc-test', indexHost: 'https://index.example.pinecone.io', fetchImpl: mockFetch((url, init) => { request = { url, init, body: JSON.parse(init.body) }; return { body: { upsertedCount: 1 } }; }) });
  const result = await adapter.upsert(memory, { vector: [0.1, 0.2, 0.3] });
  assert.equal(result.externalObjectId, memory.memoryId); assert.equal(request.url, 'https://index.example.pinecone.io/vectors/upsert'); assert.equal(request.body.namespace, memory.namespace); assert.equal(request.body.vectors[0].id, memory.memoryId);
}
{
  let request;
  const adapter = new QdrantAdapter({ url: 'https://qdrant.example', collection: 'memory', apiKey: 'qd-test', fetchImpl: mockFetch((url, init) => { request = { url, init, body: JSON.parse(init.body) }; return { body: { result: { operation_id: 5, status: 'completed' } } }; }) });
  const result = await adapter.upsert(memory, { vector: [0.1, 0.2, 0.3] });
  assert.equal(result.externalObjectId, memory.memoryId); assert.equal(request.url, 'https://qdrant.example/collections/memory/points?wait=true'); assert.equal(request.body.points[0].payload.memory_id, memory.memoryId);
}
{
  const bridge = new ToolBridgeAdapter({ key: 'casebrain', bridgeUrl: undefined });
  const orchestrator = new MemoryFederationOrchestrator({ adapters: { casebrain: bridge, memoryplugin: new MemoryPluginAdapter() } });
  const result = await orchestrator.project(memory, ['casebrain', 'memoryplugin']);
  assert.equal(result.results[0].status, 'blocked'); assert.equal(result.results[0].error.code, 'adapter_unconfigured'); assert.equal(result.results[1].status, 'manual_projection'); assert.equal(result.completed, true);
}
{
  const merged = mergeSearchResults([
    { backend: 'mem', memoryId: memory.memoryId, score: 0.7, text: 'A' },
    { backend: 'supermemory', memoryId: memory.memoryId, score: 0.8, text: 'B' },
    { backend: 'mem0', memoryId: 'other', score: 0.9, text: 'C' },
  ], { mem: 5, supermemory: 6, mem0: 7 });
  assert.equal(merged.length, 2); assert.deepEqual(new Set(merged.find((x) => x.memoryId === memory.memoryId).corroboratingBackends), new Set(['mem', 'supermemory']));
}
{
  const failing = { key: 'bad', sensitivityCeiling: 'internal', portable: false, health: async () => ({ configured: true }), upsert: async () => { throw Object.assign(new Error('boom'), { code: 'boom', retryable: true }); } };
  const good = { key: 'good', sensitivityCeiling: 'internal', portable: false, health: async () => ({ configured: true }), upsert: async () => ({ externalObjectId: 'ok', externalHash: memory.contentHash }) };
  const result = await new MemoryFederationOrchestrator({ adapters: { bad: failing, good } }).project(memory, ['bad', 'good']);
  assert.equal(result.results[0].status, 'failed'); assert.equal(result.results[1].status, 'succeeded');
}

console.log('PASS: 9 memory federation adapter/orchestrator controls');
