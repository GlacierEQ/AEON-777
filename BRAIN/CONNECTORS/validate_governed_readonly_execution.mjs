import fs from "node:fs";
import assert from "node:assert/strict";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const schema = JSON.parse(fs.readFileSync(new URL("./GOVERNED_READONLY_EXECUTION_RECEIPT_SCHEMA.json", import.meta.url)));
const receipt = JSON.parse(fs.readFileSync(new URL("./receipts/GOVERNED_NOTION_READ_2026-08-01.json", import.meta.url)));

const ajv = new Ajv2020({allErrors: true, strict: true});
addFormats(ajv);
const validate = ajv.compile(schema);
assert.equal(validate(receipt), true, JSON.stringify(validate.errors));

assert.equal(receipt.negative_control.projection_eligible, false);
assert.equal(receipt.negative_control.status, "partial");
assert.equal(receipt.recovery.status, "succeeded");
assert.equal(receipt.recovery.reservation_status, "consumed");
assert.equal(receipt.recovery.verification_status, "verified");
assert.equal(receipt.recovery.notion_sync_status, "synced");
assert.equal(receipt.recovery.raw_persisted, false);
assert.notEqual(receipt.negative_control.job_id, receipt.recovery.job_id);
assert.equal(receipt.queue_ack, "not_exercised");
assert.equal(receipt.safety_boundary.route_promoted_live, false);

const invalid = structuredClone(receipt);
invalid.recovery.raw_persisted = true;
assert.equal(validate(invalid), false);

console.log("Governed read-only execution receipt validated.");
