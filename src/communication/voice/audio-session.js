"use strict";

/**
 * Audio Session
 *
 * Represents a future runtime-controlled audio session. It is separate from
 * provider implementations and does not perform microphone or speech work.
 */

function createAudioSession(options = {}) {
  const { id, buffer } = options;

  return {
    get id() {
      return id;
    },

    get buffer() {
      return buffer;
    },

    start() {
      // TODO: Start an audio session.
      throw new Error("Not implemented.");
    },

    stop() {
      // TODO: Stop an audio session.
      throw new Error("Not implemented.");
    },

    status() {
      // TODO: Return audio session status.
      throw new Error("Not implemented.");
    }
  };
}

module.exports = {
  createAudioSession
};
