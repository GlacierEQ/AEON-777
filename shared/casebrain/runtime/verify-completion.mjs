#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const statePath = process.argv[2] ?? 'shared/casebrain/runtime/doer-state.json';
const absolute = path.resolve(process.cwd(), statePath);
const state = JSON.parse(fs.readFileSync(absolute, 'utf8'));
const required = state.completion_requirements ?? [];
const allowed = new Set(state.allowed_statuses ?? []);
const errors = [];

if (state.mode !== 'DOER') errors.push(`mode must be DOER, got ${state.mode}`);
if (!Array.isArray(state.tasks) || state.tasks.length === 0) errors.push('tasks must be non-empty');

for (const task of state.tasks ?? []) {
  if (!allowed.has(task.status)) {
    errors.push(`${task.task_id}: invalid status ${task.status}`);
    continue;
  }
  if (task.status === 'COMPLETE') {
    for (const field of required) {
      const value = task[field];
      const missing = value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
      if (missing) errors.push(`${task.task_id}: COMPLETE missing ${field}`);
    }
    if (task.verification_result !== 'PASS') errors.push(`${task.task_id}: COMPLETE requires verification_result=PASS`);
    if (!Array.isArray(task.proof) || task.proof.length < 2) errors.push(`${task.task_id}: COMPLETE requires at least two proof objects`);
  }
  if (['IN_PROGRESS','BLOCKED','EXECUTED_UNVERIFIED'].includes(task.status) && !task.next_executable_action) {
    errors.push(`${task.task_id}: ${task.status} requires next_executable_action`);
  }
}

if (errors.length) {
  console.error('CASEBRAIN DOER GATE FAILED');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('CASEBRAIN DOER GATE PASSED');
console.log(`Validated ${state.tasks.length} task(s).`);
