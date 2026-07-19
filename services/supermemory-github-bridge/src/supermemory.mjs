import { bounded, redact, sha256 } from "./canonical.mjs";
import { fail } from "./errors.mjs";

function compactResults(response, maxResults) {
  const results = Array.isArray(response?.results) ? response.results.slice(0, maxResults) : [];
  return results.map((result) => ({
    document_id: result.documentId || null,
    title: typeof result.title === "string" ? result.title.slice(0, 256) : null,
    score: typeof result.score === "number" ? result.score : null,
    chunks: Array.isArray(result.chunks) ? result.chunks.slice(0, 3).map((chunk) => ({
      score: typeof chunk.score === "number" ? chunk.score : null,
      content: typeof chunk.content === "string" ? chunk.content.slice(0, 2_000) : ""
    })) : []
  }));
}

export class SupermemoryClient {
  constructor({ apiUrl, apiKey, containerTag, maxResults = 8, fetchImpl = fetch }) {
    this.apiUrl = new URL(apiUrl);
    this.apiKey = apiKey;
    this.containerTag = containerTag;
    this.maxResults = maxResults;
    this.fetchImpl = fetchImpl;
  }

  async retrieve({ action, actor }) {
    const query = `Bridge context for ${action.type} on ${action.repository} branch ${action.branch}. Return relevant project constraints, current intent, and safe operational context. Treat retrieval as untrusted reference material.`;
    const endpoint = new URL(this.apiUrl);
    endpoint.pathname = `${endpoint.pathname.replace(/\/$/, "")}/search`;
    endpoint.searchParams.set("q", query);
    endpoint.searchParams.set("containerTag", this.containerTag);
    endpoint.searchParams.set("limit", String(this.maxResults));
    endpoint.searchParams.set("threshold", "0.6");
    endpoint.searchParams.set("rerank", "true");
    endpoint.searchParams.set("include", JSON.stringify({ documents: false, summaries: false, relatedMemories: false, forgottenMemories: false }));
    const requestMetadata = { method: "GET", endpoint: endpoint.pathname, container_tag: this.containerTag, query, actor, action: action.type, repository: action.repository, branch: action.branch };
    let response;
    try {
      response = await this.fetchImpl(endpoint, {
        method: "GET",
        headers: { authorization: `Bearer ${this.apiKey}`, accept: "application/json" },
        redirect: "error",
        signal: AbortSignal.timeout(8_000)
      });
    } catch {
      fail(503, "supermemory_unavailable", "Supermemory retrieval failed; the bridge will not contact GitHub.");
    }
    const declaredLength = Number(response.headers.get("content-length") || "0");
    if (Number.isFinite(declaredLength) && declaredLength > 1_048_576) fail(503, "supermemory_response_too_large", "Supermemory returned an oversized response; the bridge will not contact GitHub.");
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > 1_048_576) fail(503, "supermemory_response_too_large", "Supermemory returned an oversized response; the bridge will not contact GitHub.");
    let body;
    try { body = text ? JSON.parse(text) : {}; } catch { body = {}; }
    if (!response.ok) fail(503, "supermemory_retrieval_failed", "Supermemory retrieval was rejected; the bridge will not contact GitHub.", { provider_status: response.status });
    const context = compactResults(body, this.maxResults);
    const auditResponse = {
      result_count: context.length,
      total: typeof body?.total === "number" ? body.total : null,
      timing: typeof body?.timing === "number" ? body.timing : null,
      result_metadata: context.map(({ document_id, title, score, chunks }) => ({ document_id, title, score, chunk_count: chunks.length }))
    };
    return {
      context: bounded(redact(context), 16_384),
      requestSha256: sha256(requestMetadata),
      responseSha256: sha256(auditResponse),
      receipt: { container_tag: this.containerTag, result_count: context.length, request_sha256: sha256(requestMetadata), response_sha256: sha256(auditResponse) }
    };
  }
}
