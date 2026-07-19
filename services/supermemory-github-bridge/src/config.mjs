import { sha256 } from "./canonical.mjs";
import { fail } from "./errors.mjs";

const ACTIONS = new Set([
  "repository.verify",
  "contents.read",
  "branch.read",
  "commit.read",
  "pull_request.read",
  "workflow.read",
  "commit.create",
  "push",
  "pull_request.create",
  "pull_request.merge",
  "workflow.dispatch",
  "delete",
  "external.message"
]);

const READ_ACTIONS = new Set([...ACTIONS].filter((action) => action.endsWith(".read") || action === "repository.verify"));

const DEFAULT_PROTECTED_PATHS = [
  ".env",
  ".npmrc",
  ".pypirc",
  ".netrc",
  "id_rsa",
  "id_ed25519",
  "credentials",
  "secret",
  ".pem",
  ".key"
];

function required(value, key, errors) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(key);
    return undefined;
  }
  return value.trim();
}

function parseJson(value, key, errors, fallback) {
  if (value === undefined || value === "") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    errors.push(`${key} (valid JSON)`);
    return fallback;
  }
}

function objectOfSecrets(value, key, errors) {
  const parsed = parseJson(value, key, errors, {});
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    errors.push(`${key} (object)`);
    return {};
  }
  const pairs = Object.entries(parsed);
  if (pairs.length === 0 || pairs.some(([actor, secret]) => !/^[A-Za-z0-9._:@-]{1,128}$/.test(actor) || typeof secret !== "string" || secret.length < 24)) {
    errors.push(`${key} (non-empty actor-to-secret map)`);
    return {};
  }
  return Object.fromEntries(pairs);
}

function normalizeBranchPolicy(branches, errors, label) {
  if (!branches || typeof branches !== "object" || Array.isArray(branches) || Object.keys(branches).length === 0) {
    errors.push(`${label}.branches (non-empty object)`);
    return {};
  }
  const normalized = {};
  for (const [branch, permissions] of Object.entries(branches)) {
    if (!/^(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9][A-Za-z0-9._/-]{0,254}$/.test(branch) || branch.startsWith("refs/")) {
      errors.push(`${label}.branches.${branch} (exact branch name)`);
      continue;
    }
    if (!permissions || typeof permissions !== "object" || Array.isArray(permissions) || typeof permissions.read !== "boolean" || typeof permissions.write !== "boolean") {
      errors.push(`${label}.branches.${branch} (read/write booleans)`);
      continue;
    }
    const suppliedWriteActions = Array.isArray(permissions.writeActions) ? permissions.writeActions.map(String) : [];
    if (suppliedWriteActions.some((action) => !ACTIONS.has(action) || READ_ACTIONS.has(action))) errors.push(`${label}.branches.${branch}.writeActions (supported mutation actions)`);
    normalized[branch] = {
      read: permissions.read,
      write: permissions.write,
      writeActions: suppliedWriteActions.filter((action) => ACTIONS.has(action) && !READ_ACTIONS.has(action)),
      workflowIds: Array.isArray(permissions.workflowIds) ? permissions.workflowIds.map(String) : [],
      writePathPrefixes: Array.isArray(permissions.writePathPrefixes) ? permissions.writePathPrefixes.map(String) : [],
      protectedPaths: Array.isArray(permissions.protectedPaths) ? permissions.protectedPaths.map(String) : DEFAULT_PROTECTED_PATHS
    };
  }
  return normalized;
}

function boundedInteger(value, fallback, min, max, key, errors) {
  const parsed = Number.parseInt(value || String(fallback), 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    errors.push(`${key} (${min}-${max})`);
    return fallback;
  }
  return parsed;
}

function normalizePolicy(value, errors) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push("BRIDGE_POLICY_JSON (policy object)");
    return { version: "unconfigured", repositories: [] };
  }
  if (typeof value.version !== "string" || value.version.length > 128 || value.version.length === 0) errors.push("policy.version");
  if (!Array.isArray(value.repositories)) {
    errors.push("policy.repositories (array)");
    return { version: value.version || "unconfigured", repositories: [] };
  }
  const seenIds = new Set();
  const seenNames = new Set();
  const repositories = [];
  for (const [index, repository] of value.repositories.entries()) {
    const label = `policy.repositories[${index}]`;
    if (!repository || typeof repository !== "object" || Array.isArray(repository)) {
      errors.push(label);
      continue;
    }
    const id = String(repository.id ?? "");
    const fullName = String(repository.fullName ?? "");
    const installationId = String(repository.installationId ?? "");
    if (!/^\d+$/.test(id)) errors.push(`${label}.id (immutable numeric GitHub repository ID)`);
    if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,38}\/[A-Za-z0-9_.-]{1,100}$/.test(fullName)) errors.push(`${label}.fullName (owner/repository)`);
    if (!/^\d+$/.test(installationId)) errors.push(`${label}.installationId (numeric GitHub App installation ID)`);
    if (seenIds.has(id) || seenNames.has(fullName.toLowerCase())) errors.push(`${label} (duplicate repository)`);
    seenIds.add(id);
    seenNames.add(fullName.toLowerCase());
    const branches = normalizeBranchPolicy(repository.branches, errors, label);
    repositories.push({ id, fullName, installationId, branches });
  }
  return { version: value.version || "unconfigured", repositories };
}

