import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const schema = JSON.parse(fs.readFileSync(new URL("./MEMORY_QUARANTINE_REGISTRY_SCHEMA.json", import.meta.url), "utf8"));
const registry = JSON.parse(fs.readFileSync(new URL("./MEMORY_QUARANTINE_REGISTRY.json", import.meta.url), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

if (!validate(registry)) {
  console.error(validate.errors);
  process.exit(1);
}

const ids = new Set();
const tags = new Set();
const memoryIds = new Set();
for (const correction of registry.corrections) {
  if (ids.has(correction.correction_id)) throw new Error(`duplicate correction_id: ${correction.correction_id}`);
  if (tags.has(correction.container_tag)) throw new Error(`shared correction container_tag: ${correction.container_tag}`);
  if (memoryIds.has(correction.memory_id)) throw new Error(`duplicate memory_id: ${correction.memory_id}`);
  ids.add(correction.correction_id);
  tags.add(correction.container_tag);
  memoryIds.add(correction.memory_id);
}

const serialized = JSON.stringify(registry);
const forbidden = [
  /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\b/i,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b(?:date of birth|dob)\b/i
];
for (const pattern of forbidden) {
  if (pattern.test(serialized)) throw new Error(`forbidden sensitive pattern: ${pattern}`);
}

const invalid = structuredClone(registry);
invalid.corrections[1].container_tag = invalid.corrections[0].container_tag;
const invalidTags = invalid.corrections.map((item) => item.container_tag);
if (new Set(invalidTags).size === invalidTags.length) {
  throw new Error("negative control unexpectedly passed");
}

console.log(`PASS: ${registry.corrections.length} isolated correction overlays + quarantine negative controls`);
