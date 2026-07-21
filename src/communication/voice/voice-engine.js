"use strict";

/**
 * Voice Engine
 *
 * Coordinates future voice infrastructure without owning provider-specific
 * speech recognition, wake-word detection, microphone processing, or AI
 * conversation behavior.
 */

function createVoiceEngine(options = {}) {
  const { microphoneManager, providerRegistry } = options;

  return {
    get microphoneManager() {
      return microphoneManager;
    },

    get providerRegistry() {
      return providerRegistry;
    },

    start() {
      // TODO: Start voice infrastructure.
      throw new Error("Not implemented.");
    },

    stop() {
      // TODO: Stop voice infrastructure.
      throw new Error("Not implemented.");
    },

    createSession() {
      // TODO: Create a voice session.
      throw new Error("Not implemented.");
    }
  };
}

module.exports = {
  createVoiceEngine
};
