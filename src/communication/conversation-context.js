"use strict";

/**
 * Conversation Context
 *
 * Represents communication-scoped context that future capabilities can attach
 * to an execution flow. This is intentionally separate from the runtime
 * Execution Context and should not replace it.
 */

function createConversationContext(options = {}) {
  const { id, metadata } = options;

  return {
    get id() {
      return id;
    },

    get metadata() {
      return metadata;
    },

    setState() {
      // TODO: Store conversation-scoped state.
      throw new Error("Not implemented.");
    },

    getState() {
      // TODO: Read conversation-scoped state.
      throw new Error("Not implemented.");
    },

    createEventPayload() {
      // TODO: Build an event payload for communication events.
      throw new Error("Not implemented.");
    }
  };
}

module.exports = {
  createConversationContext
};
