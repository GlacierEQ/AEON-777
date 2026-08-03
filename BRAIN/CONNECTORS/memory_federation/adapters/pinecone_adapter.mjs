import { MemoryAdapterError, adapterHealth, assertProjectionAllowed, safeProjectionPayload } from '../adapter_contract.mjs';
import { requestJson } from '../http_transport.mjs';

export class PineconeAdapter {
  constructor({ apiKey, indexHost, apiVersion = '2026-04', fetchImpl = globalThis.fetch } = {}) {
    this.key = 'pinecone'; this.apiKey = apiKey; this.indexHost = indexHost?.replace(/\/$/, ''); this.apiVersion = apiVersion; this.fetchImpl = fetchImpl;
    this.sensitivityCeiling = 'confidential'; this.portable = false;
    this.capabilities = ['upsert_vector', 'query_vector', 'fetch', 'delete', 'negative_recall'];
  }
  headers() { return { 'api-key': this.apiKey, 'x-pinecone-api-version': this.apiVersion }; }
  async health() { return adapterHealth({ key: this.key, configured: Boolean(this.apiKey && this.indexHost), capabilities: this.capabilities }); }
  async upsert(memory, { vector } = {}) {
    assertProjectionAllowed(memory, this);
    if (!Array.isArray(vector) || vector.length === 0 || !vector.every(Number.isFinite)) throw new MemoryAdapterError('embedding_required', 'Pinecone projection requires a numeric vector');
    const metadata = safeProjectionPayload(memory);
    const response = await requestJson(this.fetchImpl, `${this.indexHost}/vectors/upsert`, { method: 'POST', headers: this.headers(), sideEffecting: true, body: { namespace: memory.namespace, vectors: [{ id: memory.memoryId, values: vector, metadata }] } });
    return { externalObjectId: memory.memoryId, externalVersion: this.apiVersion, externalHash: memory.contentHash, receipt: response };
  }
  async search(_query, { namespace, vector, limit = 10, filter } = {}) {
    if (!Array.isArray(vector) || vector.length === 0) throw new MemoryAdapterError('embedding_required', 'Pinecone query requires a vector');
    const response = await requestJson(this.fetchImpl, `${this.indexHost}/query`, { method: 'POST', headers: this.headers(), body: { namespace, vector, topK: limit, includeMetadata: true, includeValues: false, ...(filter ? { filter } : {}) } });
    return (response.data?.matches ?? []).map((item) => ({ backend: this.key, externalObjectId: item.id, memoryId: item.metadata?.memory_id ?? item.id, contentHash: item.metadata?.content_hash ?? null, score: Number(item.score ?? 0), text: item.metadata?.safe_summary ?? null, metadata: item.metadata ?? {} }));
  }
  async fetch(externalObjectId, { namespace } = {}) {
    const url = new URL(`${this.indexHost}/vectors/fetch`); url.searchParams.set('ids', externalObjectId); if (namespace) url.searchParams.set('namespace', namespace);
    return requestJson(this.fetchImpl, url.toString(), { headers: this.headers() });
  }
  async deleteById(externalObjectId, { namespace } = {}) { return requestJson(this.fetchImpl, `${this.indexHost}/vectors/delete`, { method: 'POST', headers: this.headers(), sideEffecting: true, body: { ids: [externalObjectId], namespace } }); }
  async verifyNegativeRecall({ memoryId, namespace }) {
    const result = await this.fetch(memoryId, { namespace }); const vectors = result.data?.vectors ?? result.data?.records ?? {};
    return { absent: !vectors[memoryId], inspected: Object.keys(vectors).length };
  }
}
