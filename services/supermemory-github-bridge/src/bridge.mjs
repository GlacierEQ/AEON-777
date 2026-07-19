import { randomUUID } from "node:crypto";
import { actionHash, consumeConfirmation, createConfirmation, createPlanReceipt, verifyReceipt } from "./approvals.mjs";
import { sha256 } from "./canonical.mjs";
import { fail } from "./errors.mjs";
import { assertSafePath, assertSafeReadPath, assertSafeText, isMutation, normalizeAction, validatePolicy } from "./policy.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA = /^[0-9a-f]{40}$/i;

function number(value, label) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) fail(400, "invalid_payload", `${label} must be a positive integer.`);
  return parsed;
}

function text(value, label, maxBytes = 8_192) {
  assertSafeText(value, label, maxBytes);
  return value;
}

function shortText(value, label, maxBytes = 500) {
  return text(value, label, maxBytes);
}

function exactSha(value, label) {
  if (typeof value !== "string" || !SHA.test(value)) fail(400, "invalid_payload", `${label} must be a 40-character SHA.`);
  return value.toLowerCase();
}

function safeWorkflowId(value) {
  if (typeof value !== "string" || !/^(?:\d+|[A-Za-z0-9_.-]+\.ya?ml)$/.test(value)) fail(400, "invalid_payload", "workflow_id must be a numeric ID or a simple workflow filename.");
  return value;
}

function safeInputObject(value) {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length > 20) fail(400, "invalid_payload", "workflow inputs must be a small JSON object.");
  for (const [key, item] of Object.entries(value)) {
    if (!/^[A-Za-z_][A-Za-z0-9_-]{0,63}$/.test(key) || !["string", "number", "boolean"].includes(typeof item) || Buffer.byteLength(String(item), "utf8") > 1_000) {
      fail(400, "invalid_payload", "workflow inputs contain an invalid key or value.");
    }
  }
  return value;
}

function validatePayload(action, policyResult, config) {
  const { payload } = action;
  const branch = policyResult.branch;
  switch (action.type) {
    case "repository.verify":
    case "branch.read":
      return {};
    case "contents.read":
      assertSafeReadPath(payload.path, branch);
      return { path: payload.path };
    case "commit.read":
      return { sha: exactSha(payload.sha, "sha") };
    case "pull_request.read":
      return { pull_number: number(payload.pull_number, "pull_number") };
    case "workflow.read":
      return { workflow_id: safeWorkflowId(payload.workflow_id) };
    case "commit.create": {
      if (!Array.isArray(payload.files) || payload.files.length === 0 || payload.files.length > 20) fail(400, "invalid_payload", "commit.create requires one to twenty files.");
      const files = payload.files.map((file) => {
        if (!file || typeof file !== "object" || Array.isArray(file)) fail(400, "invalid_payload", "Each commit file must be an object.");
        assertSafePath(file.path, branch);
        const encoding = file.encoding || "utf-8";
        if (!["utf-8", "base64"].includes(encoding) || typeof file.content !== "string") fail(400, "invalid_payload", "Commit file content must be UTF-8 or base64 text.");
        if (encoding === "base64") {
          if (!/^[A-Za-z0-9+/=\r\n]+$/.test(file.content)) fail(400, "invalid_payload", "Base64 file content is malformed.");
          const decoded = Buffer.from(file.content, "base64");
          if (decoded.length > config.limits.maxFileBytes) fail(413, "content_too_large", "A commit file exceeds the configured file limit.");
          assertSafeText(decoded.toString("utf8"), `content for ${file.path}`, config.limits.maxFileBytes);
        } else {
          text(file.content, `content for ${file.path}`, config.limits.maxFileBytes);
        }
        return { path: file.path, content: file.content, encoding };
      });
      return { message: shortText(payload.message, "commit message", 2_000), files };
    }
    case "push":
      return { commit_sha: exactSha(payload.commit_sha, "commit_sha") };
    case "pull_request.create": {
      if (typeof payload.head !== "string" || !policyResult.repository.branches[payload.head]) fail(403, "head_branch_not_allowed", "The pull request head must be an exact allowlisted branch in the same repository.");
      return { title: shortText(payload.title, "pull request title", 500), body: typeof payload.body === "string" ? text(payload.body, "pull request body", 32_000) : "", head: payload.head, draft: Boolean(payload.draft) };
    }
    case "pull_request.merge": {
      const mergeMethod = payload.merge_method || "squash";
      if (!["merge", "squash", "rebase"].includes(mergeMethod)) fail(400, "invalid_payload", "merge_method is invalid.");
      return { pull_number: number(payload.pull_number, "pull_number"), merge_method: mergeMethod, ...(payload.commit_title === undefined ? {} : { commit_title: shortText(payload.commit_title, "merge title", 500) }), ...(payload.commit_message === undefined ? {} : { commit_message: text(payload.commit_message, "merge message", 8_192) }) };
    }
    case "workflow.dispatch": {
      const workflowId = safeWorkflowId(payload.workflow_id);
      if (!branch.workflowIds.includes(workflowId)) fail(403, "workflow_not_allowlisted", "The workflow ID is not allowlisted for this branch.");
      return { workflow_id: workflowId, inputs: safeInputObject(payload.inputs) };
    }
    case "delete":
      assertSafePath(payload.path, branch);
      return { path: payload.path, sha: exactSha(payload.sha, "sha"), message: shortText(payload.message, "delete message", 2_000) };
    case "external.message":
      return { issue_number: number(payload.issue_number, "issue_number"), body: text(payload.body, "message body", 16_384) };
    default:
      fail(400, "unsupported_action", "The requested action type is not supported.");
  }
}

