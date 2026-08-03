import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const readJson = (name) => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), "utf8"));
const schema = readJson("./CASEBRAIN_EXECUTION_DELTA_SCHEMA.json");
const receipt = readJson("./receipts/CASEBRAIN_EXECUTION_DELTA_2026-08-02.json");

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const assertValid = (value, label) => {
  if (!validate(value)) {
    throw new Error(`${label} failed schema validation: ${ajv.errorsText(validate.errors, { separator: " | " })}`);
  }
};

const assertInvalid = (value, expectedFragment, label) => {
  if (validate(value)) throw new Error(`${label} unexpectedly passed schema validation`);
  const errors = ajv.errorsText(validate.errors, { separator: " | " });
  if (!errors.includes(expectedFragment)) {
    throw new Error(`${label} failed for the wrong reason: ${errors}`);
  }
};

assertValid(receipt, "canonical execution delta");

for (const connector of receipt.connector_attempts) {
  if (connector.authentication_inferred_from_availability !== false) {
    throw new Error(`${connector.connector_key}: authentication inference is prohibited`);
  }
  if (connector.connector_quality === connector.data_quality) {
    throw new Error(`${connector.connector_key}: connector quality and data quality must remain separate objects`);
  }
  if (connector.provenance.protected_identifiers_persisted !== false) {
    throw new Error(`${connector.connector_key}: protected identifiers must not be persisted`);
  }
  if (["notion", "linear", "clickup", "jira"].includes(connector.connector_key)
      && connector.provenance.byte_persistence === "approved_original_bytes") {
    throw new Error(`${connector.connector_key}: original bytes are forbidden in projection/task systems`);
  }
}

if (receipt.partial_failures.length > 0
    && !receipt.partial_failures.every((failure) => failure.unaffected_work_continued === true)) {
  throw new Error("partial connector failure aborted an unaffected executable slice");
}

if (receipt.completion.operator_action_required === true
    && receipt.authority.system_side_executable_remaining === true) {
  throw new Error("operator handoff is premature while system-side work remains");
}

const inferredAuth = structuredClone(receipt);
inferredAuth.connector_attempts[0].authentication_inferred_from_availability = true;
assertInvalid(inferredAuth, "must be equal to constant", "inferred authentication negative control");

const protectedIdentifierLeak = structuredClone(receipt);
protectedIdentifierLeak.connector_attempts[1].provenance.protected_identifiers_persisted = true;
assertInvalid(protectedIdentifierLeak, "must be equal to constant", "protected identifier negative control");

const wrongAuthorityOrder = structuredClone(receipt);
wrongAuthorityOrder.synchronization.authority_order = ["notion_projection", "github_canonical"];
assertInvalid(wrongAuthorityOrder, "must be equal to constant", "authority-order negative control");

const rawByteDispatch = structuredClone(receipt);
rawByteDispatch.dispatch.raw_source_bytes_requested = true;
assertInvalid(rawByteDispatch, "must be equal to constant", "raw-source-byte negative control");

console.log("PASS: CASEBRAIN execution delta schema enforces connector truth, provenance boundaries, quality separation, synchronization authority, and execution-first completion");
