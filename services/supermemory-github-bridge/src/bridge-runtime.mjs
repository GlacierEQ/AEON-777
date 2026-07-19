import { randomUUID } from "node:crypto";
import { loadConfig } from "./config.mjs";
import { authenticateRequest, isSecureRequest } from "./auth.mjs";
import { BridgeService } from "./bridge.mjs";
import { BridgeError, fail, problem } from "./errors.mjs";
import { GitHubAppClient } from "./github.mjs";
import { createLedger } from "./ledger.mjs";
import { SupermemoryClient } from "./supermemory.mjs";

function header(headers, name) {
  return typeof headers?.get === "function" ? headers.get(name) : headers?.[name] ?? headers?.[name.toLowerCase()];
}

function contentTypeJson(headers) {
  return String(header(headers, "content-type") || "").toLowerCase().split(";")[0] === "application/json";
}

function parseBody(raw) {
  if (!raw || raw.trim() === "") fail(400, "body_required", "A JSON bridge request body is required.");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) fail(400, "invalid_body", "The bridge request body must be a JSON object.");
    return parsed;
  } catch (error) {
    if (error instanceof BridgeError) throw error;
    fail(400, "invalid_json", "The bridge request body is not valid JSON.");
  }
}

function response(status, body) {
  return { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" }, body: JSON.stringify(body) };
}

export async function createApplication(options = {}) {
  const config = options.config || loadConfig(options.env || process.env);
  if (!config.ok) {
    return {
      async handle() {
        return response(503, { ok: false, error: { code: "bridge_not_configured", message: "The bridge is fail-closed until required deployment configuration is present." }, trace_id: randomUUID() });
      },
      config
    };
  }
  const ledger = options.ledger || await createLedger(config, { fetchImpl: options.fetchImpl });
  const github = options.github || new GitHubAppClient({ ...config.github, fetchImpl: options.fetchImpl || fetch, ...(options.now ? { now: options.now } : {}) });
  const memory = options.memory || new SupermemoryClient({ ...config.supermemory, maxResults: config.limits.maxMemoryResults, fetchImpl: options.fetchImpl || fetch });
  const service = options.service || new BridgeService({ config, github, memory, ledger, ...(options.now ? { now: options.now } : {}) });
  return {
    config,
    service,
    async handle({ method, pathname, headers, rawBody, encrypted = false }) {
      const traceId = header(headers, "x-request-id") || randomUUID();
      try {
        if (pathname !== "/v1/bridge" && pathname !== "/api/bridge") fail(404, "not_found", "The requested endpoint does not exist.");
        if (method !== "POST") fail(405, "method_not_allowed", "Only POST is supported by this bridge endpoint.");
        if (!isSecureRequest({ headers, encrypted, config })) fail(400, "https_required", "The bridge requires HTTPS.");
        if (!contentTypeJson(headers)) fail(415, "json_required", "Bridge requests must use application/json.");
        if (Buffer.byteLength(rawBody || "", "utf8") > config.limits.maxBodyBytes) fail(413, "payload_too_large", "The bridge request exceeds the configured body limit.");
        const identity = await authenticateRequest({ headers, method, pathname: "/v1/bridge", rawBody, config, ledger, now: options.now?.() || new Date() });
        const body = parseBody(rawBody);
        const result = await service.execute({ body, identity, traceId });
        return response(result.status, { ...result.body, trace_id: result.body.trace_id || traceId });
      } catch (error) {
        const formatted = problem(error, traceId);
        return response(formatted.status, formatted.body);
      }
    }
  };
}

export async function readNodeBody(req, maxBytes) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > maxBytes) fail(413, "payload_too_large", "The bridge request exceeds the configured body limit.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function handleNodeRequest(app, req, res, options = {}) {
  let outcome;
  try {
    const rawBody = await readNodeBody(req, app.config?.limits?.maxBodyBytes || 65_536);
    outcome = await app.handle({
      method: req.method,
      pathname: options.pathname || new URL(req.url, "http://localhost").pathname,
      headers: req.headers,
      rawBody,
      encrypted: Boolean(req.socket?.encrypted)
    });
  } catch (error) {
    const formatted = problem(error, randomUUID());
    outcome = response(formatted.status, formatted.body);
  }
  res.writeHead(outcome.status, outcome.headers);
  res.end(outcome.body);
}