function safeActionPreview(value) {
  try {
    return {
      type: typeof value?.type === "string" ? value.type.slice(0, 80) : null,
      repository: typeof value?.repository === "string" ? value.repository.slice(0, 256) : null,
      repository_id: value?.repository_id ?? value?.repositoryId ?? null,
      branch: typeof value?.branch === "string" ? value.branch.slice(0, 256) : null
    };
  } catch { return {}; }
}

function approvalSummary(action) {
  const common = {
    type: action.type,
    repository: action.repository,
    repository_id: action.repositoryId,
    branch: action.branch,
    ...(action.expectedHeadSha ? { expected_head_sha: action.expectedHeadSha } : {})
  };
  switch (action.type) {
    case "commit.create":
      return { ...common, message: action.payload.message, files: action.payload.files.map((file) => ({ path: file.path, encoding: file.encoding, content_sha256: sha256(file.content) })) };
    case "push":
      return { ...common, commit_sha: action.payload.commit_sha };
    case "pull_request.create":
      return { ...common, title: action.payload.title, head: action.payload.head, body_sha256: sha256(action.payload.body), draft: action.payload.draft };
    case "pull_request.merge":
      return { ...common, pull_number: action.payload.pull_number, merge_method: action.payload.merge_method, commit_title: action.payload.commit_title || null, commit_message_sha256: action.payload.commit_message ? sha256(action.payload.commit_message) : null };
    case "workflow.dispatch":
      return { ...common, workflow_id: action.payload.workflow_id, inputs_sha256: sha256(action.payload.inputs) };
    case "delete":
      return { ...common, path: action.payload.path, blob_sha: action.payload.sha, message: action.payload.message };
    case "external.message":
      return { ...common, issue_number: action.payload.issue_number, body_sha256: sha256(action.payload.body) };
    default:
      return common;
  }
}

export class BridgeService {
  constructor({ config, github, memory, ledger, now = () => new Date() }) {
    this.config = config;
    this.github = github;
    this.memory = memory;
    this.ledger = ledger;
    this.now = now;
  }

  async audit({ traceId, identity, phase, status, action, requestHash, response, retrieval, confirmation, error }) {
    return this.ledger.append({
      event_id: randomUUID(),
      trace_id: traceId,
      phase,
      status,
      at: this.now().toISOString(),
      actor: identity.actor,
      actor_role: identity.role,
      action: action?.type || null,
      repository: action?.repository || null,
      repository_id: action?.repositoryId || null,
      branch: action?.branch || null,
      expected_head_sha: action?.expectedHeadSha || null,
      request_sha256: requestHash || null,
      response_sha256: response === undefined ? null : sha256(response),
      retrieval_request_sha256: retrieval?.requestSha256 || null,
      retrieval_response_sha256: retrieval?.responseSha256 || null,
      confirmation_id: confirmation?.id || null,
      approver: confirmation?.approver || null,
      policy_version: this.config.policy.version,
      allowlist_sha256: this.config.policyHash,
      ...(response?.commit_sha ? { resulting_commit_sha: response.commit_sha } : response?.result?.commit_sha ? { resulting_commit_sha: response.result.commit_sha } : {}),
      ...(error?.code ? { error_code: error.code } : {})
    });
  }

  capabilities() {
    return {
      mode: this.config.mode,
      policy_version: this.config.policy.version,
      policy_sha256: this.config.policyHash,
      endpoint: "/v1/bridge",
      authentication: "Bridge-HMAC request signing with separate agent and approver identities",
      operations: ["capabilities", "verify", "plan", "confirm", "execute"],
      configured_repositories: this.config.policy.repositories.map((repository) => ({
        id: repository.id,
        full_name: repository.fullName,
        branches: Object.fromEntries(Object.entries(repository.branches).map(([name, permissions]) => [name, { read: permissions.read, write: permissions.write, write_actions: permissions.writeActions }]))
      })),
      safeguards: {
        default_deny: true,
        retrieval_before_github: true,
        audit_hash_chain: true,
        confirmation_for_mutations: true,
        write_mode_enabled: this.config.mode === "guarded"
      }
    };
  }

