import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const WORKER_ID = Deno.env.get('MEMORY_FEDERATION_WORKER_ID') ?? 'memory-federation-dispatcher-v1';
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const SENSITIVITY_RANK = { public: 0, internal: 1, confidential: 2, restricted: 3, sealed: 4 };

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const input = await request.json();
    if (input.action === 'health') return health();
    if (input.action === 'preview') return preview(Number(input.event_id));
    if (input.action === 'dispatch') return dispatch(Number(input.event_id));
    return json({ error: 'unsupported_action', allowed: ['health', 'preview', 'dispatch'] }, 400);
  } catch (error) {
    return json({ error: 'request_failed', detail: safeError(error) }, 500);
  }
});

async function health() {
  const { data, error } = await supabase.from('memory_federation_backends_v1')
    .select('backend_key,lifecycle_state,authentication_state,write_mode,sensitivity_ceiling,approved_namespaces,error_state,metadata').order('authority_rank');
  if (error) throw error;
  const configured = Object.fromEntries((data ?? []).map((row) => [row.backend_key, adapterConfigured(row.backend_key)]));
  return json({ worker_id: WORKER_ID, backends: data, configured, secrets_exposed: false });
}

async function preview(eventId) {
  const context = await loadContext(eventId);
  return json({ event: context.event, memory: sanitizeMemory(context.memory), backend: context.backend,
    policy: evaluatePolicy(context.memory, context.backend), configured: adapterConfigured(context.backend.backend_key), external_call_performed: false });
}

async function dispatch(eventId) {
  if (!Number.isSafeInteger(eventId) || eventId <= 0) return json({ error: 'invalid_event_id' }, 400);
  const { data: claimed, error: claimError } = await supabase.rpc('claim_memory_federation_event_v1', {
    p_event_id: eventId, p_worker_id: WORKER_ID, p_lease_seconds: 120,
  });
  if (claimError) throw claimError;
  const event = claimed?.[0];
  if (!event) return json({ error: 'event_not_claimable', event_id: eventId }, 409);

  let context = null;
  try {
    context = await loadContext(eventId);
    const policy = evaluatePolicy(context.memory, context.backend);
    if (!policy.allowed) return finalize(event, 'blocked', null, { status: 'blocked', code: policy.code, detail: policy.detail });

    const existing = await loadBinding(event.memory_id, event.target_backend_key);
    if (existing?.projection_status === 'synced' && existing.external_hash === context.memory.content_hash) {
      return finalize(event, 'succeeded', {
        externalObjectId: existing.external_object_id, externalVersion: existing.external_version, externalHash: existing.external_hash,
        resultHash: await sha256Hex({ duplicate_suppressed: true, binding_id: existing.binding_id }),
        receiptRef: `supabase://memory_federation_bindings_v1/${existing.binding_id}`,
        bindingMetadata: { duplicate_suppressed: true, external_call_performed: false },
      });
    }

    const result = await invokeAdapter(context.memory, context.backend);
    await markBackendSuccess(context.backend.backend_key);
    return finalize(event, 'succeeded', result);
  } catch (error) {
    const classified = classifyError(error);
    if (context?.backend?.backend_key) await markBackendFailure(context.backend.backend_key, classified);
    return finalize(event, classified.status, null, classified.error);
  }
}

async function loadContext(eventId) {
  const { data: event, error: eventError } = await supabase.from('memory_federation_sync_events_v1').select('*').eq('event_id', eventId).single();
  if (eventError) throw eventError;
  const [{ data: memory, error: memoryError }, { data: backend, error: backendError }] = await Promise.all([
    supabase.from('memory_federation_objects_v1').select('*').eq('memory_id', event.memory_id).single(),
    supabase.from('memory_federation_backends_v1').select('*').eq('backend_key', event.target_backend_key).single(),
  ]);
  if (memoryError) throw memoryError;
  if (backendError) throw backendError;
  return { event, memory, backend };
}

