"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createExecutionContext } = require("../src/runtime/execution-context");

test("creates a unique execution ID for every context", () => {
  const first = createExecutionContext({ request: "one", source: "test" });
  const second = createExecutionContext({ request: "two", source: "test" });

  assert.match(first.executionId, /^[0-9a-f-]{36}$/);
  assert.match(second.executionId, /^[0-9a-f-]{36}$/);
  assert.notEqual(first.executionId, second.executionId);
});

test("creates events with the required runtime envelope", () => {
  const context = createExecutionContext({
    executionId: "execution-fixed",
    request: "inspect",
    source: "cli",
    clock: () => new Date("2026-01-01T00:00:00.000Z")
  });

  const event = context.createEvent("RuntimeRequestReceived", "orchestrator", {
    request: "inspect"
  });

  assert.equal(event.executionId, "execution-fixed");
  assert.equal(event.timestamp, "2026-01-01T00:00:00.000Z");
  assert.equal(event.source, "orchestrator");
  assert.equal(event.name, "RuntimeRequestReceived");
  assert.equal(event.context, context);
});
