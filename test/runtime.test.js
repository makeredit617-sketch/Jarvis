"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createEventBus } = require("../src/events/event-bus");
const { createRuntime } = require("../src/runtime/runtime");
const { createServiceRegistry } = require("../src/runtime/service-registry");

test("runtime initialization registers services and module subscriptions", async () => {
  const eventBus = createEventBus();
  const serviceRegistry = createServiceRegistry();
  let registered = false;

  const module = {
    name: "testModule",
    register({ eventBus: registeredBus, serviceRegistry: registeredRegistry }) {
      registered = true;
      assert.equal(registeredBus, eventBus);
      assert.equal(registeredRegistry, serviceRegistry);

      return [
        registeredBus.subscribe("RuntimeRequestReceived", event => {
          event.context.setResult("handledByTestModule", true);
        })
      ];
    }
  };

  const runtime = createRuntime({
    architectureDocs: [],
    auditLog: { record() {} },
    eventBus,
    memoryStore: { append(record) { return record; } },
    modules: [module],
    orchestrator: {
      async handleRequest(context, input) {
        await eventBus.publish(context.createEvent("RuntimeRequestReceived", "orchestrator", {
          input
        }));

        return {
          executionId: context.executionId,
          handled: context.getResult("handledByTestModule")
        };
      }
    },
    serviceRegistry,
    toolRegistry: {}
  });

  await runtime.start();

  assert.equal(runtime.isStarted, true);
  assert.equal(registered, true);
  assert.deepEqual(runtime.services.list(), [
    "architectureDocs",
    "auditLog",
    "eventBus",
    "memoryStore",
    "runtime",
    "testModule",
    "toolRegistry"
  ]);

  const result = await runtime.handleRequest({
    request: "runtime check",
    source: "test"
  });

  assert.equal(result.handled, true);
  assert.match(result.executionId, /^[0-9a-f-]{36}$/);

  await runtime.shutdown();

  assert.equal(runtime.isStarted, false);
  assert.deepEqual(runtime.services.list(), []);
  assert.equal(eventBus.subscriberCount("RuntimeRequestReceived"), 0);
});
