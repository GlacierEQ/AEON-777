# CASEBRAIN connector fabric quality and organization report

**Snapshot:** 2026-07-15  
**Control boundary:** Metadata-first audit. No source bodies were bulk-read, no files were moved or uploaded, no messages were sent, and no database/deployment schemas were changed.

## Outcome

The connector fabric is now explicit rather than implied: 48 requested connector classes are registered, six bounded Notion workers are defined, and all five available active automation slots have been enriched with connector-quality, provenance, organization, and exception-routing rules.

## Highest-severity findings

| Severity | Connector | Finding | Gate |
|---|---|---|---|
| Critical | Supabase backend-ops | Empty/RLS-enabled does not mean ingestion-ready: 20 security warnings and 216 performance lints were observed. | Clear security warnings and review performance lints before any fixture. |
| High | Vercel | Two production deployments for unified-case-brain-web are in ERROR. | Resolve build/auth/access failures; observability only. |
| High | Netlify | Three projects lack reported password/SSO protection. | Exclude confidential CASEBRAIN data. |
| High | Microsoft content | SharePoint/OneDrive and Teams content inventory is license/subscription blocked. | Connect entitled identity and re-run metadata-only inventory. |
| Medium | Amplitude | OAuth grant is invalid. | Reauthenticate; de-identified operational telemetry only. |
| Medium | Drive/Dropbox/Box | Connected, but approved intake roots are not yet designated. | Human-select one root per connector; remain metadata-only. |

## Durable worker sequence

1. Intake Triage creates a metadata-only candidate.
2. Provenance & Hash validates an external exact-byte receipt.
3. Actor/Entity and Event/Claim workers produce qualified, source-linked proposals.
4. Document Organization produces a reversible naming/folder/retention manifest.
5. QA/Exception Routing validates every output and emits a control receipt.
6. A human authorizes any bounded adapter action. Deletion, overwrite, public share, filing, external communication, and fact promotion remain prohibited.

## Quality model

Connector quality and data quality are scored separately. Connector quality totals 100 points: authentication 15, scoped access 15, freshness 15, provenance support 20, idempotency/retry safety 10, sensitivity controls 15, and observable receipts 10. Unknowns score zero. Data-quality review covers completeness, uniqueness, validity, consistency, lineage, timeliness, and duplicate risk.

## Upload and organization rule

No document is upload-ready until it carries the required manifest: source connector and stable ID/URI, version, observed/modified timestamps, exact original filename and byte count, full SHA-256 of exact bytes, custodian, case, actor/event links, document type, original/derivative status, sensitivity, privilege state, approved destination, duplicate result, human approval, and run receipt.

## Allocation summary

- **Active control:** GitHub canonical artifacts; Notion human control plane; Data Analytics owner-only reporting.
- **Restricted sources:** Google Drive, Dropbox, Box, Slack, Gmail/Outlook, calendars, and Fireflies remain metadata-only until explicit scope/root gates.
- **Staging only:** Supabase backend-ops after remediation; MotherDuck after schema/provenance QA.
- **Legacy/read-only:** Supabase glaciereq, Linear, Asana, Confluence references.
- **Observability only:** Vercel; Amplitude after reauthentication.
- **Excluded from confidential data:** Netlify, Hugging Face, credential-bearing database tables, and unassessed enrichment/public-design tools.

## Automation state

The platform limit is five active tasks. Rather than create a duplicate sixth job, the existing Memory Architecture, Daily Ops, Evidence Intake, Daily Master Priorities, and Memory Hygiene lanes were enriched in place. The weekly connector-fabric scoring and drift audit is embedded in the Evidence Intake lane.

## Linked controls

- Private report: https://casebrain-actor-quality.yin2yang.chatgpt.site
- GitHub PR: https://github.com/GlacierEQ/AEON-777/pull/52
- Notion workers: https://app.notion.com/p/39eb1e4f322381a8b360f75aa3a4e905
- First organization receipt gate: https://app.clickup.com/t/86ajhvyj6

