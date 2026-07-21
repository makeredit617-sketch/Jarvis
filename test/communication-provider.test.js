"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createCommunicationProviderInterface
} = require("../src/communication/provider.interface");
const {
  createCommunicationProviderRegistry
} = require("../src/communication/provider-registry");
const {
  CommunicationProviderStatus,
  CommunicationProviderType
} = require("../src/communication/providers/provider.types");
const { createEventBus } = require("../src/events/event-bus");

const TIMESTAMP = "2026-01-01T00:00:00.000Z";

function createProvider(options = {}) {
  return createCommunicationProviderInterface({
    id: "provider-1",
    type: CommunicationProviderType.GENERIC,
    ...options
  });
}

test("registers a valid provider and assigns DISCOVERED when omitted", () => {
  const registry = createCommunicationProviderRegistry();
  const provider = {
    id: "provider-1",
    type: CommunicationProviderType.GENERIC,
    async initialize() {},
    async start() {},
    async stop() {}
  };

  assert.equal(registry.register(provider), provider);
  assert.equal(provider.status, CommunicationProviderStatus.DISCOVERED);
  assert.equal(registry.get("provider-1"), provider);
  assert.deepEqual(registry.list(), [provider]);
  assert.equal(registry.size, 1);
});

test("rejects invalid provider types, statuses, and duplicate IDs", () => {
  const registry = createCommunicationProviderRegistry();

  assert.throws(
    () => registry.register({ id: "invalid-type", type: "UNKNOWN" }),
    /Invalid provider type: UNKNOWN/
  );
  assert.throws(
    () => registry.register({
      id: "invalid-status",
      type: CommunicationProviderType.GENERIC,
      status: "UNKNOWN",
      async initialize() {}, async start() {}, async stop() {}
    }),
    /Invalid provider status: UNKNOWN/
  );

  registry.register(createProvider());
  assert.throws(() => registry.register(createProvider()), /Provider already exists: provider-1/);
});

test("preserves default and active provider selection and rejects unknown providers", () => {
  const registry = createCommunicationProviderRegistry();
  const first = createProvider({ id: "first" });
  const second = createProvider({ id: "second" });
  registry.register(first);
  registry.register(second);

  assert.equal(registry.getDefaultProvider(), "first");
  assert.equal(registry.setDefaultProvider("second"), "second");
  assert.equal(registry.setActiveProvider("first"), "first");
  assert.equal(registry.getActiveProvider(), "first");
  assert.throws(() => registry.setDefaultProvider("missing"), /Unknown provider/);
  assert.throws(() => registry.setActiveProvider("missing"), /Unknown provider/);

  assert.equal(registry.remove("second"), second);
  assert.equal(registry.getDefaultProvider(), "first");
  assert.equal(registry.setActiveProvider(null), null);
});

test("provider follows initialize, start, and stop lifecycle transitions", async () => {
  const provider = createProvider();

  assert.equal(provider.status, CommunicationProviderStatus.DISCOVERED);
  await provider.initialize();
  assert.equal(provider.status, CommunicationProviderStatus.READY);
  await provider.start();
  assert.equal(provider.status, CommunicationProviderStatus.ACTIVE);
  await provider.stop();
  assert.equal(provider.status, CommunicationProviderStatus.STOPPED);
});

test("repeated lifecycle calls are idempotent", async () => {
  let initializeCalls = 0;
  let startCalls = 0;
  let stopCalls = 0;
  const provider = createProvider({
    initializeHandler: async () => { initializeCalls += 1; },
    startHandler: async () => { startCalls += 1; },
    stopHandler: async () => { stopCalls += 1; }
  });

  await Promise.all([provider.initialize(), provider.initialize()]);
  await Promise.all([provider.start(), provider.start()]);
  await Promise.all([provider.stop(), provider.stop()]);

  assert.deepEqual({ initializeCalls, startCalls, stopCalls }, {
    initializeCalls: 1,
    startCalls: 1,
    stopCalls: 1
  });
  assert.equal(provider.status, CommunicationProviderStatus.STOPPED);
});

test("provider lifecycle emits EventBus envelopes with UUIDs and timestamps", async () => {
  const eventBus = createEventBus({ clock: () => new Date(TIMESTAMP) });
  const events = [];
  const names = [
    "communication.provider.initializing",
    "communication.provider.ready",
    "communication.provider.active",
    "communication.provider.stopped",
    "communication.provider.failed"
  ];
  for (const name of names) {
    eventBus.subscribe(name, event => events.push(event));
  }
  const provider = createProvider({ eventBus });

  await provider.start();
  await provider.stop();

  assert.deepEqual(events.map(event => event.name), names.slice(0, 4));
  assert.deepEqual(events.map(event => event.payload), [
    { providerId: "provider-1", previousStatus: "DISCOVERED", currentStatus: "INITIALIZING" },
    { providerId: "provider-1", previousStatus: "INITIALIZING", currentStatus: "READY" },
    { providerId: "provider-1", previousStatus: "READY", currentStatus: "ACTIVE" },
    { providerId: "provider-1", previousStatus: "ACTIVE", currentStatus: "STOPPED" }
  ]);
  for (const event of events) {
    assert.equal(event.source, "communication-provider");
    assert.match(event.executionId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    assert.equal(event.timestamp, TIMESTAMP);
  }
});

test("provider transitions to FAILED and emits an event when initialization fails", async () => {
  const eventBus = createEventBus({ clock: () => new Date(TIMESTAMP) });
  const events = [];
  eventBus.subscribe("communication.provider.failed", event => events.push(event));
  const provider = createProvider({
    eventBus,
    initializeHandler: async () => { throw new Error("initialization failed"); }
  });

  await assert.rejects(provider.initialize(), /initialization failed/);
  assert.equal(provider.status, CommunicationProviderStatus.FAILED);
  assert.deepEqual(events[0].payload, {
    providerId: "provider-1",
    previousStatus: "INITIALIZING",
    currentStatus: "FAILED"
  });
  assert.match(events[0].executionId, /^[0-9a-f-]{36}$/i);
  assert.equal(events[0].timestamp, TIMESTAMP);
});

test("provider transitions to FAILED when startup fails", async () => {
  const provider = createProvider({
    startHandler: async () => { throw new Error("startup failed"); }
  });

  await provider.initialize();
  await assert.rejects(provider.start(), /startup failed/);
  assert.equal(provider.status, CommunicationProviderStatus.FAILED);
});
