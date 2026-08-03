import { MemoryAdapterError, assertMemoryEnvelope, deterministicSyncKey } from './adapter_contract.mjs';

export class MemoryFederationOrchestrator {
  constructor({ adapters = {}, authorityRanks = {} } = {}) {
    this.adapters = new Map(Object.entries(adapters));
    this.authorityRanks = { ...authorityRanks };
  }

  register(adapter) {
    if (!adapter?.key) throw new MemoryAdapterError('adapter_invalid', 'Adapter key is required');
    this.adapters.set(adapter.key, adapter);
    return this;
  }

  async health() {
    const results = [];
    for (const [key, adapter] of this.adapters) {
      try { results.push(await adapter.health()); }
      catch (error) { results.push({ adapter: key, configured: false, status: 'failed', capabilities: [], error: normalizeError(error) }); }
    }
    return results;
  }

  async project(memory, targets, context = {}) {
    assertMemoryEnvelope(memory);
    const results = [];
    for (const target of targets) {
      const adapter = this.adapters.get(target);
      const idempotencyKey = deterministicSyncKey({ memoryId: memory.memoryId, contentHash: memory.contentHash, target, operation: 'upsert' });
      if (!adapter) {
        results.push({ target, status: 'blocked', idempotencyKey, error: { code: 'adapter_unavailable', message: `No adapter registered for ${target}` } });
        continue;
      }
      try {
        const health = await adapter.health();
        if (!health.configured) {
          results.push({ target, status: 'blocked', idempotencyKey, error: { code: 'adapter_unconfigured', message: `${target} is not configured` } });
          continue;
        }
        const output = await adapter.upsert(memory, context[target] ?? context);
        results.push({ target, status: output.manualProjectionRequired ? 'manual_projection' : 'succeeded', idempotencyKey, output });
      } catch (error) {
        results.push({ target, status: error?.ambiguous ? 'ambiguous' : error?.retryable ? 'failed' : 'blocked', idempotencyKey, error: normalizeError(error) });
      }
    }
    return { memoryId: memory.memoryId, completed: results.every((item) => ['succeeded', 'manual_projection', 'blocked'].includes(item.status)), results };
  }

  async searchQuorum(query, { targets, namespace, limit = 10, contexts = {} } = {}) {
    const searched = [];
    for (const target of targets) {
      const adapter = this.adapters.get(target);
      if (!adapter?.search) {
        searched.push({ target, status: 'blocked', results: [], error: { code: 'search_unavailable' } });
        continue;
      }
      try {
        const health = await adapter.health();
        if (!health.configured) {
          searched.push({ target, status: 'blocked', results: [], error: { code: 'adapter_unconfigured' } });
          continue;
        }
        const results = await adapter.search(query, { namespace, limit, ...(contexts[target] ?? {}) });
        searched.push({ target, status: 'succeeded', results });
      } catch (error) {
        searched.push({ target, status: 'failed', results: [], error: normalizeError(error) });
      }
    }
    const merged = mergeSearchResults(searched.flatMap((item) => item.results), this.authorityRanks).slice(0, limit);
    return { query, namespace, searched, results: merged };
  }
}

export function mergeSearchResults(results, authorityRanks = {}) {
  const groups = new Map();
  for (const item of results) {
    const key = item.memoryId ?? item.contentHash ?? `${item.backend}:${item.externalObjectId}`;
    const rank = authorityRanks[item.backend] ?? 100;
    const weighted = Number(item.score ?? 0) * (1 + 1 / Math.max(rank, 1));
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, { ...item, weightedScore: weighted, corroboratingBackends: [item.backend] });
      continue;
    }
    existing.corroboratingBackends = [...new Set([...existing.corroboratingBackends, item.backend])];
    existing.weightedScore = Math.max(existing.weightedScore, weighted) + 0.02 * (existing.corroboratingBackends.length - 1);
    if (rank < (authorityRanks[existing.backend] ?? 100)) {
      Object.assign(existing, { ...item, weightedScore: existing.weightedScore, corroboratingBackends: existing.corroboratingBackends });
    }
  }
  return [...groups.values()].sort((a, b) => b.weightedScore - a.weightedScore);
}

function normalizeError(error) {
  return {
    code: error?.code ?? 'adapter_error',
    message: error?.message ?? String(error),
    retryable: Boolean(error?.retryable),
    ambiguous: Boolean(error?.ambiguous),
    details: error?.details ?? null,
  };
}