async function loadBinding(memoryId, backendKey) {
  const { data, error } = await supabase.from('memory_federation_bindings_v1').select('*').eq('memory_id', memoryId).eq('backend_key', backendKey).maybeSingle();
  if (error) throw error;
  return data;
}

function evaluatePolicy(memory, backend) {
  if (memory.canonical_status !== 'active') return { allowed: false, code: 'memory_not_active', detail: memory.canonical_status };
  if (!Array.isArray(backend.approved_namespaces) || !backend.approved_namespaces.includes(memory.namespace)) return { allowed: false, code: 'namespace_not_approved', detail: memory.namespace };
  if ((SENSITIVITY_RANK[memory.sensitivity] ?? 99) > (SENSITIVITY_RANK[backend.sensitivity_ceiling] ?? -1)) return { allowed: false, code: 'sensitivity_exceeds_ceiling', detail: `${memory.sensitivity}>${backend.sensitivity_ceiling}` };
  if (backend.write_mode === 'blocked' || backend.lifecycle_state === 'excluded') return { allowed: false, code: 'backend_write_blocked', detail: backend.lifecycle_state };
  if (backend.backend_key === 'memoryplugin' && ['confidential','restricted','sealed'].includes(memory.sensitivity)) return { allowed: false, code: 'portable_projection_forbidden', detail: memory.sensitivity };
  if (!memory.safe_summary && !['pinecone','qdrant'].includes(backend.backend_key)) return { allowed: false, code: 'safe_summary_required', detail: null };
  return { allowed: true, code: null, detail: null };
}

async function invokeAdapter(memory, backend) {
  switch (backend.backend_key) {
    case 'supermemory': return invokeSupermemory(memory);
    case 'mem0': return invokeMem0(memory);
    case 'pinecone': return invokePinecone(memory);
    case 'qdrant': return invokeQdrant(memory);
    case 'mem': return invokeToolBridge('mem', memory);
    case 'casebrain': return invokeToolBridge('casebrain', memory);
    case 'memoryplugin': return invokeMemoryPlugin(memory);
    default: throw adapterError('adapter_not_implemented', false, false, { backend: backend.backend_key });
  }
}

async function invokeSupermemory(memory) {
  const receipt = await requestJson('https://api.supermemory.ai/v3/memories', {
    method: 'POST', headers: { authorization: `Bearer ${requireEnv('SUPERMEMORY_API_KEY')}` }, sideEffecting: true,
    body: { customId: memory.memory_id, content: memory.safe_summary, containerTags: [memory.namespace], metadata: sanitizeMemory(memory) },
  });
  return externalResult(receipt.data?.id ?? memory.memory_id, receipt.data?.status ?? null, memory, receipt, { adapter: 'supermemory-v3' });
}

async function invokeMem0(memory) {
  const receipt = await requestJson('https://api.mem0.ai/v3/memories/add/', {
    method: 'POST', headers: { authorization: `Token ${requireEnv('MEM0_API_KEY')}` }, sideEffecting: true,
    body: { messages: [{ role: 'user', content: memory.safe_summary }], user_id: requireEnv('MEM0_USER_ID'), metadata: sanitizeMemory(memory) },
  });
  const first = receipt.data?.results?.[0] ?? receipt.data?.[0] ?? receipt.data;
  return externalResult(first?.id ?? first?.memory_id ?? memory.memory_id, first?.event ?? null, memory, receipt, { adapter: 'mem0-v3' });
}

async function invokePinecone(memory) {
  const host = requireEnv('PINECONE_INDEX_HOST').replace(/\/$/, '');
  const vector = requireVector(memory);
  const receipt = await requestJson(`${host}/vectors/upsert`, {
    method: 'POST', headers: { 'api-key': requireEnv('PINECONE_API_KEY'), 'x-pinecone-api-version': '2026-04' }, sideEffecting: true,
    body: { namespace: memory.namespace, vectors: [{ id: memory.memory_id, values: vector, metadata: sanitizeMemory(memory) }] },
  });
  return externalResult(memory.memory_id, '2026-04', memory, receipt, { adapter: 'pinecone-2026-04', vector_dimensions: vector.length });
}

