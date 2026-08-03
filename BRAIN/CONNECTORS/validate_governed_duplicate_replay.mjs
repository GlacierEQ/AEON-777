import fs from "node:fs";
import assert from "node:assert/strict";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const schema = JSON.parse(fs.readFileSync(new URL("./IDEMPOTENT_REPLAY_RECEIPT_SCHEMA.json", import.meta.url)));
const receipt = JSON.parse(fs.readFileSync(new URL("./receipts/GOVERNED_NOTION_DUPLICATE_REPLAY_2026-08-02.json", import.meta.url)));

const ajv = new Ajv2020({allErrors: true, strict: true});
addFormats(ajv);
const validate = ajv.compile(schema);
assert.equal(validate(receipt), true, JSON.stringify(validate.errors));
assert.equal(receipt.replay_result.job_id, receipt.original_job_id);
assert.deepEqual(receipt.after_counts, receipt.before_counts);
assert.equal(receipt.replay_result.enqueued, false);
assert.equal(receipt.safety_boundary.external_invocation, false);
assert.equal(receipt.safety_boundary.additional_rpc_spend, false);

const invalid = structuredClone(receipt);
invalid.after_counts.ledger += 1;
assert.equal(validate(invalid), true, JSON.stringify(validate.errors));
assert.throws(() => assert.deepEqual(invalid.after_counts, invalid.before_counts));

console.log("Governed duplicate replay receipt validated.");
