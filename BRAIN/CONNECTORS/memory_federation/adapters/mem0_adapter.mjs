import { adapterHealth, assertProjectionAllowed, safeProjectionPayload } from '../adapter_contract.mjs';
import { requestJson } from '../http_transport.mjs';

export class Mem0Adapter {
  constructor({ apiKey, userId, baseUrl = 'https://api.mem0.ai/v3', fetchImpl = globalThis.fetch } = {}) {
    this.key = 'mem0';
    this.apiKey = apiKey;
    this.userId = userId;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetchImpl = fetchImpl;
    this.sensitivityCeiling = 'internal';
    this.portable = false;
    this.capabilities = ['upsert', 'search', 'delete', 'negative_recall'];
  }
  headers() { return { authorization: `Token ${this.apiKey}` }; }
  async health() { return adapterHealth({ key: this.key, configured: Boolean(this.apiKey && this.userId), capabilities: this.capabilities }); }
  async upsert(memory) {
    assertProjectionAllowed(memory, this);
    const metadata = safeProjectionPayload(memory);
    const response = await requestJson(this.fetchImpl, `${this.baseUrl}/memories/add/`, {
      method: 'POST', headers: this.headers(), sideEffecting: true,
      body: { messages: [{ role: 'user', content: memory.safeSummary }], user_id: this.userId, metadata },
    });
    const first = response.data?.results?.[0] ?? response.data?.[0] ?? response.data;
    return { externalObjectId: first?.id ?? first?.memory_id ?? memory.memoryId, externalVersion: first?.event ?? null, externalHash: memory.contentHash, receipt: response };
  }
  async search(query, { namespace, limit = 10 } = {}) {
    const filters = { AND: [{ user_id: this.userId }, ...(namespace ? [{ namespace }] : [])] };
    const response = await requestJson(this.fetchImpl, `${this.baseUrl}/memories/search/`, {
      method: 'POST', headers: this.headers(), body: { query, filters, top_k: limit, threshold: 0.1, rerank: false },
    });
    return (response.data?.results ?? []).map((item) => ({
      backend: this.key,
      externalObjectId: item.id,
      memoryId: item.metadata?.memory_id ?? null,
      contentHash: item.metadata?.content_hash ?? null,
      score: Number(item.score ?? 0),
      text: item.memory ?? null,
      metadata: item.metadata ?? {},
    }));
  }
  async deleteById(externalObjectId) { return requestJson(this.fetchImpl, `${this.baseUrl}/memories/${encodeURIComponent(externalObjectId)}/`, { method: 'DELETE', headers: this.headers(), sideEffecting: true }); }
  async verifyNegativeRecall({ memoryId, namespace }) {
    const results = await this.search(memoryId, { namespace, limit: 20 });
    return { absent: !results.some((item) => item.memoryId === memoryId || item.externalObjectId === memoryId), inspected: results.length };
  }
}
