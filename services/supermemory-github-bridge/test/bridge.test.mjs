import assert from "node:assert/strict";
import test from "node:test";
import { BridgeService } from "../src/bridge.mjs";
import { BridgeError } from "../src/errors.mjs";
import { FakeGithub, FakeLedger, FakeMemory, agent, approver, commitAction, config, verifyAction } from "./helpers.mjs";

function service(mode = "guarded") {
  const log = [];
  const ledger = new FakeLedger(log);
  const github = new FakeGithub(log);
  const memory = new FakeMemory(log);
  const settings = config({ BRIDGE_MODE: mode });
  assert.equal(settings.ok, true, settings.errors.join(", "));
  return { bridge: new BridgeService({ config: settings, ledger, github, memory }), log, ledger, github, memory };
}

test("read-only verification retrieves memory before GitHub and captures hashes", async () => {
  const { bridge, log, ledger, github } = service();
  const result = await bridge.execute({ body: { op: "verify", action: verifyAction() }, identity: agent, traceId: "trace-verify" });
  assert.equal(result.status, 200);
  assert.equal(result.body.result.commit_sha, "a".repeat(40));
  assert.ok(log.indexOf("memory.retrieve") < log.indexOf("github.repositoryVerify"));
  assert.equal(github.calls.filter((call) => call.name === "repositoryVerify").length, 1);
  const completed = ledger.events.find((event) => event.phase === "completed" && event.status === "succeeded");
  assert.equal(completed.retrieval_request_sha256, "memory-request-hash");
  assert.equal(completed.retrieval_response_sha256, "memory-response-hash");
  assert.equal(completed.repository, "allowed/repository");
  assert.equal(completed.branch, "main");
});

test("repository allowlist rejects before Supermemory or GitHub", async () => {
  const { bridge, memory, github, ledger } = service();
  await assert.rejects(
    bridge.execute({ body: { op: "verify", action: verifyAction({ repository: "other/repository" }) }, identity: agent, traceId: "trace-denied" }),
    (error) => error instanceof BridgeError && error.code === "repository_not_allowed"
  );
  assert.equal(memory.calls.length, 0);
  assert.equal(github.calls.length, 0);
  assert.equal(ledger.events.at(-1).phase, "policy");
  assert.equal(ledger.events.at(-1).status, "denied");
});

test("mutation needs a separate approver confirmation and succeeds only after it", async () => {
  const { bridge, github, ledger } = service();
  const action = commitAction();
  const plan = await bridge.execute({ body: { op: "plan", action }, identity: agent, traceId: "trace-plan" });
  await assert.rejects(
    bridge.execute({ body: { op: "execute", idempotency_key: "ee5cefc7-6e9c-458a-ae1e-7f7ab1ce7070", action }, identity: agent, traceId: "trace-unconfirmed" }),
    (error) => error instanceof BridgeError && error.code === "receipt_required"
  );
  assert.equal(github.calls.filter((call) => call.name === "createCommit").length, 0);
  const confirmation = await bridge.execute({ body: { op: "confirm", decision: "approve", plan_token: plan.body.plan.token }, identity: approver, traceId: "trace-confirm" });
  const execution = await bridge.execute({
    body: { op: "execute", idempotency_key: "ee5cefc7-6e9c-458a-ae1e-7f7ab1ce7070", action, confirmation_token: confirmation.body.confirmation.token },
    identity: agent,
    traceId: "trace-execute"
  });
  assert.equal(execution.status, 200);
  assert.equal(execution.body.result.commit_sha, "c".repeat(40));
  assert.equal(github.calls.filter((call) => call.name === "createCommit").length, 1);
  assert.ok(ledger.events.some((event) => event.phase === "confirmed" && event.approver === "human-operator"));
  assert.ok(ledger.events.some((event) => event.phase === "completed" && event.status === "succeeded" && event.resulting_commit_sha === "c".repeat(40)));
});

test("confirmation cannot be replayed under a second idempotency key", async () => {
  const { bridge, github } = service();
  const action = commitAction();
  const plan = await bridge.execute({ body: { op: "plan", action }, identity: agent, traceId: "trace-plan" });
  const confirmation = await bridge.execute({ body: { op: "confirm", decision: "approve", plan_token: plan.body.plan.token }, identity: approver, traceId: "trace-confirm" });
  await bridge.execute({ body: { op: "execute", idempotency_key: "dbbcc4ad-82dd-4ec2-8078-3643aa1a9d98", action, confirmation_token: confirmation.body.confirmation.token }, identity: agent, traceId: "trace-first" });
  await assert.rejects(
    bridge.execute({ body: { op: "execute", idempotency_key: "d0e7a5ec-9d4a-44a9-b93e-bff40ee666b4", action, confirmation_token: confirmation.body.confirmation.token }, identity: agent, traceId: "trace-second" }),
    (error) => error instanceof BridgeError && error.code === "confirmation_already_used"
  );
  assert.equal(github.calls.filter((call) => call.name === "createCommit").length, 1);
});

test("verification mode denies writes even with a signed confirmation path unavailable", async () => {
  const { bridge } = service("verify");
  await assert.rejects(
    bridge.execute({ body: { op: "plan", action: commitAction() }, identity: agent, traceId: "trace-verify-mode" }),
    (error) => error instanceof BridgeError && error.code === "verification_mode"
  );
});

test("every requested write action is operational after a separate confirmation", async () => {
  const cases = [
    ["push", { type: "push", repository: "allowed/repository", repository_id: "1001", branch: "main", expected_head_sha: "a".repeat(40), payload: { commit_sha: "b".repeat(40) } }, "push"],
    ["pull request", { type: "pull_request.create", repository: "allowed/repository", repository_id: "1001", branch: "main", expected_head_sha: "a".repeat(40), payload: { title: "Bridge PR", body: "Open the bridge PR.", head: "main" } }, "createPullRequest"],
    ["merge", { type: "pull_request.merge", repository: "allowed/repository", repository_id: "1001", branch: "main", expected_head_sha: "a".repeat(40), payload: { pull_number: 7, merge_method: "squash" } }, "mergePullRequest"],
    ["workflow", { type: "workflow.dispatch", repository: "allowed/repository", repository_id: "1001", branch: "main", expected_head_sha: "a".repeat(40), payload: { workflow_id: "build.yml", inputs: { target: "bridge" } } }, "dispatchWorkflow"],
    ["delete", { type: "delete", repository: "allowed/repository", repository_id: "1001", branch: "main", expected_head_sha: "a".repeat(40), payload: { path: "src/remove.txt", sha: "b".repeat(40), message: "Remove generated file" } }, "deleteFile"],
    ["external message", { type: "external.message", repository: "allowed/repository", repository_id: "1001", branch: "main", expected_head_sha: "a".repeat(40), payload: { issue_number: 7, body: "Bridge message" } }, "sendExternalMessage"]
  ];
  for (const [label, action, githubMethod] of cases) {
    const { bridge, github } = service();
    const plan = await bridge.execute({ body: { op: "plan", action }, identity: agent, traceId: `trace-plan-${label}` });
    const confirmation = await bridge.execute({ body: { op: "confirm", decision: "approve", plan_token: plan.body.plan.token }, identity: approver, traceId: `trace-confirm-${label}` });
    const result = await bridge.execute({
      body: { op: "execute", idempotency_key: crypto.randomUUID(), action, confirmation_token: confirmation.body.confirmation.token },
      identity: agent,
      traceId: `trace-execute-${label}`
    });
    assert.equal(result.status, 200, label);
    assert.equal(github.calls.filter((call) => call.name === githubMethod).length, 1, label);
  }
});
