import { createHash, timingSafeEqual } from "node:crypto";

const SENSITIVE_KEY = /(?:authorization|api[_-]?key|token|secret|password|private[_-]?key|cookie)/i;

export function canonicalize(value) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Non-finite numbers are not canonical JSON");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value).filter((key) => value[key] !== undefined).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
  }
  throw new TypeError(`Unsupported canonical JSON value: ${typeof value}`);
}

export function sha256(value) {
  const source = typeof value === "string" ? value : canonicalize(value);
  return createHash("sha256").update(source).digest("hex");
}

export function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function redact(value, key = "") {
  if (SENSITIVE_KEY.test(key)) return "[REDACTED]";
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, redact(childValue, childKey)]));
  }
  return value;
}

export function bounded(value, maxBytes = 16_384) {
  const serialized = typeof value === "string" ? value : canonicalize(value);
  return Buffer.byteLength(serialized, "utf8") <= maxBytes ? value : { truncated: true, sha256: sha256(serialized), bytes: Buffer.byteLength(serialized, "utf8") };
}
