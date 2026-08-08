import fs from "node:fs";
const path = new URL("./CASE_FABRIC_FRONTEND_BINDING.v1.json", import.meta.url);
const binding = JSON.parse(fs.readFileSync(path, "utf8"));
const requiredTypes = ["case","event","actor","source","evidence_item","claim","contradiction","authority","filing","task","decision","memory","receipt"];
const requiredPartitions = ["verified_record","hypothesis_or_discovery_target","private_work_product","filing_ready_assertion"];
const fail = (m) => { throw new Error(m); };
if (binding.schema !== "casebrain.case-fabric.frontend-binding.v1") fail("schema");
if (binding.thread_anchor !== "MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51") fail("thread anchor");
for (const x of requiredTypes) if (!binding.object_types.includes(x)) fail(`missing object type: ${x}`);
for (const x of requiredPartitions) if (!binding.truth_partitions.includes(x)) fail(`missing truth partition: ${x}`);
for (const key of ["projection_is_evidence","connector_presence_proves_authentication","silent_overwrite_allowed","privileged_bytes_in_projection","protected_minor_details_in_projection","allegation_bearing_narratives_in_general_memory"]) if (binding.governance[key] !== false) fail(`unsafe governance flag: ${key}`);
if (binding.governance.mutation_requires_receipt !== true) fail("mutation receipts");
if (binding.quality.connector_quality_separate_from_data_quality !== true || binding.quality.unknown_scores_promoted !== false) fail("quality separation");
for (const f of binding.frontends) {
  if (f.state.includes("blocked") && f.mode !== "none") fail(`blocked frontend enabled: ${f.key}`);
  if (f.state.includes("methods_unavailable") && f.mode !== "none") fail(`unavailable frontend enabled: ${f.key}`);
}
console.log("case fabric frontend binding: valid");
