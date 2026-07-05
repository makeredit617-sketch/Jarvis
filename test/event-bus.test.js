"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createEventBus } = require("../src/events/event-bus");

test("publishes an event to a subscriber", async () => {
  const bus = createEventBus({
    clock: () => new Date("2026-01-01T00:00:00.000Z")
  });
  const received = [];

  bus.subscribe("RuntimeRequestReceived", event => {
    received.push(event);
  });

  const delivered = await bus.publish({
    executionId: "execution-1",
    source: "test",
    name: "RuntimeRequestReceived",
    payload: { request: "status" }
  });

  assert.equal(received.length, 1);
  assert.equal(received[0].executionId, "execution-1");
  assert.equal(received[0].timestamp, "2026-01-01T00:00:00.000Z");
  assert.equal(received[0].source, "test");
  assert.equal(received[0].name, "RuntimeRequestReceived");
  assert.deepEqual(delivered.payload, { request: "status" });
});

test("publishes an event to multiple subscribers", async () => {
  const bus = createEventBus();
  const calls = [];

  bus.subscribe("PlannerCreatedPlan", () => calls.push("first"));
  bus.subscribe("PlannerCreatedPlan", () => calls.push("second"));

  await bus.publish({
    executionId: "execution-2",
    timestamp: "2026-01-01T00:00:00.000Z",
    source: "planner",
    name: "PlannerCreatedPlan",
    payload: {}
  });

  assert.deepEqual(calls, ["first", "second"]);
});

test("unsubscribe removes a handler", async () => {
  const bus = createEventBus();
  let callCount = 0;
  const handler = () => {
    callCount += 1;
  };

  bus.subscribe("SecurityApprovedPlan", handler);
  assert.equal(bus.unsubscribe("SecurityApprovedPlan", handler), true);

  await bus.publish({
    executionId: "execution-3",
    timestamp: "2026-01-01T00:00:00.000Z",
    source: "security",
    name: "SecurityApprovedPlan",
    payload: {}
  });

  assert.equal(callCount, 0);
  assert.equal(bus.subscriberCount("SecurityApprovedPlan"), 0);
});
