import path from "node:path";

const MAX_RECEIPT_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

const canonicalize = (value) => {
  if (typeof value !== "string" || value.includes("\0")) return null;
  const slashed = value.replaceAll("\\", "/");
  if (!slashed.startsWith("/") && !/^[A-Za-z]:\//.test(slashed)) return null;
  return path.posix.normalize(slashed).replace(/\/+$/, "");
};

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
  if (!request.path) reasons.push("path_missing");

  const requestedPath = request.path ? canonicalize(request.path) : null;
  if (!requestedPath) reasons.push("path_invalid");
  const approvedRoot = requestedPath && control.routing.approved_roots.find((root) => {
    const normalizedRoot = canonicalize(root);
    return normalizedRoot && (requestedPath === normalizedRoot || requestedPath.startsWith(`${normalizedRoot}/`));
  });
  if (!approvedRoot) reasons.push("outside_approved_root");
  if (request.mode !== "metadata_read") reasons.push("mode_not_approved");
  if (request.write_requested) reasons.push("write_requires_separate_human_gate");

  return {
    allowed: reasons.length === 0,
    decision: reasons.length === 0 ? "metadata_read_allowed" : "blocked",
    reasons
  };
}
