"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createCommunicationManager } = require("../src/communication/communication-manager");
const { CommunicationState } = require("../src/communication/communication.types");
const { createEventBus } = require("../src/events/event-bus");
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

const COMMUNICATION_STATE_CHANGED = "communication.state.changed";

test("communication manager emits lifecycle events for start and stop", async () => {
  const eventBus = createEventBus({
    clock: () => new Date("2026-01-01T00:00:00.000Z")
  });
  const received = [];
  const manager = createCommunicationManager({ eventBus });

  eventBus.subscribe(COMMUNICATION_STATE_CHANGED, event => received.push(event));

  await manager.start();
  assert.equal(manager.getState(), CommunicationState.READY);

  await manager.stop();
  assert.equal(manager.getState(), CommunicationState.STOPPED);

  assert.deepEqual(
    received.map(event => event.payload),
    [
      {
        previousState: CommunicationState.STOPPED,
        currentState: CommunicationState.STARTING
      },
      {
        previousState: CommunicationState.STARTING,
        currentState: CommunicationState.READY
      },
      {
        previousState: CommunicationState.READY,
        currentState: CommunicationState.STOPPING
      },
      {
        previousState: CommunicationState.STOPPING,
        currentState: CommunicationState.STOPPED
      }
    ]
  );

  for (const event of received) {
    assert.equal(event.name, COMMUNICATION_STATE_CHANGED);
    assert.equal(event.source, "communication-manager");
    assert.match(event.executionId, /^[0-9a-f-]{36}$/);
    assert.equal(event.timestamp, "2026-01-01T00:00:00.000Z");
  }
});

test("communication manager start and stop are idempotent", async () => {
  const eventBus = createEventBus();
  const received = [];
  const manager = createCommunicationManager({ eventBus });

  eventBus.subscribe(COMMUNICATION_STATE_CHANGED, event => received.push(event));

  await Promise.all([manager.start(), manager.start()]);
  await Promise.all([manager.stop(), manager.stop()]);

  assert.equal(manager.getState(), CommunicationState.STOPPED);
  assert.equal(received.length, 4);
});

test("communication manager requires an Event Bus", () => {
  assert.throws(
    () => createCommunicationManager(),
    /requires an Event Bus/
  );
});

function createProvider(options = {}) {
  return createCommunicationProviderInterface({
    id: "provider-1",
    type: CommunicationProviderType.GENERIC,
    ...options
  });
}

test("communication manager starts the default provider", async () => {
  const eventBus = createEventBus();
  const providerRegistry = createCommunicationProviderRegistry();
  const provider = createProvider();
  providerRegistry.register(provider);
  const manager = createCommunicationManager({ eventBus, providerRegistry });

  await manager.start();

  assert.equal(manager.getState(), CommunicationState.READY);
  assert.equal(provider.status, CommunicationProviderStatus.ACTIVE);
  assert.equal(providerRegistry.getActiveProvider(), provider.id);
});

test("communication manager starts a specific provider by ID and marks it active", async () => {
  const eventBus = createEventBus();
  const providerRegistry = createCommunicationProviderRegistry();
  const defaultProvider = createProvider({ id: "default" });
  const selectedProvider = createProvider({ id: "selected" });
  providerRegistry.register(defaultProvider);
  providerRegistry.register(selectedProvider);
  const manager = createCommunicationManager({ eventBus, providerRegistry });

  assert.equal(await manager.startProvider("selected"), selectedProvider);
  assert.equal(selectedProvider.status, CommunicationProviderStatus.ACTIVE);
  assert.equal(providerRegistry.getActiveProvider(), "selected");
  assert.equal(defaultProvider.status, CommunicationProviderStatus.DISCOVERED);
});

test("failed provider startup does not become active and leaves the manager consistent", async () => {
  const eventBus = createEventBus();
  const providerRegistry = createCommunicationProviderRegistry();
  const provider = createProvider({
    startHandler: async () => { throw new Error("startup failed"); }
  });
  providerRegistry.register(provider);
  const manager = createCommunicationManager({ eventBus, providerRegistry });

  await assert.rejects(manager.start(), /startup failed/);

  assert.equal(provider.status, CommunicationProviderStatus.FAILED);
  assert.equal(providerRegistry.getActiveProvider(), null);
  assert.equal(manager.getState(), CommunicationState.ERROR);
});

test("communication manager rejects unknown providers without changing selection", async () => {
  const eventBus = createEventBus();
  const providerRegistry = createCommunicationProviderRegistry();
  const manager = createCommunicationManager({ eventBus, providerRegistry });

  await assert.rejects(
    manager.startProvider("missing"),
    /Unknown communication provider: missing/
  );
  assert.equal(providerRegistry.getActiveProvider(), null);
  assert.equal(manager.getState(), CommunicationState.STOPPED);
});

test("communication manager shutdown stops and clears its active provider", async () => {
  const eventBus = createEventBus();
  const providerRegistry = createCommunicationProviderRegistry();
  const provider = createProvider();
  providerRegistry.register(provider);
  const manager = createCommunicationManager({ eventBus, providerRegistry });

  await manager.start();
  await manager.stop();

  assert.equal(provider.status, CommunicationProviderStatus.STOPPED);
  assert.equal(providerRegistry.getActiveProvider(), null);
  assert.equal(manager.getState(), CommunicationState.STOPPED);
});

test("manager provider orchestration is idempotent across repeated start and stop", async () => {
  const eventBus = createEventBus();
  const providerRegistry = createCommunicationProviderRegistry();
  let startCalls = 0;
  let stopCalls = 0;
  const provider = createProvider({
    startHandler: async () => { startCalls += 1; },
    stopHandler: async () => { stopCalls += 1; }
  });
  providerRegistry.register(provider);
  const manager = createCommunicationManager({ eventBus, providerRegistry });

  await Promise.all([manager.start(), manager.start()]);
  await Promise.all([manager.stop(), manager.stop()]);

  assert.deepEqual({ startCalls, stopCalls }, { startCalls: 1, stopCalls: 1 });
  assert.equal(providerRegistry.getActiveProvider(), null);
  assert.equal(manager.getState(), CommunicationState.STOPPED);
});
