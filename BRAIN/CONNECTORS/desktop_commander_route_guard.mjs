const normalize = (path) => path.replaceAll("\\", "/").replace(/\/+$/, "");

export function evaluateDesktopCommanderRoute(request, control) {
  const reasons = [];
  if (control.authentication.status !== "authenticated") reasons.push("connector_not_authenticated");
  if (control.device_probe.online_device_count < 1) reasons.push("no_online_bound_device");
  if (request.principal_sha256 !== control.authentication.principal_sha256) reasons.push("principal_mismatch");
  if (!request.path) reasons.push("path_missing");

  const requestedPath = request.path ? normalize(request.path) : "";
  const approvedRoot = control.routing.approved_roots.find((root) => {
    const normalizedRoot = normalize(root);
    return requestedPath === normalizedRoot || requestedPath.startsWith(`${normalizedRoot}/`);
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
