import { createHash } from 'node:crypto';

export const SENSITIVITY_RANK = Object.freeze({
  public: 0,
  internal: 1,
  confidential: 2,
  restricted: 3,
  sealed: 4,
});

export class MemoryAdapterError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = 'MemoryAdapterError';
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.ambiguous = options.ambiguous ?? false;
    this.details = options.details ?? null;
  }
}

export function stableJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
}

export function sha256Hex(value) {
  const input = typeof value === 'string' ? value : stableJson(value);
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function deterministicSyncKey({ memoryId, contentHash, target, operation, schemaVersion = '1.0.0' }) {
  return sha256Hex({ memoryId, contentHash, target, operation, schemaVersion });
}

export function assertMemoryEnvelope(memory) {
  if (!memory || typeof memory !== 'object') throw new MemoryAdapterError('invalid_envelope', 'Memory envelope is required');
  for (const field of ['memoryId', 'namespace', 'memoryType', 'contentHash', 'sourceSystem', 'sourceObjectId', 'provenanceClass', 'verificationStatus', 'sensitivity']) {
    if (typeof memory[field] !== 'string' || memory[field].length === 0) {
      throw new MemoryAdapterError('invalid_envelope', `Missing memory field: ${field}`);
    }
  }
  if (!/^[0-9a-f]{64}$/.test(memory.contentHash)) {
    throw new MemoryAdapterError('invalid_content_hash', 'contentHash must be lowercase SHA-256');
  }
  if (!(memory.sensitivity in SENSITIVITY_RANK)) {
    throw new MemoryAdapterError('invalid_sensitivity', `Unknown sensitivity: ${memory.sensitivity}`);
  }
  if (memory.safeSummary != null && typeof memory.safeSummary !== 'string') {
    throw new MemoryAdapterError('invalid_safe_summary', 'safeSummary must be a string or null');
  }
  return memory;
}

export function assertProjectionAllowed(memory, adapter) {
  assertMemoryEnvelope(memory);
  const ceiling = adapter?.sensitivityCeiling ?? 'internal';
  if (!(ceiling in SENSITIVITY_RANK)) {
    throw new MemoryAdapterError('adapter_policy_invalid', `Adapter ${adapter?.key ?? 'unknown'} has invalid sensitivity ceiling`);
  }
  if (SENSITIVITY_RANK[memory.sensitivity] > SENSITIVITY_RANK[ceiling]) {
    throw new MemoryAdapterError('sensitivity_exceeds_ceiling', `${memory.sensitivity} exceeds ${adapter.key} ceiling ${ceiling}`);
  }
  if (['restricted', 'sealed'].includes(memory.sensitivity) && adapter.portable === true) {
    throw new MemoryAdapterError('portable_projection_forbidden', `Restricted memory cannot be projected to ${adapter.key}`);
  }
  if (memory.canonicalStatus && memory.canonicalStatus !== 'active') {
    throw new MemoryAdapterError('memory_not_active', `Cannot project memory in state ${memory.canonicalStatus}`);
  }
}

export function safeProjectionPayload(memory) {
  assertMemoryEnvelope(memory);
  return {
    memory_id: memory.memoryId,
    namespace: memory.namespace,
    memory_type: memory.memoryType,
    content_hash: memory.contentHash,
    safe_summary: memory.safeSummary ?? null,
    source_system: memory.sourceSystem,
    source_object_id: memory.sourceObjectId,
    source_version: memory.sourceVersion ?? null,
    source_hash: memory.sourceHash ?? null,
    provenance_class: memory.provenanceClass,
    verification_status: memory.verificationStatus,
    sensitivity: memory.sensitivity,
    canonical_payload_ref: memory.canonicalPayloadRef ?? null,
    retention_policy: memory.retentionPolicy ?? 'retain_until_review',
    metadata: memory.metadata ?? {},
  };
}

export function adapterHealth({ key, configured, capabilities, error = null }) {
  return {
    adapter: key,
    configured: Boolean(configured),
    status: configured ? 'ready' : 'blocked',
    capabilities: [...capabilities],
    error,
  };
}
