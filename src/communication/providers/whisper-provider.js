"use strict";

/**
 * Whisper Provider
 *
 * Placeholder for a future Whisper-compatible communication provider.
 * This file intentionally contains no Whisper integration or speech
 * recognition behavior.
 */

function createWhisperProvider(options = {}) {
  const { id } = options;

  return {
    get id() {
      return id;
    },

    initialize() {
      // TODO: Initialize Whisper-compatible provider resources.
      throw new Error("Not implemented.");
    },

    start() {
      // TODO: Start Whisper-compatible provider flow.
      throw new Error("Not implemented.");
    },

    stop() {
      // TODO: Stop Whisper-compatible provider flow.
      throw new Error("Not implemented.");
    },

    transcribe() {
      // TODO: Transcribe audio through a Whisper-compatible provider.
      throw new Error("Not implemented.");
    }
  };
}

module.exports = {
  createWhisperProvider
};