function asHttpsUrl(value, key, errors, fallback) {
  const raw = value || fallback;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") throw new Error("not https");
    return parsed;
  } catch {
    errors.push(`${key} (HTTPS URL)`);
    return new URL(fallback);
  }
}

export function loadConfig(env = process.env) {
  const errors = [];
  const production = env.NODE_ENV === "production";
  const mode = env.BRIDGE_MODE || "verify";
  if (!new Set(["verify", "guarded"]).has(mode)) errors.push("BRIDGE_MODE (verify or guarded)");
  const policy = normalizePolicy(parseJson(env.BRIDGE_POLICY_JSON, "BRIDGE_POLICY_JSON", errors, undefined), errors);
  const agentSecrets = objectOfSecrets(env.BRIDGE_AGENT_SECRETS_JSON, "BRIDGE_AGENT_SECRETS_JSON", errors);
  const approverSecrets = objectOfSecrets(env.BRIDGE_APPROVER_SECRETS_JSON, "BRIDGE_APPROVER_SECRETS_JSON", errors);
  const signingSecret = required(env.BRIDGE_SIGNING_SECRET, "BRIDGE_SIGNING_SECRET", errors);
  const auditSigningSecret = required(env.BRIDGE_AUDIT_SIGNING_SECRET, "BRIDGE_AUDIT_SIGNING_SECRET", errors);
  const ledgerDriver = env.BRIDGE_LEDGER_DRIVER || "sqlite";
  if (!new Set(["sqlite", "http"]).has(ledgerDriver)) errors.push("BRIDGE_LEDGER_DRIVER (sqlite or http)");
  const ledgerPath = ledgerDriver === "sqlite" ? required(env.BRIDGE_LEDGER_PATH, "BRIDGE_LEDGER_PATH", errors) : undefined;
  const ledgerUrl = ledgerDriver === "http" ? asHttpsUrl(required(env.BRIDGE_LEDGER_URL, "BRIDGE_LEDGER_URL", errors), "BRIDGE_LEDGER_URL", errors, "https://invalid.local") : undefined;
  if (production && ledgerDriver === "sqlite" && !ledgerPath) errors.push("BRIDGE_LEDGER_PATH (durable mounted volume)");
  const githubApiUrl = asHttpsUrl(env.GITHUB_API_URL, "GITHUB_API_URL", errors, "https://api.github.com");
  const supermemoryApiUrl = asHttpsUrl(env.SUPERMEMORY_API_URL, "SUPERMEMORY_API_URL", errors, "https://api.supermemory.ai/v3");
  const github = {
    appId: env.GITHUB_APP_ID,
    privateKeyB64: env.GITHUB_APP_PRIVATE_KEY_B64,
    apiUrl: githubApiUrl
  };
  const supermemory = {
    apiKey: env.SUPERMEMORY_API_KEY,
    apiUrl: supermemoryApiUrl,
    containerTag: env.SUPERMEMORY_CONTAINER_TAG || "sm_project_github"
  };
  const configuredRepositories = policy.repositories.length > 0;
  if (configuredRepositories) {
    required(github.appId, "GITHUB_APP_ID", errors);
    required(github.privateKeyB64, "GITHUB_APP_PRIVATE_KEY_B64", errors);
    required(supermemory.apiKey, "SUPERMEMORY_API_KEY", errors);
  }
  const limits = {
    maxBodyBytes: boundedInteger(env.BRIDGE_MAX_BODY_BYTES, 65_536, 1_024, 1_048_576, "BRIDGE_MAX_BODY_BYTES", errors),
    maxMemoryResults: boundedInteger(env.BRIDGE_MAX_MEMORY_RESULTS, 8, 1, 20, "BRIDGE_MAX_MEMORY_RESULTS", errors),
    maxFileBytes: boundedInteger(env.BRIDGE_MAX_FILE_BYTES, 262_144, 1_024, 1_048_576, "BRIDGE_MAX_FILE_BYTES", errors)
  };
  return {
    ok: errors.length === 0,
    errors: [...new Set(errors)].sort(),
    production,
    mode,
    trustedProxy: env.BRIDGE_TRUST_PROXY === "true",
    policy,
    policyHash: sha256(policy),
    agentSecrets,
    approverSecrets,
    signingSecret,
    auditSigningSecret,
    ledger: { driver: ledgerDriver, path: ledgerPath, url: ledgerUrl },
    github,
    supermemory,
    limits
  };
}

export { ACTIONS, READ_ACTIONS };
