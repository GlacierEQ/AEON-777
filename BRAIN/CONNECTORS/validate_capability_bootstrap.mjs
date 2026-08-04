import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const schema = JSON.parse(fs.readFileSync(new URL('./capability_bootstrap/capability_bootstrap.schema.json', import.meta.url), 'utf8'));
const receipt = JSON.parse(fs.readFileSync(new URL('./capability_bootstrap/receipts/GITHUB_CAPABILITY_BOOTSTRAP_2026-08-03.json', import.meta.url), 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validate(value) {
  assert(validateSchema(value), ajv.errorsText(validateSchema.errors, { separator: ' | ' }));

  const { tool_surface: surface, authentication: auth, probe, classification, execution } = value;

  if (classification.availability === 'connected') {
    assert(surface.discovered === true, 'connected connector was not discovered');
    assert(probe.attempted === true && probe.success === true, 'connected connector lacks a successful live probe');
    assert(probe.receipt_refs.length > 0, 'connected connector lacks probe receipts');
    assert(classification.freshness === 'fresh', 'connected current-run probe must be fresh');
  }

  if (classification.availability === 'unavailable') {
    assert(surface.discovered === true, 'unavailable claim made without discovery');
    assert(probe.attempted === true, 'unavailable claim made without a probe');
    assert(probe.success === false, 'unavailable claim conflicts with successful probe');
    assert(typeof probe.error_code === 'string' && probe.error_code.length > 0, 'unavailable claim lacks exact error code');
    assert(surface.discovery_receipts.length > 0, 'unavailable claim lacks discovery receipt');
    assert(execution.system_side_executable_remaining === false, 'unavailable claim made while system-side work remains');
  }

  if (probe.success === true) {
    assert(classification.availability !== 'unavailable', 'successful probe cannot be classified unavailable');
    assert(probe.error_code === null, 'successful probe must not retain an error code');
  }

  assert(auth.inferred_from_tool_visibility === false, 'authentication was inferred from tool visibility');

  if (execution.operator_action_required === true) {
    assert(execution.system_side_executable_remaining === false, 'operator handoff is premature');
  }

  for (const failure of execution.partial_failures) {
    assert(failure.unaffected_work_continued === true, 'partial failure aborted unaffected work');
  }
}

validate(receipt);

const negativeControls = [
  ['false-unavailable', (x) => {
    x.classification.availability = 'unavailable';
    x.classification.basis = 'assumed unavailable';
    x.probe.success = false;
    x.probe.attempted = false;
    x.probe.error_code = null;
  }, 'without a probe'],
  ['successful-but-unavailable', (x) => {
    x.classification.availability = 'unavailable';
    x.execution.system_side_executable_remaining = false;
    x.probe.error_code = 'invented';
  }, 'conflicts with successful probe'],
  ['auth-inference', (x) => {
    x.authentication.inferred_from_tool_visibility = true;
  }, 'must be equal to constant'],
  ['premature-handoff', (x) => {
    x.execution.operator_action_required = true;
  }, 'operator handoff is premature'],
  ['partial-failure-abort', (x) => {
    x.execution.partial_failures = [{
      slice: 'secondary connector',
      error_code: 'route_failed',
      dependent_state: 'unverified',
      unaffected_work_continued: false
    }];
  }, 'must be equal to constant']
];

for (const [name, mutate, expected] of negativeControls) {
  const candidate = structuredClone(receipt);
  mutate(candidate);
  let error = null;
  try { validate(candidate); } catch (caught) { error = caught; }
  assert(error && error.message.includes(expected), `${name} negative control failed for wrong reason: ${error?.message ?? 'passed'}`);
}

console.log('PASS: live connector discovery and probe evidence are required before unavailable claims');