  async retrieve(action, identity, traceId, requestHash) {
    let retrieval;
    try {
      retrieval = await this.memory.retrieve({ action, actor: identity.actor });
    } catch (error) {
      await this.audit({ traceId, identity, phase: "memory_retrieval", status: "failed", action, requestHash, error }).catch(() => undefined);
      throw error;
    }
    await this.audit({ traceId, identity, phase: "memory_retrieval", status: "succeeded", action, requestHash, retrieval });
    return retrieval;
  }

  async read(action, repository) {
    switch (action.type) {
      case "repository.verify": return this.github.repositoryVerify(repository, action.branch);
      case "branch.read": return { branch: action.branch, commit_sha: (await this.github.branchHead(repository, action.branch)).sha };
      case "contents.read": return this.github.readFile(repository, action.branch, action.payload.path);
      case "commit.read": return this.github.readCommit(repository, action.payload.sha);
      case "pull_request.read": return this.github.readPullRequest(repository, action.payload.pull_number);
      case "workflow.read": return this.github.readWorkflow(repository, action.payload.workflow_id);
      default: fail(400, "invalid_read_action", "This action is not a read operation.");
    }
  }

  async mutate(action, repository) {
    await this.github.assertExpectedHead(repository, action.branch, action.expectedHeadSha);
    switch (action.type) {
      case "commit.create": return this.github.createCommit(repository, action.branch, action.payload, action.expectedHeadSha);
      case "push": return this.github.push(repository, action.branch, action.payload, action.expectedHeadSha);
      case "pull_request.create": return this.github.createPullRequest(repository, action.branch, action.payload);
      case "pull_request.merge": return this.github.mergePullRequest(repository, action.payload, action.expectedHeadSha);
      case "workflow.dispatch": return this.github.dispatchWorkflow(repository, action.branch, action.payload);
      case "delete": return this.github.deleteFile(repository, action.branch, action.payload);
      case "external.message": return this.github.sendExternalMessage(repository, action.payload);
      default: fail(400, "invalid_mutation_action", "This action is not a mutation operation.");
    }
  }

  async execute({ body, identity, traceId }) {
    const op = body?.op;
    if (!new Set(["capabilities", "verify", "plan", "confirm", "execute"]).has(op)) fail(400, "invalid_operation", "op must be capabilities, verify, plan, confirm, or execute.");
    if (op === "capabilities") {
      if (identity.role !== "agent") fail(403, "invalid_role", "Only a remote agent may request bridge capabilities.");
      const response = { ok: true, capabilities: this.capabilities() };
      await this.audit({ traceId, identity, phase: "capabilities", status: "succeeded", response });
      return { status: 200, body: response };
    }
    if (op === "confirm") return this.confirm({ body, identity, traceId });
    if (identity.role !== "agent") fail(403, "invalid_role", "Only a remote agent may plan or execute bridge actions.");
    let action;
    let policyResult;
    const requestHash = sha256({ op, actor: identity.actor, idempotency_key: body?.idempotency_key || null, action: body?.action || null });
    try {
      action = normalizeAction(body.action);
      policyResult = validatePolicy({ action, policy: this.config.policy, mode: this.config.mode });
      action.payload = validatePayload(action, policyResult, this.config);
    } catch (error) {
      await this.audit({ traceId, identity, phase: "policy", status: "denied", action: safeActionPreview(body?.action), requestHash, error }).catch(() => undefined);
      throw error;
    }
    if (op === "verify" && action.type !== "repository.verify") fail(400, "invalid_verification_action", "verify only accepts repository.verify.");
    await this.audit({ traceId, identity, phase: "received", status: "accepted", action, requestHash });
    const retrieval = await this.retrieve(action, identity, traceId, requestHash);
    if (op === "plan") {
      const plan = createPlanReceipt({ config: this.config, actor: identity.actor, actionHash: actionHash(action), memoryReceiptHash: retrieval.responseSha256, action, now: this.now() });
      const response = {
        ok: true,
        plan: {
          id: plan.body.id,
          action_sha256: plan.body.action_sha256,
          expires_at: plan.body.expires_at,
          confirmation_required: policyResult.mutation,
          approval_summary: approvalSummary(action),
          token: plan.token
        },
        memory: { ...retrieval.receipt, context: retrieval.context, trust: "untrusted_reference_only" }
      };
      await this.audit({ traceId, identity, phase: "planned", status: "succeeded", action, requestHash, response, retrieval });
      return { status: 200, body: response };
    }
    if (!policyResult.mutation) {
      let githubResponse;
      try {
        githubResponse = await this.read(action, policyResult.repository);
      } catch (error) {
        await this.audit({ traceId, identity, phase: "github", status: "failed", action, requestHash, retrieval, error }).catch(() => undefined);
        throw error;
      }
      const response = { ok: true, action: action.type, result: githubResponse, memory: retrieval.receipt };
      await this.audit({ traceId, identity, phase: "completed", status: "succeeded", action, requestHash, response, retrieval });
      return { status: 200, body: response };
    }
    return this.executeMutation({ body, identity, traceId, action, policyResult, requestHash, retrieval });
  }

