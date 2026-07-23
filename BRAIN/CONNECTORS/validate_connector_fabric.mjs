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

const semanticErrors = [];
const ids = new Set();
for (const connector of registry.connectors) {
  const at = `connectors[${connector.connector_id}]`;
  if (ids.has(connector.connector_id)) semanticErrors.push(`${at}: duplicate connector_id`);
  ids.add(connector.connector_id);

  const components = Object.values(connector.connector_quality_components);
  const computedConnectorScore = components.reduce((sum, component) => sum + component.awarded, 0);
  if (computedConnectorScore !== connector.connector_quality_score) {
    semanticErrors.push(`${at}: connector_quality_score must equal component awards`);
  }
  for (const component of components) {
    if (component.awarded > component.possible) {
      semanticErrors.push(`${at}: component award exceeds possible points`);
    }
    if (component.awarded > 0 && component.evidence.length === 0) {
      semanticErrors.push(`${at}: positive component award requires evidence`);
    }
  }

  if (connector.root_scope_state === "approved") {
    if (!connector.approved_root || connector.approved_roots.length === 0) {
      semanticErrors.push(`${at}: approved root state requires an exact root pointer`);
    }
  }
  if (connector.root_scope_state === "approved_pointer_missing" && !connector.approved_root) {
    semanticErrors.push(`${at}: approved_pointer_missing must preserve the legacy approval signal`);
  }
  if (connector.last_successful_probe === null) {
    if (connector.freshness.status !== "unknown") {
      semanticErrors.push(`${at}: freshness cannot be asserted without a successful-probe timestamp`);
    }
    if (connector.connector_quality_components.freshness.awarded !== 0) {
      semanticErrors.push(`${at}: unknown freshness must score zero`);
    }
  }
  if (connector.provenance_coverage.status === "unknown" && connector.connector_quality_components.provenance_support.awarded !== 0) {
    semanticErrors.push(`${at}: unknown provenance coverage must score zero`);
  }
  if (connector.idempotency_key_strategy.status === "unknown" && connector.connector_quality_components.idempotency_retry_safety.awarded !== 0) {
    semanticErrors.push(`${at}: unknown idempotency strategy must score zero`);
  }

  const dimensions = Object.values(connector.data_quality_dimensions);
  const knownDimensions = dimensions.filter((value) => value !== null);
  const computedDataScore = knownDimensions.length === 0
    ? 0
    : Math.round(knownDimensions.reduce((sum, value) => sum + value, 0) / knownDimensions.length);
  if (computedDataScore !== connector.data_quality_score) {
    semanticErrors.push(`${at}: data_quality_score must equal the rounded mean of known dimensions, or zero when all are unknown`);
  }
  if (connector.next_gate !== connector.next_human_gate) {
    semanticErrors.push(`${at}: next_gate and next_human_gate diverged during compatibility window`);
  }
}

if (semanticErrors.length) {
  console.error(semanticErrors.join("\n"));
  process.exit(1);
}

const invalid = structuredClone(registry);
invalid.connectors[0].connector_quality_score = 101;
if (validate(invalid)) {
  console.error("schema negative control unexpectedly passed");
  process.exit(1);
}

const invalidUnsupportedFreshness = structuredClone(registry);
invalidUnsupportedFreshness.connectors[0].connector_quality_components.freshness.awarded = 15;
invalidUnsupportedFreshness.connectors[0].connector_quality_score += 15;
if (!validate(invalidUnsupportedFreshness)) {
  console.error("semantic negative control must remain schema-valid");
  process.exit(1);
}
const unsupported = invalidUnsupportedFreshness.connectors[0];
if (!(unsupported.last_successful_probe === null && unsupported.connector_quality_components.freshness.awarded > 0)) {
  console.error("semantic negative control was not constructed correctly");
  process.exit(1);
}

console.log(`PASS: strict schema + semantic audit for ${registry.connectors.length} connectors`);
