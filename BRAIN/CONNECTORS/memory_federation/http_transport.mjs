import { MemoryAdapterError, sha256Hex } from './adapter_contract.mjs';

export async function requestJson(fetchImpl, url, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 15_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = new Date().toISOString();
  try {
    const response = await fetchImpl(url, {
      method: options.method ?? 'GET',
      headers: {
        accept: 'application/json',
        ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(options.headers ?? {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
    const text = await response.text();
    let data = null;
    if (text.length > 0) {
      try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 2048) }; }
    }
    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      throw new MemoryAdapterError('http_error', `HTTP ${response.status} from ${new URL(url).host}`, {
        retryable,
        details: { status: response.status, body: data },
      });
    }
    return {
      data,
      status: response.status,
      startedAt,
      completedAt: new Date().toISOString(),
      responseHash: sha256Hex(data ?? {}),
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new MemoryAdapterError('request_timeout', `Request timed out after ${timeoutMs}ms`, { retryable: true, ambiguous: options.sideEffecting === true });
    }
    if (error instanceof MemoryAdapterError) throw error;
    throw new MemoryAdapterError('network_error', error?.message ?? 'Network error', { retryable: true, ambiguous: options.sideEffecting === true, cause: error });
  } finally {
    clearTimeout(timeout);
  }
}