  async confirm({ body, identity, traceId }) {
    if (identity.role !== "approver") fail(403, "approver_required", "Only a separate approver identity can confirm a mutation.");
    if (body?.decision !== "approve") fail(400, "explicit_approval_required", "Confirmation requires decision: approve from the approver identity.");
    const plan = verifyReceipt(this.config.signingSecret, body?.plan_token, "plan", this.now());
    if (plan.policy_sha256 !== this.config.policyHash || !plan.action) fail(409, "stale_plan", "The plan was created under a different bridge policy and must be recreated.");
    const confirmation = createConfirmation({ config: this.config, plan, approver: identity.actor, now: this.now() });
    const response = { ok: true, confirmation: { id: confirmation.body.id, plan_id: plan.id, expires_at: confirmation.body.expires_at, token: confirmation.token } };
    await this.audit({ traceId, identity, phase: "confirmed", status: "succeeded", action: { type: plan.action.type, repository: plan.action.repository, repositoryId: plan.action.repository_id, branch: plan.action.branch, expectedHeadSha: plan.action.expected_head_sha }, requestHash: plan.action_sha256, response, confirmation: confirmation.body });
    return { status: 200, body: response };
  }

  async executeMutation({ body, identity, traceId, action, policyResult, requestHash, retrieval }) {
    const key = body?.idempotency_key;
    if (typeof key !== "string" || !UUID.test(key)) fail(400, "idempotency_key_required", "Mutations require a UUID idempotency_key.");
    const previous = await this.ledger.getIdempotency({ actor: identity.actor, key });
    if (previous) {
      if (previous.requestSha256 !== requestHash) fail(409, "idempotency_conflict", "This idempotency key is already bound to another request.");
      if (previous.status === "completed" && previous.response) return { status: 200, body: previous.response };
      fail(409, "request_in_progress", "This mutation is already in progress or awaiting final capture.");
    }
    const confirmation = await consumeConfirmation({ config: this.config, ledger: this.ledger, confirmationToken: body?.confirmation_token, actor: identity.actor, actionHash: actionHash(action), now: this.now() });
    const reservation = await this.ledger.reserveIdempotency({ actor: identity.actor, key, requestSha256: requestHash });
    if (!reservation.reserved) {
      if (reservation.record?.requestSha256 === requestHash && reservation.record?.status === "completed" && reservation.record.response) return { status: 200, body: reservation.record.response };
      fail(409, "idempotency_conflict", "This idempotency key is already reserved.");
    }
    await this.audit({ traceId, identity, phase: "executing", status: "started", action, requestHash, retrieval, confirmation });
    let githubResponse;
    try {
      githubResponse = await this.mutate(action, policyResult.repository);
    } catch (error) {
      const failure = { ok: false, action: action.type, error: { code: error.code || "github_failed", message: error.message }, trace_id: traceId };
      await this.ledger.completeIdempotency({ actor: identity.actor, key, requestSha256: requestHash, status: "completed", response: failure }).catch(() => undefined);
      await this.audit({ traceId, identity, phase: "completed", status: "failed", action, requestHash, retrieval, confirmation, response: failure, error }).catch(() => undefined);
      throw error;
    }
    const response = { ok: true, action: action.type, result: githubResponse, confirmation_id: confirmation.id, memory: retrieval.receipt };
    const completed = await this.ledger.completeIdempotency({ actor: identity.actor, key, requestSha256: requestHash, status: "completed", response });
    if (!completed) return { status: 202, body: { ok: true, action: action.type, result: githubResponse, audit_status: "capture_pending", trace_id: traceId } };
    try {
      await this.audit({ traceId, identity, phase: "completed", status: "succeeded", action, requestHash, retrieval, confirmation, response });
    } catch {
      return { status: 202, body: { ...response, audit_status: "capture_pending", trace_id: traceId } };
    }
    return { status: 200, body: response };
  }
}
