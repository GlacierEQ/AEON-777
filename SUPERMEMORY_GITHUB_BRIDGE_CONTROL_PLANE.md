# Supermemory → GitHub Bridge control plane

This repository contains the production bridge at:

```text
services/supermemory-github-bridge/
```

The bridge is a separate service rather than a hidden script. Its one public gateway is:

```text
POST https://supermemory-github-bridge.vercel.app/v1/bridge
```

It is write-capable when deployment configuration uses the AEON-777 guarded policy. The policy permanently binds the service to immutable repository ID `1260408632`, `GlacierEQ/AEON-777`, and the exact `main` / `supermemory-github-bridge-control-plane` branch allowlist.

Activation instructions and the prefilled policy template live inside the service at `docs/AEON-777-ACTIVATION.md` and `config/aeon-777.write-enabled.policy.template.json`.
