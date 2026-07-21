"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createCommunicationSessionManager
} = require("../src/communication/session-manager");
const { SessionState } = require("../src/communication/communication.types");
const { createEventBus } = require("../src/events/event-bus");

const SESSION_CREATED = "session.created";
const SESSION_STARTED = "session.started";
const SESSION_ENDED = "session.ended";
const SESSION_MANAGER_SOURCE = "communication-session-manager";
const TIMESTAMP = "2026-01-01T00:00:00.000Z";

function createManager() {
  const eventBus = createEventBus({
    clock: () => new Date(TIMESTAMP)
  });
  const manager = createCommunicationSessionManager({ eventBus });
  const events = [];

  for (const name of [SESSION_CREATED, SESSION_STARTED, SESSION_ENDED]) {
    eventBus.subscribe(name, event => events.push(event));
  }

  return { manager, events };
}

test("creates sessions with a CREATED state and emits session.created", async () => {
  const { manager, events } = createManager();
  const session = { id: "session-1" };

  const created = await manager.createSession(session);

  assert.equal(created, session);
  assert.equal(created.state, SessionState.CREATED);
  assert.equal(manager.getSession("session-1"), session);
  assert.equal(manager.size, 1);
  assert.deepEqual(events[0].payload, {
    sessionId: "session-1",
    previousState: null,
    currentState: SessionState.CREATED
  });
});

test("preserves a caller-supplied stable session state", async () => {
  const { manager } = createManager();

  const session = await manager.createSession({
    id: "session-1",
    state: SessionState.ACTIVE
  });

  assert.equal(session.state, SessionState.ACTIVE);
});

test("rejects invalid and duplicate sessions", async () => {
  const { manager } = createManager();

  await assert.rejects(manager.createSession(), /Session must define an id/);
  await assert.rejects(
    manager.createSession({ id: "invalid-state", state: "UNKNOWN" }),
    /Invalid session state: UNKNOWN/
  );
  await manager.createSession({ id: "session-1" });
  await assert.rejects(
    manager.createSession({ id: "session-1" }),
    /Session already exists: session-1/
  );
});

test("starts a CREATED session and emits its state transition", async () => {
  const { manager, events } = createManager();
  await manager.createSession({ id: "session-1" });

  const started = await manager.startSession("session-1");

  assert.equal(started.state, SessionState.ACTIVE);
  assert.deepEqual(events[1].payload, {
    sessionId: "session-1",
    previousState: SessionState.CREATED,
    currentState: SessionState.ACTIVE
  });
});

test("ends a session after publishing its ENDED transition", async () => {
  const { manager, events } = createManager();
  await manager.createSession({ id: "session-1" });
  await manager.startSession("session-1");

  const ended = await manager.endSession("session-1");

  assert.equal(ended.state, SessionState.ENDED);
  assert.equal(manager.getSession("session-1"), null);
  assert.equal(manager.size, 0);
  assert.deepEqual(events[2].payload, {
    sessionId: "session-1",
    previousState: SessionState.ACTIVE,
    currentState: SessionState.ENDED
  });
});

test("lifecycle events use the EventBus timestamp and valid envelopes", async () => {
  const { manager, events } = createManager();
  await manager.createSession({ id: "session-1" });
  await manager.startSession("session-1");
  await manager.endSession("session-1");

  assert.deepEqual(events.map(event => event.name), [
    SESSION_CREATED,
    SESSION_STARTED,
    SESSION_ENDED
  ]);

  for (const event of events) {
    assert.equal(event.source, SESSION_MANAGER_SOURCE);
    assert.match(event.executionId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    assert.equal(event.timestamp, TIMESTAMP);
  }
});

test("returns null for unknown sessions", async () => {
  const { manager } = createManager();

  assert.equal(manager.getSession("missing"), null);
  assert.equal(await manager.startSession("missing"), null);
  assert.equal(await manager.endSession("missing"), null);
});

test("requires an Event Bus with publish", () => {
  assert.throws(
    () => createCommunicationSessionManager(),
    /requires an Event Bus/
  );
});
