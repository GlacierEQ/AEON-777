import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const schema = JSON.parse(fs.readFileSync(new URL("./CONNECTOR_FABRIC_SCHEMA.json", import.meta.url)));
const registry = JSON.parse(fs.readFileSync(new URL("./CONNECTOR_FABRIC.json", import.meta.url)));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

if (!validate(registry)) {
  console.error(validate.errors);
  process.exit(1);
}

const invalid = structuredClone(registry);
invalid.connectors[0].connector_quality_score = 101;
if (validate(invalid)) {
  console.error("schema negative control unexpectedly passed");
  process.exit(1);
}

console.log(`PASS: strict Draft 2020-12 schema validation for ${registry.connectors.length} connectors`);
