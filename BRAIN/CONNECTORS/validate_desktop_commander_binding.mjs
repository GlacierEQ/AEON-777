import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { evaluateDesktopCommanderRoute } from "./desktop_commander_route_guard.mjs";

const read = (name) => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), "utf8"));
const receipt = read("./DESKTOP_COMMANDER_BINDING_RECEIPT_2026-07-25.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(read("./DESKTOP_COMMANDER_BINDING_RECEIPT_SCHEMA.json"));
if (!validate(receipt)) throw new Error(JSON.stringify(validate.errors));

const blocked = evaluateDesktopCommanderRoute({
  principal_sha256: receipt.authentication.principal_sha256,
  path: "/synthetic/pilot",
  mode: "metadata_read",
  write_requested: false
}, receipt);
if (blocked.allowed || !blocked.reasons.includes("no_online_bound_device") ||
    !blocked.reasons.includes("outside_approved_root")) {
  throw new Error("zero-device or root gate did not fail closed");
}

const syntheticReady = structuredClone(receipt);
syntheticReady.device_probe.device_count = 1;
syntheticReady.device_probe.online_device_count = 1;
syntheticReady.routing.approved_roots = ["/synthetic/pilot"];
const principalMismatch = evaluateDesktopCommanderRoute({
  principal_sha256: "0".repeat(64),
  path: "/synthetic/pilot",
  mode: "metadata_read",
  write_requested: false
}, syntheticReady);
if (principalMismatch.allowed || !principalMismatch.reasons.includes("principal_mismatch")) {
  throw new Error("principal mismatch was not blocked");
}

const traversal = evaluateDesktopCommanderRoute({
  principal_sha256: receipt.authentication.principal_sha256,
  path: "/synthetic/pilot-adjacent",
  mode: "metadata_read",
  write_requested: false
}, syntheticReady);
if (traversal.allowed || !traversal.reasons.includes("outside_approved_root")) {
  throw new Error("root-prefix traversal was not blocked");
}

const write = evaluateDesktopCommanderRoute({
  principal_sha256: receipt.authentication.principal_sha256,
  path: "/synthetic/pilot",
  mode: "write",
  write_requested: true
}, syntheticReady);
if (write.allowed || !write.reasons.includes("write_requires_separate_human_gate")) {
  throw new Error("write gate was bypassed");
}

const metadataOnly = evaluateDesktopCommanderRoute({
  principal_sha256: receipt.authentication.principal_sha256,
  path: "/synthetic/pilot",
  mode: "metadata_read",
  write_requested: false
}, syntheticReady);
if (!metadataOnly.allowed) throw new Error(`valid synthetic metadata route rejected: ${metadataOnly.reasons}`);

const serialized = JSON.stringify(receipt);
for (const pattern of [/@/, /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\b/i, /\b\d{3}-\d{2}-\d{4}\b/]) {
  if (pattern.test(serialized)) throw new Error(`forbidden identifier or secret pattern: ${pattern}`);
}
console.log("PASS: Desktop Commander principal binding is hashed; zero-device and root/write gates fail closed");
