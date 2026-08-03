import { MemoryAdapterError, adapterHealth, assertProjectionAllowed, safeProjectionPayload } from '../adapter_contract.mjs';
import { requestJson } from '../http_transport.mjs';

export class QdrantAdapter {
  constructor({ apiKey, url, collection, fetchImpl = globalThis.fetch } = {}) {
    this.key = 'qdrant'; this.apiKey = apiKey; this.url = url?.replace(/\/$/, ''); this.collection = collection; this.fetchImpl = fetchImpl;
    this.sensitivityCeiling = 'restricted'; this.portable = false;
    this.capabilities = ['upsert_vector', 'query_vector', 'fetch', 'delete', 'negative_recall'];
  }
  headers() { return this.apiKey ? { 'api-key': this.apiKey } : {}; }
  async health() { return adapterHealth({ key: this.key, configured: Boolean(this.url && this.collection), capabilities: this.capabilities }); }
  async upsert(memory, { vector } = {}) {
    assertProjectionAllowed(memory, this);
    if (!Array.isArray(vector) || vector.length === 0 || !vector.every(Number.isFinite)) throw new MemoryAdapterError('embedding_required', 'Qdrant projection requires a numeric vector');
    const payload = safeProjectionPayload(memory);
    const response = await requestJson(this.fetchImpl, `${this.url}/collections/${encodeURIComponent(this.collection)}/points?wait=true`, { method: 'PUT', headers: this.headers(), sideEffecting: true, body: { points: [{ id: memory.memoryId, vector, payload }] } });
    return { externalObjectId: memory.memoryId, externalVersion: response.data?.result?.operation_id?.toString?.() ?? null, externalHash: memory.contentHash, receipt: response };
  }
  async search(_query, { namespace, vector, limit = 10, filter } = {}) {
    if (!Array.isArray(vector) || vector.length === 0) throw new MemoryAdapterError('embedding_required', 'Qdrant query requires a vector');
    const namespaceFilter = namespace ? { key: 'namespace', match: { value: namespace } } : null;
    const must = [...(filter?.must ?? []), ...(namespaceFilter ? [namespaceFilter] : [])];
    const response = await requestJson(this.fetchImpl, `${this.url}/collections/${encodeURIComponent(this.collection)}/points/query`, { method: 'POST', headers: this.headers(), body: { query: vector, limit, with_payload: true, with_vector: false, ...(must.length ? { filter: { ...filter, must } } : filter ? { filter } : {}) } });
    const points = response.data?.result?.points ?? response.data?.result ?? [];
    return points.map((item) => ({ backend: this.key, externalObjectId: String(item.id), memoryId: item.payload?.memory_id ?? String(item.id), contentHash: item.payload?.content_hash ?? null, score: Number(item.score ?? 0), text: item.payload?.safe_summary ?? null, metadata: item.payload ?? {} }));
  }
  async fetch(externalObjectId) { return requestJson(this.fetchImpl, `${this.url}/collections/${encodeURIComponent(this.collection)}/points/${encodeURIComponent(externalObjectId)}?with_payload=true&with_vector=false`, { headers: this.headers() }); }
  async deleteById(externalObjectId) { return requestJson(this.fetchImpl, `${this.url}/collections/${encodeURIComponent(this.collection)}/points/delete?wait=true`, { method: 'POST', headers: this.headers(), sideEffecting: true, body: { points: [externalObjectId] } }); }
  async verifyNegativeRecall({ memoryId }) {
    try { const result = await this.fetch(memoryId); return { absent: !result.data?.result, inspected: result.data?.result ? 1 : 0 }; }
    catch (error) { if (error?.code === 'http_error' && error.details?.status === 404) return { absent: true, inspected: 0 }; throw error; }
  }
}
