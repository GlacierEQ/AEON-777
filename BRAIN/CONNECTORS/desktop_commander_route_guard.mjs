import path from "node:path";

const MAX_RECEIPT_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

const canonicalize = (value) => {
  if (typeof value !== "string" || value.includes("\0")) return null;
  const slashed = value.replaceAll("\\", "/");
  if (!slashed.startsWith("/") && !/^[A-Za-z]:\//.test(slashed)) return null;
  return path.posix.normalize(slashed).replace(/\/+$/, "");
};

const containedBy = (candidate, root) => candidate === root || candidate.startsWith(`${root}/`);

export function evaluateDesktopCommanderRoute(request, control, evaluatedAt = new Date().toISOString()) {
  const reasons = [];
  const observedMs = Date.parse(control.observed_at);
  const evaluatedMs = Date.parse(evaluatedAt);
  if (!Number.isFinite(observedMs) || !Number.isFinite(evaluatedMs) ||
      evaluatedMs - observedMs > MAX_RECEIPT_AGE_MS) {
    reasons.push("control_receipt_stale");
  } else if (observedMs - evaluatedMs > MAX_FUTURE_SKEW_MS) {
    reasons.push("control_receipt_future_dated");
  }
  if (control.authentication.status !== "authenticated") reasons.push("connector_not_authenticated");
  if (control.binding.state !== "verified" || control.binding.principal_match !== "verified") {
    reasons.push("principal_binding_unverified");
  }
  if (control.device_probe.online_device_count < 1) reasons.push("no_online_bound_device");
  if (request.principal_sha256 !== control.authentication.principal_sha256) reasons.push("principal_mismatch");
  if (control.routing.read_allowed !== true || control.routing.decision !== "metadata_read_allowed") {
    reasons.push("routing_read_not_authorized");
  }
  if (!request.path) reasons.push("path_missing");
  if (request.path_resolution_verified !== true || !request.resolved_path) reasons.push("path_resolution_unverified");
  if (request.symlink_traversal_detected === true) reasons.push("symlink_escape_detected");

  const requestedPath = request.path ? canonicalize(request.path) : null;
  const resolvedPath = request.resolved_path ? canonicalize(request.resolved_path) : null;
  if (!requestedPath || !resolvedPath) reasons.push("path_invalid");

  const approvedIndex = requestedPath ? control.routing.approved_roots.findIndex((root) => {
    const normalizedRoot = canonicalize(root);
    return normalizedRoot && containedBy(requestedPath, normalizedRoot);
  }) : -1;
  const declaredRoot = approvedIndex >= 0 ? canonicalize(control.routing.approved_roots[approvedIndex]) : null;
  const resolvedRoot = approvedIndex >= 0 ? canonicalize(control.routing.approved_root_real_paths?.[approvedIndex]) : null;
  if (!declaredRoot || !resolvedRoot || !resolvedPath || !containedBy(resolvedPath, resolvedRoot)) {
    reasons.push("outside_approved_root");
  }
  if (request.mode !== "metadata_read") reasons.push("mode_not_approved");
  if (request.write_requested || control.routing.write_allowed !== false) {
    reasons.push("write_requires_separate_human_gate");
  }

  return {
    allowed: reasons.length === 0,
    decision: reasons.length === 0 ? "metadata_read_allowed" : "blocked",
    reasons
  };
}
