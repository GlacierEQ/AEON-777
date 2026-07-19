import { createSign } from "node:crypto";
import { fail } from "./errors.mjs";

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function component(value) {
  return encodeURIComponent(value).replace(/%2F/gi, "/");
}

function safePath(path) {
  return String(path).split("/").map(encodeURIComponent).join("/");
}

function githubError(response, body) {
  const requestId = response.headers.get("x-github-request-id") || undefined;
  const code = response.status === 401 || response.status === 403 ? "github_authorization_failed"
    : response.status === 404 ? "github_resource_not_found"
      : response.status === 409 ? "github_conflict"
        : response.status === 422 ? "github_validation_failed"
          : response.status === 429 ? "github_rate_limited"
            : response.status >= 500 ? "github_unavailable" : "github_request_failed";
  fail(response.status >= 500 ? 503 : response.status, code, "GitHub did not accept the bridge request.", {
    github_status: response.status,
    ...(requestId ? { github_request_id: requestId } : {}),
    ...(typeof body?.message === "string" ? { provider_message: body.message.slice(0, 160) } : {})
  });
}

export class GitHubAppClient {
  constructor({ appId, privateKeyB64, apiUrl, fetchImpl = fetch, now = () => new Date() }) {
    this.appId = String(appId);
    this.privateKey = Buffer.from(privateKeyB64, "base64").toString("utf8");
    this.apiUrl = new URL(apiUrl);
    this.fetchImpl = fetchImpl;
    this.now = now;
    this.tokens = new Map();
    if (!this.privateKey.includes("PRIVATE KEY")) fail(500, "invalid_github_app_key", "The configured GitHub App private key is invalid.");
  }

  appJwt() {
    const nowSeconds = Math.floor(this.now().getTime() / 1_000);
    const header = base64UrlJson({ alg: "RS256", typ: "JWT" });
    const payload = base64UrlJson({ iat: nowSeconds - 60, exp: nowSeconds + 540, iss: this.appId });
    const unsigned = `${header}.${payload}`;
    const signer = createSign("RSA-SHA256");
    signer.update(unsigned);
    signer.end();
    return `${unsigned}.${signer.sign(this.privateKey, "base64url")}`;
  }

