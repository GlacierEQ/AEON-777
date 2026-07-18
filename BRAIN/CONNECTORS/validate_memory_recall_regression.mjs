import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const schema = JSON.parse(fs.readFileSync(new URL("./MEMORY_RECALL_REGRESSION_SCHEMA.json", import.meta.url), "utf8"));
const receipt = JSON.parse(fs.readFileSync(new URL("./MEMORY_RECALL_REGRESSION_2026-07-17.json", import.meta.url), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);
if (!validate(receipt)) {
  console.error(validate.errors);
  process.exit(1);
}

for (const runName of ["baseline", "guarded"]) {
  const run = receipt[runName];
  const scopes = run.results.map((item) => item.scope);
  if (new Set(scopes).size !== run.total_scopes) throw new Error(`${runName}: duplicate or missing scope`);
  const observed = run.results.filter((item) => item.correction_ranked_first).length;
  if (observed !== run.passed_scopes) throw new Error(`${runName}: pass count mismatch`);
}
if (receipt.guarded.results.some((item) => !item.legacy_unqualified_result_observed)) {
  throw new Error("receipt must not imply legacy result sanitization");
}
if (receipt.guarded.passed_scopes === receipt.guarded.total_scopes) {
  throw new Error("negative control unexpectedly describes raw broad recall as fully guarded");
}

const serialized = JSON.stringify(receipt);
for (const pattern of [/\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\b/i, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, /\b\d{3}-\d{2}-\d{4}\b/]) {
  if (pattern.test(serialized)) throw new Error(`forbidden sensitive pattern: ${pattern}`);
}
console.log(`PASS: recall regression ${receipt.guarded.passed_scopes}/${receipt.guarded.total_scopes}; runtime promotion remains disabled`);
