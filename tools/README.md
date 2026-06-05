# AEON-777 Forensic Tools

Production utilities for Case **1FDV-23-0001009**. Pure Python standard library —
no third-party runtime dependencies, no network calls, no secrets.

## `exhibit_hasher.py` — court-grade exhibit hashing

Proves **integrity** ("this file was not altered") and **provenance** ("this is
the file we collected, on this date") for every exhibit in a folder.

### Generate a manifest + chain-of-custody log

```bash
python tools/exhibit_hasher.py hash ./EXHIBITS \
    --manifest manifest.json \
    --coc chain_of_custody.csv \
    --case 1FDV-23-0001009 \
    --sha512
```

Produces:

| Artifact | Audience | Purpose |
| --- | --- | --- |
| `manifest.json` | machine / source of truth | full record set, algorithm, timestamps |
| `chain_of_custody.csv` | human / court | one row per exhibit, opens in Excel |

### Verify nothing changed (pre-filing gate)

```bash
python tools/exhibit_hasher.py verify ./EXHIBITS --manifest manifest.json
```

- Exit `0` → every exhibit matches the manifest.
- Exit `1` → drift detected; the tool prints exactly which files were
  `MODIFIED`, `REMOVED`, or `ADDED`.

### Guarantees

- **Deterministic** — sorted traversal, stable output ordering.
- **Constant memory** — 1 MiB streaming reads; a multi-GB video hashes safely.
- **Honest time** — every record carries an ISO-8601 timestamp *with timezone*.
- **Fail loud** — unreadable files become error records, never silent skips.

### Tests

```bash
python -m pytest tools/
```

Known-answer SHA-256 check + drift-detection coverage.
