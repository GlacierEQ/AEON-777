import { adapterHealth, assertProjectionAllowed, sha256Hex } from '../adapter_contract.mjs';

export class MemoryPluginAdapter {
  constructor() {
    this.key = 'memoryplugin';
    this.sensitivityCeiling = 'internal';
    this.portable = true;
    this.capabilities = ['render_portable_projection'];
  }
  async health() { return adapterHealth({ key: this.key, configured: true, capabilities: this.capabilities }); }
  async upsert(memory) {
    assertProjectionAllowed(memory, this);
    const compact = (memory.safeSummary ?? '').replace(/\s+/g, ' ').trim();
    if (!compact) throw new Error('MemoryPlugin projection requires a non-empty safe summary');
    const line = `tool=memoryplugin&&memory=${compact}`;
    return { externalObjectId: sha256Hex(line), externalVersion: 'visible-text-v1', externalHash: memory.contentHash, manualProjectionRequired: true, projectionLine: line };
  }
}
