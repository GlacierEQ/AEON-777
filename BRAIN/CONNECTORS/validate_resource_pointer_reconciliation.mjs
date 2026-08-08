import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const readJson = (relative) => JSON.parse(
  fs.readFileSync(new URL(relative, import.meta.url), "utf8")
);

const pointerSchema = readJson("../RESOURCE_POINTER_SCHEMA.json");
const memorySchema = readJson("../MEMORY_RECORD_SCHEMA.json");
const validPointer = readJson("../examples/resource_pointer.valid.json");
const invalidPointer = readJson("../examples/resource_pointer.invalid_missing_identity.json");
const validMemory = readJson("../examples/memory_record.valid.json");
const invalidMemory = readJson("../examples/memory_record.invalid_verified_allegation.json");

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(pointerSchema);
const validatePointer = ajv.getSchema(pointerSchema.$id);
const validateMemory = ajv.compile(memorySchema);

if (!validatePointer(validPointer)) {
  throw new Error(`valid resource pointer rejected: ${JSON.stringify(validatePointer.errors)}`);
}
if (validatePointer(invalidPointer)) {
  throw new Error("resource pointer without stable identity unexpectedly passed");
}
if (!validateMemory(validMemory)) {
  throw new Error(`valid pointer-backed memory rejected: ${JSON.stringify(validateMemory.errors)}`);
}
if (validateMemory(invalidMemory)) {
  throw new Error("verified allegation negative control unexpectedly passed");
}

const resolver = fileURLToPath(new URL("../resource_pointer_resolver.py", import.meta.url));
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

function runResolver(args, expectedStatus = 0) {
  const result = spawnSync("python3", [resolver, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.status !== expectedStatus) {
    throw new Error(
      `resolver exit ${result.status}, expected ${expectedStatus}: ${result.stderr || result.stdout}`
    );
  }
  return result.stdout.trim();
}

const byId = JSON.parse(runResolver(["D225-JIMS-RAW-001", "--json", "--require-unique"]));
if (byId.length < 1 || byId[0].score !== 100 || byId[0].resource_id !== "D225-JIMS-RAW-001") {
  throw new Error("stable Dkt. 225 source-object identity did not resolve deterministically");
}
if (!byId[0].canonical_uri.includes("seqNo=225")) {
  throw new Error("Dkt. 225 resolver result lost its native Judiciary route");
}
if (byId[0].status !== "NOT_ACQUIRED_RUNTIME_ACCESS_BLOCKED") {
  throw new Error("Dkt. 225 blocker state was not preserved");
}

const digest = "26201dc2a2b4849b2a578267b57f840240fd141dea5ff4d87f9b668444ffffd8";
const byHash = JSON.parse(runResolver([digest, "--json"]));
const topHashIds = new Set(
  byHash.filter((item) => item.score === 100).map((item) => item.resource_id)
);
const expectedHashIds = new Set([
  "D225-CANDIDATE-LIBRARY-001",
  "D225-CANDIDATE-LIBRARY-002",
]);
if (
  topHashIds.size !== expectedHashIds.size ||
  [...expectedHashIds].some((resourceId) => !topHashIds.has(resourceId))
) {
  throw new Error(`byte-identical candidate ambiguity was not preserved: ${JSON.stringify([...topHashIds])}`);
}

const noMatch = runResolver(["not-a-real-pointer-zzzz", "--json"], 1);
if (noMatch !== "[]") {
  throw new Error("unknown pointer query did not fail closed");
}

console.log(
  "PASS: reusable pointer schema, pointer-backed memory, exact native resolution, duplicate-hash ambiguity, and fail-closed no-match validated"
);
