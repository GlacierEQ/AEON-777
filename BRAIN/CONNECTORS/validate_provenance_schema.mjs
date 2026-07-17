import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const schema = JSON.parse(
  fs.readFileSync(new URL("./PROVENANCE_RECEIPT_SCHEMA.json", import.meta.url), "utf8"),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.compile(schema);
console.log("PASS: provenance receipt schema compiles under Draft 2020-12 strict mode");
