import { adapterHealth, assertProjectionAllowed, safeProjectionPayload } from '../adapter_contract.mjs';
import { requestJson } from '../http_transport.mjs';

export class SupermemoryAdapter {
  constructor({ apiKey, baseUrl = 'https://api.supermemory.ai/v3', fetchImpl = globalThis.fetch } = {}) {
    this.key = 'supermemory';
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetchImpl = fetchImpl;
    this.sensitivityCeiling = 'internal';
    this.portable = false;
    this.capabilities = ['upsert', 'search', 'fetch', 'delete', 'negative_recall'];
  }
  headers() { return { authorization: `Bearer ${this.apiKey}` }; }
  async health() { return adapterHealth({ key: this.key, configured: Boolean(this.apiKey), capabilities: this.capabilities }); }
  async upsert(memory) {
    assertProjectionAllowed(memory, this);
    const payload = safeProjectionPayload(memory);
    const response = await requestJson(this.fetchImpl, `${this.baseUrl}/memories`, {
      method: 'POST', headers: this.headers(), sideEffecting: true,
      body: { customId: memory.memoryId, content: memory.safeSummary, metadata: payload, containerTags: [memory.namespace] },
    });
    return { externalObjectId: response.data?.id ?? memory.memoryId, externalVersion: response.data?.status ?? null, externalHash: memory.contentHash, receipt: response };
  }
  async search(query, { namespace, limit = 10 } = {}) {
    const response = await requestJson(this.fetchImpl, `${this.baseUrl}/search`, {
      method: 'POST', headers: this.headers(), body: { q: query, limit, ...(namespace ? { filters: { AND: [{ key: 'namespace', value: namespace }] } } : {}) },
    });
    return (response.data?.results ?? []).map((item) => ({
      backend: this.key,
      externalObjectId: item.documentId,
      memoryId: item.metadata?.memory_id ?? null,
      contentHash: item.metadata?.content_hash ?? null,
      score: Number(item.score ?? 0),
      text: item.summary ?? item.chunks?.find((chunk) => chunk.isRelevant)?.content ?? null,
      metadata: item.metadata ?? {},
    }));
  }
  async fetch(externalObjectId) { return requestJson(this.fetchImpl, `${this.baseUrl}/memories/${encodeURIComponent(externalObjectId)}`, { headers: this.headers() }); }
  async deleteById(externalObjectId) { return requestJson(this.fetchImpl, `${this.baseUrl}/memories/${encodeURIComponent(externalObjectId)}`, { method: 'DELETE', headers: this.headers(), sideEffecting: true }); }
  async verifyNegativeRecall({ memoryId, namespace }) {
    const results = await this.search(memoryId, { namespace, limit: 10 });
    return { absent: !results.some((item) => item.memoryId === memoryId || item.externalObjectId === memoryId), inspected: results.length };
  }
}
