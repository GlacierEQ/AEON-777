# Memory Architecture delta — 2026-07-25

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Completed

- Re-probed the callable Glacier Desktop Commander connector.
- Authentication and its backend connection succeeded, but device enumeration returned zero devices.
- Preserved only a SHA-256 of the observed connector principal; no account identifier, device identifier, path, or file metadata is stored.
- Classified the conflict between the external pairing claim and the live zero-device result as `split_principal_or_stale_registration`; principal equivalence remains unknown.
- Added a strict principal-binding receipt and executable route guard.
- The guard requires the same hashed principal, at least one online device, an exact approved root, and metadata-read mode.
- Root-prefix lookalikes, principal drift, zero devices, and all writes fail closed.

## Quality state

- Desktop Commander connector quality increases from 30/100 to 55/100 based on a fresh successful authentication/device probe and an observable, privacy-safe receipt.
- Desktop Commander data quality remains 0/100 because no approved root was probed and no source data was measured.
- Supermemory connector quality remains 60/100 and its data quality remains 0/100.

## Open gaps

- The callable connector principal reports zero devices.
- The separately reported Mac pairing is not verified under the callable principal.
- Approved roots remain empty; read and write routing remain blocked.
- Connector owner remains unassigned.
- PR #57 must be reconciled with newer canonical `main`.
- Hosted validation still lacks a public-runner receipt.

## Next gate

Re-pair or switch the connector to the same principal as the trusted Mac, require device count greater than zero, then approve one non-sensitive metadata-only root and preserve its first bounded probe receipt. Writes remain a separate human gate.
