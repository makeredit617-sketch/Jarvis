"use strict";

const { randomUUID } = require("crypto");
const { SessionState } = require("./communication.types");

const SESSION_CREATED = "session.created";
const SESSION_STARTED = "session.started";
const SESSION_ENDED = "session.ended";
const SESSION_MANAGER_SOURCE = "communication-session-manager";

/**
 * Communication Session Manager
 *
 * Owns the future lifecycle boundary for communication sessions. Session
 * operations should integrate with runtime services when Phase 5 behavior is
 * implemented, but this skeleton does not create or track sessions.
 */

function createCommunicationSessionManager(options = {}) {
  const { eventBus } = options;

  if (!eventBus || typeof eventBus.publish !== "function") {
    throw new TypeError("Communication Session Manager requires an Event Bus.");
  }

  const sessions = new Map();

  async function publishLifecycleEvent(name, sessionId, previousState, currentState) {
    await eventBus.publish({
      name,
      executionId: randomUUID(),
      source: SESSION_MANAGER_SOURCE,
      payload: {
        sessionId,
        previousState,
        currentState
      }
    });
  }

  return {
    get size() {
      return sessions.size;
    },

    get eventBus() {
      return eventBus;
    },

    async createSession(session) {
      if (!session || typeof session !== "object" || !session.id) {
        throw new Error(
          "Session must define an id."
        );
      }

      if (sessions.has(session.id)) {
        throw new Error(
          `Session already exists: ${session.id}`
        );
      }

      if (session.state === undefined) {
        session.state = SessionState.CREATED;
      } else if (!Object.values(SessionState).includes(session.state)) {
        throw new Error(`Invalid session state: ${session.state}`);
      }

      sessions.set(session.id, session);

      await publishLifecycleEvent(
        SESSION_CREATED,
        session.id,
        null,
        session.state
      );

      return session;
    },

    getSession(sessionId) {
      return sessions.get(sessionId) ?? null;
    },

    async startSession(sessionId) {
      const session = sessions.get(sessionId) ?? null;

      if (!session) {
        return null;
      }

      if (session.state !== SessionState.CREATED) {
        throw new Error(
          `Session cannot be started from state: ${session.state}`
        );
      }

      const previousState = session.state;
      session.state = SessionState.ACTIVE;

      await publishLifecycleEvent(
        SESSION_STARTED,
        session.id,
        previousState,
        session.state
      );

      return session;
    },

    async endSession(sessionId) {
      const session = sessions.get(sessionId) ?? null;

      if (!session) {
        return null;
      }

      const previousState = session.state;
      session.state = SessionState.ENDED;

      await publishLifecycleEvent(
        SESSION_ENDED,
        session.id,
        previousState,
        session.state
      );

      sessions.delete(sessionId);

      return session;
    },

    listSessions() {
      return [...sessions.values()];
    }
  };
}

module.exports = {
  createCommunicationSessionManager
};