async function invokeQdrant(memory) {
  const url = requireEnv('QDRANT_URL').replace(/\/$/, '');
  const collection = requireEnv('QDRANT_COLLECTION');
  const apiKey = Deno.env.get('QDRANT_API_KEY');
  const vector = requireVector(memory);
  const receipt = await requestJson(`${url}/collections/${encodeURIComponent(collection)}/points?wait=true`, {
    method: 'PUT', headers: apiKey ? { 'api-key': apiKey } : {}, sideEffecting: true,
    body: { points: [{ id: memory.memory_id, vector, payload: sanitizeMemory(memory) }] },
  });
  return externalResult(memory.memory_id, String(receipt.data?.result?.operation_id ?? ''), memory, receipt, { adapter: 'qdrant-rest', collection, vector_dimensions: vector.length });
}

async function invokeToolBridge(key, memory) {
  const prefix = key === 'mem' ? 'MEM' : 'CASEBRAIN';
  const url = requireEnv(`${prefix}_BRIDGE_URL`).replace(/\/$/, '');
  const token = Deno.env.get(`${prefix}_BRIDGE_TOKEN`);
  const receipt = await requestJson(`${url}/upsert`, {
    method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {}, sideEffecting: true,
    body: { memory: sanitizeMemory(memory) },
  });
  return externalResult(receipt.data?.external_object_id ?? receipt.data?.id ?? memory.memory_id, String(receipt.data?.version ?? ''), memory, receipt, { adapter: `${key}-tool-bridge` });
}

async function invokeMemoryPlugin(memory) {
  const line = `tool=memoryplugin&&memory=${String(memory.safe_summary).replace(/\s+/g, ' ').trim()}`;
  throw adapterError('manual_projection_required', false, false, { projection_line: line, projection_hash: await sha256Hex(line) });
}

async function finalize(event, status, result = null, errorState = { status: 'none', code: null }) {
  const { data, error } = await supabase.rpc('finalize_memory_federation_event_v1', {
    p_event_id: event.event_id, p_worker_id: WORKER_ID, p_status: status,
    p_external_object_id: result?.externalObjectId ?? null, p_external_version: result?.externalVersion ?? null,
    p_external_hash: result?.externalHash ?? null, p_result_hash: result?.resultHash ?? null,
    p_receipt_ref: result?.receiptRef ?? null, p_error_state: errorState, p_binding_metadata: result?.bindingMetadata ?? {},
  });
  if (error) throw error;
  return json({ event: data?.[0], result, error_state: errorState, worker_id: WORKER_ID });
}

function externalResult(externalObjectId, externalVersion, memory, receipt, metadata) {
  return { externalObjectId, externalVersion, externalHash: memory.content_hash, resultHash: receipt.responseHash,
    receiptRef: `memory-federation://${receipt.responseHash}`,
    bindingMetadata: { ...metadata, response_status: receipt.status, completed_at: receipt.completedAt, raw_payload_persisted: false } };
}

async function requestJson(url, options) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, { method: options.method ?? 'GET', headers: { accept: 'application/json', ...(options.body === undefined ? {} : { 'content-type': 'application/json' }), ...(options.headers ?? {}) }, body: options.body === undefined ? undefined : JSON.stringify(options.body), signal: controller.signal });
    const text = await response.text(); let data = null;
    if (text) { try { data = JSON.parse(text); } catch { data = { non_json_body_hash: await sha256Hex(text) }; } }
    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      const blocked = response.status === 401 || response.status === 403 || response.status === 404;
      throw adapterError(blocked ? 'provider_auth_or_route_blocked' : 'provider_http_error', retryable, false, { status: response.status, body: redact(data) });
    }
    return { data, status: response.status, completedAt: new Date().toISOString(), responseHash: await sha256Hex(data ?? {}) };
  } catch (error) {
    if (error?.name === 'AbortError') throw adapterError('provider_timeout', true, Boolean(options.sideEffecting), null);
    if (error?.memoryAdapterError) throw error;
    throw adapterError('provider_network_error', true, Boolean(options.sideEffecting), { message: error?.message ?? String(error) });
  } finally { clearTimeout(timeout); }
}

