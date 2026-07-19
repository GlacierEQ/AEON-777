# Supermemory → GitHub Bridge

One authenticated HTTPS gateway for a remote agent:

```text
POST https://<deployment-domain>/v1/bridge
```

The service is deliberately fail-closed. An empty allowlist, missing secret, failed Supermemory lookup, failed audit write, malformed signature, stale branch head, replayed nonce, or missing human confirmation prevents GitHub from being contacted.

`config/bridge-policy.default-deny.json` is a valid starting policy and intentionally authorizes no repository.

## What is implemented

- GitHub App installation authentication with short-lived server-side tokens; the agent never receives a GitHub token.
- Exact immutable GitHub repository ID + `owner/name` + branch allowlisting.
- Supermemory `v3/search` retrieval before each GitHub API call, scoped to `SUPERMEMORY_CONTAINER_TAG`.
- Retrieved context is labeled untrusted and cannot change identity, allowlists, action class, branch, recipients, or confirmation requirements.
- Signed, append-only hash-chained audit events. Each event carries UTC time, actor, action, repository, branch, request/response hashes, Supermemory request/response hashes, policy hash, confirmation ID, and resulting commit SHA when present.
- HMAC-signed remote-agent requests with timestamp + nonce replay protection.
- Separate approver identities. An agent can plan; an approver must explicitly send `decision: "approve"`; confirmation is one-use and expires in ten minutes.
- Idempotency keys for mutations, expected branch-head SHA checks, no force ref updates, protected-path checks, payload limits, and credential-pattern blocking.
- `verify` mode is the cold-start default. Set `BRIDGE_MODE=guarded` with the supplied write-enabled policy to activate the complete write surface; every effect still uses the plan → separate confirmation → execute flow.

## Deployment shape

Use the Docker image with a persistent mounted volume for the SQLite ledger, or configure a durable HTTPS ledger service through `BRIDGE_LEDGER_DRIVER=http`. Serverless filesystem is not a durable audit ledger; the Vercel deployment remains intentionally locked until a durable HTTP ledger and all secrets are configured.

The `Dockerfile` runs the same endpoint on port 8080. Put TLS at a trusted reverse proxy/load balancer and set `BRIDGE_TRUST_PROXY=true` only when that proxy overwrites `X-Forwarded-Proto`.

## Required secret configuration

All configuration is runtime-only. Never commit it.

| Variable | Purpose |
| --- | --- |
| `BRIDGE_POLICY_JSON` | Versioned strict allowlist matching `docs/policy.schema.json`. |
| `BRIDGE_AGENT_SECRETS_JSON` | JSON map of remote-agent identity to HMAC secret. |
| `BRIDGE_APPROVER_SECRETS_JSON` | Separate JSON map of human/operator identity to HMAC secret. |
| `BRIDGE_SIGNING_SECRET` | Signs plan and confirmation receipts. |
| `BRIDGE_AUDIT_SIGNING_SECRET` | Signs hash-chained audit events. |
| `BRIDGE_LEDGER_DRIVER` | `sqlite` with durable `BRIDGE_LEDGER_PATH`, or `http` with `BRIDGE_LEDGER_URL`. |
| `SUPERMEMORY_API_KEY` | Server-side Supermemory credential. |
| `SUPERMEMORY_CONTAINER_TAG` | Retrieval boundary; defaults to `sm_project_github`. |
| `GITHUB_APP_ID` | GitHub App ID. |
| `GITHUB_APP_PRIVATE_KEY_B64` | Base64 of the GitHub App PEM; never a token. |

Each allowlisted repository has its own `installationId` inside the policy. Install the GitHub App on selected repositories only, with the permissions required by the actions you intend to activate: Contents read/write, Pull requests read/write, Actions read/write, Issues read/write, and Metadata read. The bridge independently binds every effect to an exact repository, branch, expected head SHA, payload hash, and separate confirmation.

`config/aeon-777.write-enabled.policy.template.json` is the ready-to-fill write policy for the AEON-777 integration. It allows every implemented write action on the two exact integration branches once its single `installationId` placeholder is replaced at deployment time.

## Request authentication

Every request uses these headers:

```text
Content-Type: application/json
X-Bridge-Role: agent | approver
X-Bridge-Timestamp: ISO-8601 UTC timestamp
X-Bridge-Nonce: 16–256 character unique nonce
Authorization: Bridge-HMAC <identity>:<hex-signature>
```

The signature is HMAC-SHA256 over exactly:

```text
timestamp + "\n" + nonce + "\n" + HTTP method + "\n" + "/v1/bridge" + "\n" + SHA-256(raw request body)
```

The nonce is claimed in the ledger before processing. Agent and approver secret maps are disjoint operational identities; an agent-provided `confirmed: true` is ignored.

## Single-endpoint lifecycle

The request envelope always has `op` plus any required fields:

```json
{
  "op": "capabilities | verify | plan | confirm | execute",
  "idempotency_key": "UUID required only for a mutation execute",
  "action": {
    "type": "repository.verify",
    "repository": "exact owner/repository",
    "repository_id": "immutable numeric repository ID",
    "branch": "exact allowlisted branch",
    "payload": {}
  }
}
```

For every mutation, `action.expected_head_sha` is also required and must be a 40-character SHA.

1. The agent sends `plan` with the exact action. The bridge validates policy, retrieves Supermemory context, saves audit records, and returns a signed plan token plus the canonical action hash.
2. A distinct approver sends `confirm` with `decision: "approve"` and the plan token. The bridge returns a short-lived, one-use confirmation token.
3. The agent sends `execute` with the same action, a UUID idempotency key, and the confirmation token. The bridge revalidates policy, retrieves Supermemory again, consumes the confirmation, re-reads the branch head, executes the GitHub API request, and captures the result in the ledger.

`verify` is the initial operation: it accepts only `repository.verify`, calls Supermemory before GitHub, and returns the verified immutable repo ID, branch head SHA, and audit receipt.

## Action classes

Read actions: `repository.verify`, `contents.read`, `branch.read`, `commit.read`, `pull_request.read`, `workflow.read`.

Confirmation-gated actions: `commit.create`, `push`, `pull_request.create`, `pull_request.merge`, `workflow.dispatch`, `delete`, `external.message`.

Every write must also appear in that branch's `writeActions` list. `verify` mode denies all writes regardless of a signed confirmation.

## Durable HTTP ledger contract

When `BRIDGE_LEDGER_DRIVER=http`, the bridge calls only these fixed HTTPS paths below `BRIDGE_LEDGER_URL` and signs canonical redacted JSON with `X-Bridge-Ledger-Signature`:

- `POST events` → 2xx; response may include `event_sha256`, `previous_event_sha256`, and `captured_at`.
- `POST nonces/claim` → `{ "claimed": true | false }`.
- `POST confirmations/consume` → `{ "consumed": true | false }`.
- `POST idempotency/get` → `{ "record": null | { "requestSha256", "status", "response" } }`.
- `POST idempotency/reserve` → `{ "reserved": true | false, "record": null | object }`.
- `POST idempotency/complete` → `{ "completed": true | false }`.

The ledger must enforce uniqueness atomically for nonce, confirmation ID, and `(actor, idempotency_key)`. It is a security dependency: a ledger failure blocks GitHub rather than degrading to best effort.

## Verification

```bash
npm run verify
docker build -t supermemory-github-bridge .
```

The code has no external runtime dependency beyond supported Node.js. Tests use fakes and never contact GitHub or Supermemory.