  url(path) {
    const root = new URL(this.apiUrl);
    root.pathname = root.pathname.endsWith("/") ? root.pathname : `${root.pathname}/`;
    return new URL(path.replace(/^\//, ""), root);
  }

  async rawRequest({ method, path, token, body, accept = "application/vnd.github+json" }) {
    let response;
    try {
      response = await this.fetchImpl(this.url(path), {
        method,
        headers: {
          accept,
          "x-github-api-version": "2022-11-28",
          authorization: `Bearer ${token}`,
          ...(body === undefined ? {} : { "content-type": "application/json" })
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        redirect: "error",
        signal: AbortSignal.timeout(12_000)
      });
    } catch {
      fail(503, "github_unavailable", "GitHub could not be reached; no action was completed.");
    }
    const declaredLength = Number(response.headers.get("content-length") || "0");
    if (Number.isFinite(declaredLength) && declaredLength > 2_097_152) fail(503, "github_response_too_large", "GitHub returned an oversized response; the bridge will not continue.");
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > 2_097_152) fail(503, "github_response_too_large", "GitHub returned an oversized response; the bridge will not continue.");
    let parsed = undefined;
    if (text) {
      try { parsed = JSON.parse(text); } catch { parsed = { text }; }
    }
    if (!response.ok) githubError(response, parsed);
    return { body: parsed, status: response.status, requestId: response.headers.get("x-github-request-id") || null };
  }

  async installationToken(installationId) {
    const cached = this.tokens.get(installationId);
    if (cached && cached.expiresAt > this.now().getTime() + 60_000) return cached.token;
    const result = await this.rawRequest({
      method: "POST",
      path: `app/installations/${encodeURIComponent(installationId)}/access_tokens`,
      token: this.appJwt(),
      body: {}
    });
    if (!result.body?.token || !result.body?.expires_at) fail(503, "github_token_unavailable", "GitHub did not return an installation access token.");
    this.tokens.set(installationId, { token: result.body.token, expiresAt: Date.parse(result.body.expires_at) });
    return result.body.token;
  }

  async request(repository, method, path, body = undefined) {
    const token = await this.installationToken(repository.installationId);
    return this.rawRequest({ method, path, token, body });
  }

  async repositoryVerify(repository, branch) {
    const repo = await this.request(repository, "GET", `repos/${component(repository.fullName)}`);
    if (String(repo.body?.id) !== repository.id || String(repo.body?.full_name || "").toLowerCase() !== repository.fullName.toLowerCase()) {
      fail(403, "github_repository_identity_mismatch", "GitHub returned a repository that does not match the immutable allowlisted repository ID.");
    }
    const branchInfo = await this.request(repository, "GET", `repos/${component(repository.fullName)}/branches/${component(branch)}`);
    const commitSha = branchInfo.body?.commit?.sha;
    if (!/^[0-9a-f]{40}$/i.test(commitSha || "")) fail(503, "github_branch_unavailable", "GitHub did not return a usable branch head.");
    return {
      repository: { id: String(repo.body.id), full_name: repo.body.full_name, private: Boolean(repo.body.private), default_branch: repo.body.default_branch },
      branch,
      commit_sha: commitSha,
      github_request_ids: [repo.requestId, branchInfo.requestId].filter(Boolean)
    };
  }

  async branchHead(repository, branch) {
    const branchInfo = await this.request(repository, "GET", `repos/${component(repository.fullName)}/branches/${component(branch)}`);
    const sha = branchInfo.body?.commit?.sha;
    if (!/^[0-9a-f]{40}$/i.test(sha || "")) fail(503, "github_branch_unavailable", "GitHub did not return a usable branch head.");
    return { sha: sha.toLowerCase(), requestId: branchInfo.requestId };
  }

  async assertExpectedHead(repository, branch, expectedHeadSha) {
    const current = await this.branchHead(repository, branch);
    if (current.sha !== expectedHeadSha.toLowerCase()) fail(409, "branch_head_changed", "The branch head changed after planning; create and approve a new plan.", { current_head_sha: current.sha });
    return current;
  }

  async readFile(repository, branch, path) {
    const result = await this.request(repository, "GET", `repos/${component(repository.fullName)}/contents/${safePath(path)}?ref=${encodeURIComponent(branch)}`);
    if (!result.body || Array.isArray(result.body) || result.body.type !== "file" || typeof result.body.content !== "string") fail(404, "github_file_not_found", "GitHub did not return a text file at the requested path.");
    return {
      path,
      branch,
      sha: result.body.sha,
      encoding: result.body.encoding,
      content: result.body.content.replace(/\n/g, ""),
      github_request_id: result.requestId
    };
  }

  async readCommit(repository, sha) {
    const result = await this.request(repository, "GET", `repos/${component(repository.fullName)}/commits/${encodeURIComponent(sha)}`);
    return { commit_sha: result.body?.sha, message: result.body?.commit?.message, url: result.body?.html_url, github_request_id: result.requestId };
  }

  async readPullRequest(repository, number) {
    const result = await this.request(repository, "GET", `repos/${component(repository.fullName)}/pulls/${number}`);
    return { pull_request_number: result.body?.number, state: result.body?.state, merged: Boolean(result.body?.merged), head_sha: result.body?.head?.sha, base_sha: result.body?.base?.sha, url: result.body?.html_url, github_request_id: result.requestId };
  }

  async readWorkflow(repository, workflowId) {
    const result = await this.request(repository, "GET", `repos/${component(repository.fullName)}/actions/workflows/${encodeURIComponent(workflowId)}`);
    return { workflow_id: result.body?.id, name: result.body?.name, state: result.body?.state, path: result.body?.path, github_request_id: result.requestId };
  }

  async createCommit(repository, branch, payload, expectedHeadSha) {
    const current = await this.assertExpectedHead(repository, branch, expectedHeadSha);
    const parent = await this.request(repository, "GET", `repos/${component(repository.fullName)}/git/commits/${current.sha}`);
    const baseTree = parent.body?.tree?.sha;
    if (!baseTree) fail(503, "github_commit_unavailable", "GitHub did not return the parent commit tree.");
    const entries = [];
    for (const file of payload.files) {
      const blob = await this.request(repository, "POST", `repos/${component(repository.fullName)}/git/blobs`, { content: file.content, encoding: file.encoding || "utf-8" });
      entries.push({ path: file.path, mode: "100644", type: "blob", sha: blob.body?.sha });
    }
    const tree = await this.request(repository, "POST", `repos/${component(repository.fullName)}/git/trees`, { base_tree: baseTree, tree: entries });
    const commit = await this.request(repository, "POST", `repos/${component(repository.fullName)}/git/commits`, { message: payload.message, tree: tree.body?.sha, parents: [current.sha] });
    const updated = await this.request(repository, "PATCH", `repos/${component(repository.fullName)}/git/refs/heads/${component(branch)}`, { sha: commit.body?.sha, force: false });
    return { commit_sha: commit.body?.sha, branch, ref: updated.body?.ref, previous_commit_sha: current.sha };
  }

  async push(repository, branch, payload, expectedHeadSha) {
    await this.assertExpectedHead(repository, branch, expectedHeadSha);
    const result = await this.request(repository, "PATCH", `repos/${component(repository.fullName)}/git/refs/heads/${component(branch)}`, { sha: payload.commit_sha, force: false });
    return { commit_sha: result.body?.object?.sha || payload.commit_sha, branch, ref: result.body?.ref };
  }

  async createPullRequest(repository, branch, payload) {
    const result = await this.request(repository, "POST", `repos/${component(repository.fullName)}/pulls`, { title: payload.title, body: payload.body || "", head: payload.head, base: branch, draft: Boolean(payload.draft) });
    return { pull_request_number: result.body?.number, url: result.body?.html_url, head_sha: result.body?.head?.sha, base: branch };
  }

  async mergePullRequest(repository, payload, expectedHeadSha) {
    const result = await this.request(repository, "PUT", `repos/${component(repository.fullName)}/pulls/${payload.pull_number}/merge`, { commit_title: payload.commit_title, commit_message: payload.commit_message, sha: expectedHeadSha, merge_method: payload.merge_method });
    return { merged: Boolean(result.body?.merged), commit_sha: result.body?.sha, message: result.body?.message, pull_request_number: payload.pull_number };
  }

  async dispatchWorkflow(repository, branch, payload) {
    const result = await this.request(repository, "POST", `repos/${component(repository.fullName)}/actions/workflows/${encodeURIComponent(payload.workflow_id)}/dispatches`, { ref: branch, inputs: payload.inputs || {} });
    return { dispatched: true, workflow_id: payload.workflow_id, branch, github_status: result.status };
  }

  async deleteFile(repository, branch, payload) {
    const result = await this.request(repository, "DELETE", `repos/${component(repository.fullName)}/contents/${safePath(payload.path)}`, { message: payload.message, sha: payload.sha, branch });
    return { commit_sha: result.body?.commit?.sha, path: payload.path, branch };
  }

  async sendExternalMessage(repository, payload) {
    const result = await this.request(repository, "POST", `repos/${component(repository.fullName)}/issues/${payload.issue_number}/comments`, { body: payload.body });
    return { comment_id: result.body?.id, url: result.body?.html_url, issue_number: payload.issue_number };
  }
}
