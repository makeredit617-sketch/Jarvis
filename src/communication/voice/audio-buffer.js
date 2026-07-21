"use strict";

/**
 * Audio Buffer
 *
 * Placeholder abstraction for future audio buffering. This module does not
 * store, transform, encode, decode, or inspect audio data.
 */

function createAudioBuffer(options = {}) {
  const { format } = options;

  return {
    get format() {
      return format;
    },

    append() {
      // TODO: Append audio data.
      throw new Error("Not implemented.");
    },

    read() {
      // TODO: Read buffered audio data.
      throw new Error("Not implemented.");
    },

    clear() {
      // TODO: Clear buffered audio data.
      throw new Error("Not implemented.");
    }
  };
}

module.exports = {
  createAudioBuffer
};
