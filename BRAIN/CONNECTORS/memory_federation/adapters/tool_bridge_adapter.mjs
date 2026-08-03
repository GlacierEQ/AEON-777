import { adapterHealth, assertProjectionAllowed, safeProjectionPayload } from '../adapter_contract.mjs';
import { requestJson } from '../http_transport.mjs';

export class ToolBridgeAdapter {
  constructor({ key, bridgeUrl, token, sensitivityCeiling = 'restricted', fetchImpl = globalThis.fetch } = {}) {
    this.key = key; this.bridgeUrl = bridgeUrl?.replace(/\/$/, ''); this.token = token; this.fetchImpl = fetchImpl;
    this.sensitivityCeiling = sensitivityCeiling; this.portable = false;
    this.capabilities = ['upsert', 'search', 'fetch', 'delete', 'negative_recall'];
  }
  headers() { return this.token ? { authorization: `Bearer ${this.token}` } : {}; }
  async health() { return adapterHealth({ key: this.key, configured: Boolean(this.bridgeUrl), capabilities: this.capabilities }); }
  async call(action, body, sideEffecting = false) { return requestJson(this.fetchImpl, `${this.bridgeUrl}/${action}`, { method: 'POST', headers: this.headers(), body, sideEffecting }); }
  async upsert(memory) {
    assertProjectionAllowed(memory, this);
    const response = await this.call('upsert', { memory: safeProjectionPayload(memory) }, true);
    return { externalObjectId: response.data?.external_object_id ?? response.data?.id ?? memory.memoryId, externalVersion: response.data?.version?.toString?.() ?? null, externalHash: memory.contentHash, receipt: response };
  }
  async search(query, options = {}) { const response = await this.call('search', { query, ...options }); return (response.data?.results ?? []).map((item) => ({ backend: this.key, ...item })); }
  async fetch(externalObjectId) { return this.call('fetch', { external_object_id: externalObjectId }); }
  async deleteById(externalObjectId) { return this.call('delete', { external_object_id: externalObjectId }, true); }
  async verifyNegativeRecall({ memoryId, namespace }) { return (await this.call('verify-negative-recall', { memory_id: memoryId, namespace })).data; }
}
