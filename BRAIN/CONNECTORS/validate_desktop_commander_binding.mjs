import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { evaluateDesktopCommanderRoute } from "./desktop_commander_route_guard.mjs";

const read = (name) => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), "utf8"));
const receipt = read("./DESKTOP_COMMANDER_BINDING_RECEIPT_2026-07-25.json");
const evaluatedAt = "2026-07-26T04:00:00Z";
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(read("./DESKTOP_COMMANDER_BINDING_RECEIPT_SCHEMA.json"));
const assertReceipt = (candidate, label) => {
  if (!validate(candidate)) throw new Error(`${label}: ${JSON.stringify(validate.errors)}`);
  if (candidate.device_probe.online_device_count > candidate.device_probe.device_count) {
    throw new Error(`${label}: online device count exceeds total device count`);
  }
  if (candidate.routing.approved_roots.length !== candidate.routing.approved_root_real_paths.length) {
    throw new Error(`${label}: declared and resolved root lists are not one-to-one`);
  }
};
assertReceipt(receipt, "blocked receipt");

const route = (request, control = receipt, at = evaluatedAt) =>
  evaluateDesktopCommanderRoute(request, control, at);
const validRequest = {
  principal_sha256: receipt.authentication.principal_sha256,
  path: "/synthetic/pilot",
  resolved_path: "/resolved/synthetic/pilot",
  path_resolution_verified: true,
  symlink_traversal_detected: false,
  mode: "metadata_read",
  write_requested: false
};

const blocked = route(validRequest);
if (blocked.allowed || !blocked.reasons.includes("principal_binding_unverified") ||
    !blocked.reasons.includes("no_online_bound_device") ||
    !blocked.reasons.includes("routing_read_not_authorized") ||
    !blocked.reasons.includes("outside_approved_root")) {
  throw new Error("unverified binding, device, routing, or root gate did not fail closed");
}

const syntheticReady = structuredClone(receipt);
syntheticReady.binding.state = "verified";
syntheticReady.binding.principal_match = "verified";
syntheticReady.device_probe.device_count = 1;
syntheticReady.device_probe.online_device_count = 1;
syntheticReady.routing.approved_roots = ["/synthetic/pilot"];
syntheticReady.routing.approved_root_real_paths = ["/resolved/synthetic/pilot"];
syntheticReady.routing.read_allowed = true;
syntheticReady.routing.decision = "metadata_read_allowed";
syntheticReady.routing.next_gate = "bounded_metadata_probe";
assertReceipt(syntheticReady, "synthetic ready receipt");

const principalMismatch = route({ ...validRequest, principal_sha256: "0".repeat(64) }, syntheticReady);
if (principalMismatch.allowed || !principalMismatch.reasons.includes("principal_mismatch")) {
  throw new Error("principal mismatch was not blocked");
}

const deniedControl = structuredClone(syntheticReady);
deniedControl.routing.read_allowed = false;
deniedControl.routing.decision = "blocked";
const explicitDenial = route(validRequest, deniedControl);
if (explicitDenial.allowed || !explicitDenial.reasons.includes("routing_read_not_authorized")) {
  throw new Error("explicit routing denial was ignored");
}

for (const escapedPath of ["/synthetic/pilot-adjacent", "/synthetic/pilot/../outside"]) {
  const traversal = route({ ...validRequest, path: escapedPath }, syntheticReady);
  if (traversal.allowed || !traversal.reasons.includes("outside_approved_root")) {
    throw new Error(`declared-root traversal was not blocked: ${escapedPath}`);
  }
}

const symlinkEscape = route({
  ...validRequest,
  path: "/synthetic/pilot/link/sensitive",
  resolved_path: "/outside/sensitive",
  symlink_traversal_detected: true
}, syntheticReady);
if (symlinkEscape.allowed || !symlinkEscape.reasons.includes("symlink_escape_detected") ||
    !symlinkEscape.reasons.includes("outside_approved_root")) {
  throw new Error("resolved symlink escape was not blocked");
}

const unresolved = route({ ...validRequest, path_resolution_verified: false, resolved_path: null }, syntheticReady);
if (unresolved.allowed || !unresolved.reasons.includes("path_resolution_unverified")) {
  throw new Error("unverified path resolution was accepted");
}

const stale = structuredClone(syntheticReady);
stale.observed_at = "2026-07-24T00:00:00Z";
const staleResult = route(validRequest, stale);
if (staleResult.allowed || !staleResult.reasons.includes("control_receipt_stale")) {
  throw new Error("stale control receipt was not blocked");
}

const future = structuredClone(syntheticReady);
future.observed_at = "2026-07-27T00:00:00Z";
const futureResult = route(validRequest, future);
if (futureResult.allowed || !futureResult.reasons.includes("control_receipt_future_dated")) {
  throw new Error("future-dated control receipt was not blocked");
}

const write = route({ ...validRequest, mode: "write", write_requested: true }, syntheticReady);
if (write.allowed || !write.reasons.includes("write_requires_separate_human_gate")) {
  throw new Error("write gate was bypassed");
}

const metadataOnly = route(validRequest, syntheticReady);
if (!metadataOnly.allowed) throw new Error(`valid synthetic metadata route rejected: ${metadataOnly.reasons}`);

const serialized = JSON.stringify(receipt);
for (const pattern of [/@/, /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\b/i, /\b\d{3}-\d{2}-\d{4}\b/]) {
  if (pattern.test(serialized)) throw new Error(`forbidden identifier or secret pattern: ${pattern}`);
}
console.log("PASS: Desktop binding, affirmative routing, real-path containment, principal, freshness, and write gates fail closed");
