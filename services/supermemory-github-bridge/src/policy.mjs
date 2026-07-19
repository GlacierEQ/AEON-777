import { ACTIONS, READ_ACTIONS } from "./config.mjs";
import { fail } from "./errors.mjs";

const REPOSITORY = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,38}\/[A-Za-z0-9_.-]{1,100}$/;
const BRANCH = /^(?!refs\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9][A-Za-z0-9._/-]{0,254}$/;

export function isMutation(action) {
  return !READ_ACTIONS.has(action);
}

export function normalizeAction(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) fail(400, "invalid_action", "The action envelope is required.");
  const type = String(input.type || "");
  const repository = String(input.repository || "");
  const repositoryId = String(input.repository_id ?? input.repositoryId ?? "");
  const branch = String(input.branch || "");
  if (!ACTIONS.has(type)) fail(400, "unsupported_action", "The requested action type is not supported.");
  if (!REPOSITORY.test(repository)) fail(400, "invalid_repository", "Repository must be an exact owner/repository name.");
  if (!/^\d+$/.test(repositoryId)) fail(400, "invalid_repository_id", "Repository ID must be the immutable numeric GitHub repository ID.");
  if (!BRANCH.test(branch)) fail(400, "invalid_branch", "Branch must be an exact branch name and cannot use refs or traversal.");
  const payload = input.payload === undefined ? {} : input.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) fail(400, "invalid_payload", "Action payload must be a JSON object.");
  const expectedHeadSha = input.expected_head_sha ?? input.expectedHeadSha;
  if (isMutation(type) && (typeof expectedHeadSha !== "string" || !/^[0-9a-f]{40}$/i.test(expectedHeadSha))) {
    fail(400, "expected_head_required", "Mutating actions require the exact 40-character expected branch-head SHA.");
  }
  return {
    type,
    repository,
    repositoryId,
    branch,
    ...(expectedHeadSha ? { expectedHeadSha: String(expectedHeadSha).toLowerCase() } : {}),
    payload
  };
}

export function validatePolicy({ action, policy, mode }) {
  const repository = policy.repositories.find((candidate) => candidate.id === action.repositoryId && candidate.fullName.toLowerCase() === action.repository.toLowerCase());
  if (!repository) fail(403, "repository_not_allowed", "The repository ID and full name are not on the bridge allowlist.");
  const branch = repository.branches[action.branch];
  if (!branch) fail(403, "branch_not_allowed", "The branch is not on the bridge allowlist.");
  const mutation = isMutation(action.type);
  if (!mutation && !branch.read) fail(403, "read_not_allowed", "Read access is not enabled for this exact branch.");
  if (mode === "verify" && mutation) fail(403, "verification_mode", "The bridge is in verification mode and cannot perform mutations.");
  if (mutation && (!branch.write || !branch.writeActions.includes(action.type))) fail(403, "write_not_allowed", "This action is not enabled for the exact allowlisted branch.");
  return { repository, branch, mutation };
}

function isProtected(path, protectedPaths) {
  const lower = path.toLowerCase();
  return protectedPaths.some((pattern) => lower === pattern.toLowerCase() || lower.includes(pattern.toLowerCase()) || lower.startsWith(`${pattern.toLowerCase()}/`));
}

export function assertSafePath(path, branch) {
  if (typeof path !== "string" || path.length === 0 || path.length > 500 || path.includes("\0") || path.startsWith("/") || path.split("/").includes("..")) {
    fail(400, "unsafe_path", "A repository path is malformed or unsafe.");
  }
  if (!branch.writePathPrefixes.some((prefix) => path.startsWith(prefix))) fail(403, "path_not_allowlisted", "The repository path is outside the branch write-path allowlist.");
  if (isProtected(path, branch.protectedPaths)) fail(403, "protected_path", "The repository path is protected by bridge policy.");
}

export function assertSafeReadPath(path, branch) {
  if (typeof path !== "string" || path.length === 0 || path.length > 500 || path.includes("\0") || path.startsWith("/") || path.split("/").includes("..")) {
    fail(400, "unsafe_path", "A repository path is malformed or unsafe.");
  }
  if (isProtected(path, branch.protectedPaths)) fail(403, "protected_path", "The repository path is protected by bridge policy.");
}

export function assertSafeText(value, label, maxBytes) {
  if (typeof value !== "string" || Buffer.byteLength(value, "utf8") > maxBytes) fail(400, "invalid_content", `${label} must be text within the configured size limit.`);
  const patterns = [
    /-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----/i,
    /(?:ghp|github_pat)_[A-Za-z0-9_]{20,}/,
    /AKIA[0-9A-Z]{16}/,
    /(?:password|secret|api[_-]?key)\s*[:=]\s*[^\s]{8,}/i
  ];
  if (patterns.some((pattern) => pattern.test(value))) fail(403, "sensitive_content_blocked", `${label} appears to contain a credential or private key.`);
}
