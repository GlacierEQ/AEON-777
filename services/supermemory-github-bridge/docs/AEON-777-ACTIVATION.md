# AEON-777 write activation

The bridge source is integrated under `services/supermemory-github-bridge` in `GlacierEQ/AEON-777`. Its public contract is:

```text
POST https://supermemory-github-bridge.vercel.app/v1/bridge
```

The deployment is intentionally unconfigured until the server-side credentials below are installed. It has no usable token, policy, or disk-backed audit store in the current serverless runtime.

## One-time deployment values

Set these values in the bridge deployment's secret manager:

```text
NODE_ENV=production
BRIDGE_MODE=guarded
BRIDGE_TRUST_PROXY=true
BRIDGE_LEDGER_DRIVER=http
BRIDGE_LEDGER_URL=https://<durable-ledger-host>/
GITHUB_APP_ID=<GitHub App ID>
GITHUB_APP_PRIVATE_KEY_B64=<base64-encoded GitHub App PEM>
SUPERMEMORY_API_KEY=<server-side Supermemory API key>
BRIDGE_AGENT_SECRETS_JSON=<agent identity-to-HMAC-secret JSON>
BRIDGE_APPROVER_SECRETS_JSON=<separate approver identity-to-HMAC-secret JSON>
BRIDGE_SIGNING_SECRET=<random 32+ byte secret>
BRIDGE_AUDIT_SIGNING_SECRET=<different random 32+ byte secret>
BRIDGE_POLICY_JSON=<the write-enabled AEON-777 policy>
```

Take `BRIDGE_POLICY_JSON` from `config/aeon-777.write-enabled.policy.template.json`, replacing only `REPLACE_WITH_GITHUB_APP_INSTALLATION_ID` with the numeric installation ID for the App installed on `GlacierEQ/AEON-777`.

## GitHub App permissions

Install the App on `GlacierEQ/AEON-777` only. Grant Metadata read (required), then Contents read/write, Pull requests read/write, Actions read/write, and Issues read/write. The policy exact-matches immutable repo ID `1260408632`, the repository name, and only `main` plus `supermemory-github-bridge-control-plane`.

## Result

After these values are installed, the bridge enables all seven requested mutation classes: commits, pushes, pull requests, merges, workflow dispatches, deletes, and external GitHub messages. It does not need a code change to enable them. Each effect uses the exact plan → independent confirmation → execute exchange and is recorded before and after the GitHub action.