function classifyError(error) {
  const ambiguous = Boolean(error?.ambiguous); const retryable = Boolean(error?.retryable);
  const status = ambiguous ? 'ambiguous' : retryable ? 'failed' : 'blocked';
  return { status, error: { status, code: error?.code ?? 'adapter_error', detail: redact(error?.details ?? { message: error?.message ?? String(error) }) } };
}
function adapterError(code, retryable, ambiguous, details) { return Object.assign(new Error(code), { memoryAdapterError: true, code, retryable, ambiguous, details }); }
function adapterConfigured(key) {
  const requirements = { supermemory:['SUPERMEMORY_API_KEY'], mem0:['MEM0_API_KEY','MEM0_USER_ID'], pinecone:['PINECONE_API_KEY','PINECONE_INDEX_HOST'], qdrant:['QDRANT_URL','QDRANT_COLLECTION'], mem:['MEM_BRIDGE_URL'], casebrain:['CASEBRAIN_BRIDGE_URL'], memoryplugin:[] };
  return (requirements[key] ?? ['UNSUPPORTED_ADAPTER']).every((name) => Boolean(Deno.env.get(name)));
}
function requireEnv(name) { const value = Deno.env.get(name); if (!value) throw adapterError('configuration_missing', false, false, { env: name }); return value; }
function requireVector(memory) {
  const vector = memory.metadata?.embedding;
  if (!Array.isArray(vector) || vector.length === 0 || !vector.every((value) => typeof value === 'number' && Number.isFinite(value))) throw adapterError('embedding_required', false, false, null);
  return vector;
}
function sanitizeMemory(memory) {
  const metadata = { ...(memory.metadata ?? {}) }; delete metadata.embedding; delete metadata.raw_content; delete metadata.source_bytes;
  return { memory_id: memory.memory_id, namespace: memory.namespace, memory_type: memory.memory_type, safe_summary: memory.safe_summary,
    content_hash: memory.content_hash, source_system: memory.source_system, source_object_id: memory.source_object_id,
    source_version: memory.source_version, source_hash: memory.source_hash, provenance_class: memory.provenance_class,
    verification_status: memory.verification_status, sensitivity: memory.sensitivity, canonical_payload_ref: memory.canonical_payload_ref,
    retention_policy: memory.retention_policy, metadata };
}
async function markBackendSuccess(key) {
  await supabase.from('memory_federation_backends_v1').update({ lifecycle_state: ['pinecone','qdrant'].includes(key) ? 'projection_only' : 'connected', authentication_state:'authenticated', freshness_status:'fresh', last_successful_probe_at:new Date().toISOString(), error_state:{status:'none',code:null}, updated_at:new Date().toISOString() }).eq('backend_key',key);
}
async function markBackendFailure(key, classified) {
  const patch = { freshness_status:'stale', error_state:classified.error, updated_at:new Date().toISOString() };
  if (['configuration_missing','provider_auth_or_route_blocked'].includes(classified.error.code)) patch.authentication_state='auth_required';
  await supabase.from('memory_federation_backends_v1').update(patch).eq('backend_key',key);
}
function canonicalize(value) { if (value===null || typeof value!=='object') return JSON.stringify(value); if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`; return `{${Object.keys(value).sort().map((key)=>`${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`; }
async function sha256Hex(value) { const text=typeof value==='string'?value:canonicalize(value); const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)); return [...new Uint8Array(digest)].map((byte)=>byte.toString(16).padStart(2,'0')).join(''); }
function redact(value) { if (value==null || typeof value!=='object') return value; if (Array.isArray(value)) return value.slice(0,20).map(redact); const output={}; for (const [key,item] of Object.entries(value)) output[key]=/token|secret|key|authorization|credential/i.test(key)?'[REDACTED]':redact(item); return output; }
function safeError(error) { return { code:error?.code ?? 'error', message:error?.message ?? String(error) }; }
function json(body,status=200) { return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}}); }
