"use strict";

const { randomUUID } = require("crypto");

/**
 * Creates request-scoped runtime state.
 *
 * An execution context is the only mutable object shared across event handlers.
 * It carries the execution ID, request metadata, and named results produced by
 * independent modules during a single request lifecycle.
 */
function createExecutionContext(options = {}) {
  const executionId = options.executionId || randomUUID();
  const source = options.source || "unknown";
  const request = options.request;
  const results = new Map();

  return {
    executionId,
    source,
    request,
    createdAt: (options.clock || (() => new Date()))().toISOString(),

    /**
     * Stores a named result for the current execution.
     */
    setResult(name, value) {
      results.set(name, value);
      return value;
    },

    /**
     * Reads a named result created earlier in the event pipeline.
     */
    getResult(name) {
      return results.get(name);
    },

    /**
     * Creates a compliant event envelope for this execution.
     */
    createEvent(name, sourceName, payload = {}) {
      return {
        executionId,
        timestamp: (options.clock || (() => new Date()))().toISOString(),
        source: sourceName,
        name,
        payload,
        context: this
      };
    },

    /**
     * Exposes result state without leaking the internal Map.
     */
    toJSON() {
      return {
        executionId,
        source,
        request,
        createdAt: this.createdAt,
        results: Object.fromEntries(results)
      };
    }
  };
}

module.exports = {
  createExecutionContext
};
