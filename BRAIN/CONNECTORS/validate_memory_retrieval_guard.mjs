import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { guardRecall } from "./memory_retrieval_guard.mjs";

const fixture = JSON.parse(fs.readFileSync(new URL("./MEMORY_RETRIEVAL_GUARD_FIXTURE_2026-07-18.json", import.meta.url), "utf8"));
const schema = JSON.parse(fs.readFileSync(new URL("./MEMORY_RETRIEVAL_GUARD_SCHEMA.json", import.meta.url), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const receipts = fixture.cases.map((request) => {
  const receipt = guardRecall(request, fixture.candidates, fixture.generated_at);
  if (!validate(receipt)) throw new Error(JSON.stringify(validate.errors));
  return receipt;
});

const promotedCorrections = receipts.filter((receipt) =>
  receipt.decision === "qualified_output" &&
  receipt.promoted.length === 1 &&
  receipt.promoted[0].output_class === "qualified_correction_rule"
).length;
if (promotedCorrections !== 5) throw new Error(`expected 5/5 correction precedence; got ${promotedCorrections}/5`);
if (receipts.some((receipt) => receipt.promoted.some((item) => item.output_class !== "qualified_correction_rule"))) {
  throw new Error("unqualified output was promoted");
}
if (receipts.some((receipt) => receipt.promoted.some((item) => !item.source_locator || !item.provenance_ref))) {
  throw new Error("promoted output lacks source or provenance");
}

const conflictRequest = { scope: "csea", container_tag: "sm_project_csea" };
const conflictBase = { scope: "csea", semantic_key: "conflict_test", record_class: "source_fact", claim_class: "documented_source_statement", review_state: "verified", container_tag: "sm_project_csea", effective_at: "2026-07-18T00:00:00Z", source_locator: "github://source", provenance_ref: "github://receipt", sensitivity: "restricted" };
const leakageReceipt = guardRecall(conflictRequest, [{ ...conflictBase, candidate_id: "mrg_cross_container", container_tag: "sm_project_default" }], fixture.generated_at);
if (leakageReceipt.decision !== "fail_closed" || leakageReceipt.promoted.length || leakageReceipt.rejected[0]?.reason !== "cross_container_leakage") {
  throw new Error("cross-container candidate did not fail closed with an audit reason");
}
const conflictReceipt = guardRecall(conflictRequest, [
  { ...conflictBase, candidate_id: "mrg_conflict_a", assertion_digest: "sha256:a" },
  { ...conflictBase, candidate_id: "mrg_conflict_b", assertion_digest: "sha256:b" }
], fixture.generated_at);
if (conflictReceipt.decision !== "fail_closed" || conflictReceipt.promoted.length) throw new Error("verified conflict did not fail closed");

const missingStatus = guardRecall(conflictRequest, [{ ...conflictBase, candidate_id: "mrg_missing_status", review_state: null }], fixture.generated_at);
if (missingStatus.decision !== "fail_closed") throw new Error("missing status did not fail closed");

console.log("PASS: retrieval guard 5/5 correction precedence, 0 unqualified promotions, cross-container leakage audited, conflicts fail closed");
