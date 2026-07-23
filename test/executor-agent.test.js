const test = require("node:test");
const assert = require("node:assert/strict");
const { createExecutorAgent } = require("../src/agents/executor.agent");

function fakeToolRegistry(writeFileImpl) {
  return {
    get(name) {
      if (name === "writeFile") return { execute: writeFileImpl };
      return undefined;
    }
  };
}

test("executes a real write for each change and returns the tool's actual result", async () => {
  const executor = createExecutorAgent();
  const calls = [];
  const toolRegistry = fakeToolRegistry(({ file, content }) => {
    calls.push({ file, content });
    return { success: true, file, path: `/workspace/${file}` };
  });

  const result = await executor.execute(
    { status: "SUCCESS", planId: "plan-1", changes: [{ file: "a.py", content: "print(1)" }], commands: [], errors: [] },
    { toolRegistry }
  );

  assert.equal(calls.length, 1);
  assert.equal(result.status, "SUCCESS");
  assert.equal(result.changes[0].success, true);
  assert.equal(result.errors.length, 0);
});

test("propagates a tool failure into the execution result instead of hiding it", async () => {
  const executor = createExecutorAgent();
  const toolRegistry = fakeToolRegistry(({ file }) => (
    { success: false, file, error: "disk full" }
  ));

  const result = await executor.execute(
    { status: "SUCCESS", planId: "plan-2", changes: [{ file: "b.py", content: "x" }], commands: [], errors: [] },
    { toolRegistry }
  );

  assert.equal(result.status, "FAILED");
  assert.equal(result.changes[0].success, false);
  assert.ok(result.errors.some(e => e.includes("b.py") && e.includes("disk full")));
});

test("passes conversational intents through untouched, with no filesystem calls", async () => {
  const executor = createExecutorAgent();
  let called = false;
  const toolRegistry = fakeToolRegistry(() => {
    called = true;
    return { success: true };
  });

  const result = await executor.execute(
    { status: "SUCCESS", planId: "plan-3", changes: [], commands: [], errors: [], reply: "Hello!" },
    { toolRegistry }
  );

  assert.equal(called, false);
  assert.equal(result.reply, "Hello!");
  assert.equal(result.status, "SUCCESS");
});

test("reports commands as skipped rather than silently dropping them", async () => {
  const executor = createExecutorAgent();
  const toolRegistry = fakeToolRegistry(() => ({ success: true }));

  const result = await executor.execute(
    { status: "SUCCESS", planId: "plan-4", changes: [], commands: ["python b.py"], errors: [] },
    { toolRegistry }
  );

  assert.equal(result.commands.length, 0);
  assert.ok(result.errors.some(e => e.includes("python b.py")));
});
