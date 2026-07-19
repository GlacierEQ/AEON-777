import { loadConfig } from "../src/config.mjs";

export const AGENT_SECRET = "agent-secret-which-is-longer-than-twenty-four-chars";
export const APPROVER_SECRET = "approver-secret-which-is-longer-than-twenty-four";

export function config(overrides = {}) {
  return loadConfig({
    NODE_ENV: "test",
    BRIDGE_MODE: "guarded",
    BRIDGE_POLICY_JSON: JSON.stringify({
      version: "test-policy-1",
      repositories: [{
        id: "1001",
        fullName: "allowed/repository",
        installationId: "2001",
        branches: {
          main: {
            read: true,
            write: true,
            writeActions: ["commit.create", "push", "pull_request.create", "pull_request.merge", "workflow.dispatch", "delete", "external.message"],
            workflowIds: ["build.yml"],
            writePathPrefixes: ["src/"],
            protectedPaths: [".env", "secrets", ".pem", ".key"]
          }
        }
      }]
    }),
    BRIDGE_AGENT_SECRETS_JSON: JSON.stringify({ "remote-agent": AGENT_SECRET }),
    BRIDGE_APPROVER_SECRETS_JSON: JSON.stringify({ "human-operator": APPROVER_SECRET }),
    BRIDGE_SIGNING_SECRET: "receipt-signing-secret-which-is-at-least-twenty-four",
    BRIDGE_AUDIT_SIGNING_SECRET: "audit-signing-secret-which-is-at-least-twenty-four--",
    BRIDGE_LEDGER_DRIVER: "sqlite",
    BRIDGE_LEDGER_PATH: "/tmp/bridge-test.sqlite",
    SUPERMEMORY_API_KEY: "supermemory-test-secret",
    GITHUB_APP_ID: "12345",
    GITHUB_APP_PRIVATE_KEY_B64: Buffer.from("-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----").toString("base64"),
    ...overrides
  });
}

export class FakeLedger {
  constructor(log = []) {
    this.log = log;
    this.events = [];
    this.nonces = new Set();
    this.confirmations = new Set();
    this.idempotency = new Map();
  }

  async append(event) {
    this.log.push(`audit:${event.phase}:${event.status}`);
    this.events.push(event);
    return { eventSha256: `event-${this.events.length}`, capturedAt: new Date().toISOString() };
  }

  async claimNonce({ subject, nonce }) {
    const key = `${subject}:${nonce}`;
    if (this.nonces.has(key)) return false;
    this.nonces.add(key);
    return true;
  }

  async consumeConfirmation({ id }) {
    if (this.confirmations.has(id)) return false;
    this.confirmations.add(id);
    return true;
  }

  async getIdempotency({ actor, key }) {
    return this.idempotency.get(`${actor}:${key}`) || null;
  }

  async reserveIdempotency({ actor, key, requestSha256 }) {
    const id = `${actor}:${key}`;
    const record = this.idempotency.get(id);
    if (record) return { reserved: false, record };
    this.idempotency.set(id, { requestSha256, status: "in_progress", response: null });
    return { reserved: true, record: null };
  }

  async completeIdempotency({ actor, key, requestSha256, status, response }) {
    const id = `${actor}:${key}`;
    const record = this.idempotency.get(id);
    if (!record || record.requestSha256 !== requestSha256) return false;
    this.idempotency.set(id, { requestSha256, status, response });
    return true;
  }
}

export class FakeMemory {
  constructor(log = []) { this.log = log; this.calls = []; }
  async retrieve(value) {
    this.log.push("memory.retrieve");
    this.calls.push(value);
    return {
      context: [{ document_id: "memory-1", title: "Safe context", chunks: [] }],
      requestSha256: "memory-request-hash",
      responseSha256: "memory-response-hash",
      receipt: { container_tag: "sm_project_github", result_count: 1, request_sha256: "memory-request-hash", response_sha256: "memory-response-hash" }
    };
  }
}

export class FakeGithub {
  constructor(log = []) { this.log = log; this.calls = []; }
  record(name, ...args) { this.log.push(`github.${name}`); this.calls.push({ name, args }); }
  async repositoryVerify(repository, branch) { this.record("repositoryVerify", repository, branch); return { repository: { id: repository.id, full_name: repository.fullName }, branch, commit_sha: "a".repeat(40) }; }
  async branchHead(repository, branch) { this.record("branchHead", repository, branch); return { sha: "a".repeat(40) }; }
  async assertExpectedHead(repository, branch, sha) { this.record("assertExpectedHead", repository, branch, sha); return { sha }; }
  async readFile(repository, branch, path) { this.record("readFile", repository, branch, path); return { path, content: "ZmlsZQ==", sha: "b".repeat(40) }; }
  async readCommit(repository, sha) { this.record("readCommit", repository, sha); return { commit_sha: sha }; }
  async readPullRequest(repository, number) { this.record("readPullRequest", repository, number); return { pull_request_number: number }; }
  async readWorkflow(repository, workflowId) { this.record("readWorkflow", repository, workflowId); return { workflow_id: workflowId }; }
  async createCommit(repository, branch, payload, sha) { this.record("createCommit", repository, branch, payload, sha); return { commit_sha: "c".repeat(40), previous_commit_sha: sha }; }
  async push(repository, branch, payload, sha) { this.record("push", repository, branch, payload, sha); return { commit_sha: payload.commit_sha }; }
  async createPullRequest(repository, branch, payload) { this.record("createPullRequest", repository, branch, payload); return { pull_request_number: 7 }; }
  async mergePullRequest(repository, payload, sha) { this.record("mergePullRequest", repository, payload, sha); return { pull_request_number: payload.pull_number, merged: true, commit_sha: sha }; }
  async dispatchWorkflow(repository, branch, payload) { this.record("dispatchWorkflow", repository, branch, payload); return { dispatched: true }; }
  async deleteFile(repository, branch, payload) { this.record("deleteFile", repository, branch, payload); return { commit_sha: "d".repeat(40) }; }
  async sendExternalMessage(repository, payload) { this.record("sendExternalMessage", repository, payload); return { comment_id: 88 }; }
}

export const agent = { actor: "remote-agent", role: "agent" };
export const approver = { actor: "human-operator", role: "approver" };

export function verifyAction(overrides = {}) {
  return { type: "repository.verify", repository: "allowed/repository", repository_id: "1001", branch: "main", payload: {}, ...overrides };
}

export function commitAction(overrides = {}) {
  return {
    type: "commit.create",
    repository: "allowed/repository",
    repository_id: "1001",
    branch: "main",
    expected_head_sha: "a".repeat(40),
    payload: { message: "Add bridge documentation", files: [{ path: "src/bridge.txt", content: "safe content", encoding: "utf-8" }] },
    ...overrides
  };
}
