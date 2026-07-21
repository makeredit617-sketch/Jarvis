"use strict";

/**
 * Communication Type Constants
 *
 * Stable contracts shared across the communication subsystem.
 *
 * This file defines communication-layer lifecycle states only.
 * It intentionally contains no runtime logic, provider logic,
 * voice logic, or AI implementation.
 */

const CommunicationState = Object.freeze({
  STOPPED: "STOPPED",
  STARTING: "STARTING",
  READY: "READY",
  IDLE: "IDLE",
  LISTENING: "LISTENING",
  PROCESSING: "PROCESSING",
  RESPONDING: "RESPONDING",
  HANDOFF: "HANDOFF",
  STOPPING: "STOPPING",
  ERROR: "ERROR"
});

const SessionState = Object.freeze({
  CREATED: "CREATED",
  ACTIVE: "ACTIVE",
  ENDED: "ENDED"
});

module.exports = {
  CommunicationState,
  SessionState
};
