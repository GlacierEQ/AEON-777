#!/usr/bin/env python3
import copy, json, sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
REGISTRY = BASE / "CONNECTOR_FABRIC.json"

def semantic_errors(doc):
    errors=[]
    required={"schema_version","generated_at","scope","policy","scoring","lifecycle","upload_manifest_required","requested_connector_ids","connectors","notion_workers","automations","automation_limit","links"}
    missing=required-set(doc)
    if missing: errors.append(f"missing top-level fields: {sorted(missing)}")
    ids=[c.get("connector_id") for c in doc.get("connectors",[])]
    if len(ids)!=len(set(ids)): errors.append("connector_id values must be unique")
    if set(ids)!=set(doc.get("requested_connector_ids",[])): errors.append("requested_connector_ids must exactly match connectors")
    by={c["connector_id"]:c for c in doc.get("connectors",[])}
    if by.get("github",{}).get("allocated_role")!="canonical_control": errors.append("GitHub must remain canonical_control")
    if by.get("notion",{}).get("allocated_role")!="control_projection": errors.append("Notion must remain control_projection")
    for c in doc.get("connectors",[]):
        for field in ("connector_quality_score","data_quality_score"):
            score=c.get(field)
            if not isinstance(score,int) or not 0 <= score <= 100:
                errors.append(f'{c.get("connector_id")}: {field} must be an integer from 0 to 100')
        if c["observed_state"] in {"connected","connected_restricted"} and not c.get("evidence"):
            errors.append(f'{c["connector_id"]}: connected state requires evidence')
        if c["allocated_role"]=="source_byte_store" and not c["approved_root"] and c["access_mode"] not in {"metadata_read_only","blocked","export_only"}:
            errors.append(f'{c["connector_id"]}: unapproved byte source cannot write')
        if c["observed_state"]=="tool_available_unassessed" and c["connector_quality_score"]>10:
            errors.append(f'{c["connector_id"]}: unassessed connector score exceeds 10')
    p=doc.get("policy",{})
    for k in ("autonomous_uploads","autonomous_moves","autonomous_deletes","public_shares","verified_claims_from_connector_metadata"):
        if p.get(k) is not False: errors.append(f"policy.{k} must be false")
    if by.get("supabase_backend_ops",{}).get("allocated_role")!="staging_only" or by.get("supabase_backend_ops",{}).get("access_mode")!="metadata_read_only":
        errors.append("supabase_backend_ops must remain metadata-read-only staging")
    if by.get("netlify",{}).get("allocated_role")!="excluded_confidential":
        errors.append("Netlify must remain excluded from confidential data")
    if by.get("amplitude",{}).get("observed_state")!="blocked":
        errors.append("Amplitude must remain blocked until reauthentication")
    if any(w.get("writes_policy") not in {"proposal_only","control_receipts_only"} for w in doc.get("notion_workers",[])):
        errors.append("workers may write proposals or control receipts only")
    forbidden={"token","password","secret","api_key","private_key"}
    def walk(x):
        if isinstance(x,dict):
            for k,v in x.items():
                if k.lower() in forbidden: errors.append(f"forbidden credential field: {k}")
                walk(v)
        elif isinstance(x,list):
            for v in x: walk(v)
    walk(doc)
    return errors

def validate(doc):
    return semantic_errors(doc)

def main():
    doc=json.loads(REGISTRY.read_text())
    errors=validate(doc)
    if errors:
        print("\n".join(errors),file=sys.stderr); return 1
    tests=[]
    bad=copy.deepcopy(doc); bad["policy"]["autonomous_uploads"]=True; tests.append(bad)
    bad=copy.deepcopy(doc); bad["connectors"][1]["connector_id"]=bad["connectors"][0]["connector_id"]; tests.append(bad)
    bad=copy.deepcopy(doc); bad["connectors"][0]["connector_quality_score"]=101; tests.append(bad)
    bad=copy.deepcopy(doc); bad["connectors"][0]["allocated_role"]="reference_only"; tests.append(bad)
    bad=copy.deepcopy(doc); bad["connectors"][4]["access_mode"]="bounded_control_write"; tests.append(bad)
    for i,bad in enumerate(tests,1):
        if not validate(bad):
            print(f"negative control {i} unexpectedly passed",file=sys.stderr); return 1
    print(f'PASS: {len(doc["connectors"])} connectors, {len(doc["notion_workers"])} workers, {len(doc["automations"])} enriched automations + negative controls')
    return 0
if __name__=="__main__": raise SystemExit(main())
