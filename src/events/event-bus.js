"use strict";

/**
 * Creates an in-process publish/subscribe bus for runtime coordination.
 *
 * The bus intentionally does not know about agents, tools, or storage. It only
 * validates the common event envelope and delivers events to subscribers.
 */
function createEventBus(options = {}) {
  const subscribers = new Map();
  const clock = options.clock || (() => new Date());

  return {
    /**
     * Subscribes a handler to a named event.
     *
     * @param {string} eventName Stable event name.
     * @param {Function} handler Async or sync event handler.
     * @returns {Function} Unsubscribe callback.
     */
    subscribe(eventName, handler) {
      validateEventName(eventName);

      if (typeof handler !== "function") {
        throw new TypeError("Event handler must be a function.");
      }

      if (!subscribers.has(eventName)) {
        subscribers.set(eventName, new Set());
      }

      subscribers.get(eventName).add(handler);

      return () => this.unsubscribe(eventName, handler);
    },

    /**
     * Removes a handler from a named event.
     *
     * @param {string} eventName Stable event name.
     * @param {Function} handler Previously subscribed handler.
     * @returns {boolean} True when a handler was removed.
     */
    unsubscribe(eventName, handler) {
      validateEventName(eventName);

      const handlers = subscribers.get(eventName);
      if (!handlers) {
        return false;
      }

      const removed = handlers.delete(handler);
      if (handlers.size === 0) {
        subscribers.delete(eventName);
      }

      return removed;
    },

    /**
     * Publishes an event to all current subscribers.
     *
     * Every runtime event must include executionId, timestamp, source, and name.
     * If timestamp is omitted, the bus stamps the event at publish time.
     *
     * @param {object} event Event envelope.
     * @returns {object} The delivered event envelope.
     */
    async publish(event) {
      const runtimeEvent = normalizeEvent(event, clock);
      const handlers = Array.from(subscribers.get(runtimeEvent.name) || []);

      for (const handler of handlers) {
        await handler(runtimeEvent);
      }

      return runtimeEvent;
    },

    /**
     * Returns subscriber count for diagnostics and tests.
     */
    subscriberCount(eventName) {
      validateEventName(eventName);
      return (subscribers.get(eventName) || new Set()).size;
    }
  };
}

function normalizeEvent(event, clock) {
  if (!event || typeof event !== "object") {
    throw new TypeError("Event must be an object.");
  }

  validateEventName(event.name);

  if (!event.executionId) {
    throw new Error("Event must include executionId.");
  }

  if (!event.source) {
    throw new Error("Event must include source.");
  }

  return {
    ...event,
    timestamp: event.timestamp || clock().toISOString()
  };
}

function validateEventName(eventName) {
  if (!eventName || typeof eventName !== "string") {
    throw new TypeError("Event name must be a non-empty string.");
  }
}

module.exports = {
  createEventBus
};
