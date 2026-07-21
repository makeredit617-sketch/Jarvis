"use strict";

/**
 * Native Speech Provider
 *
 * Placeholder for future platform-native speech infrastructure. This file
 * contains no operating system integration or speech implementation.
 */

function createNativeSpeechProvider(options = {}) {
  const { id } = options;

  return {
    get id() {
      return id;
    },

    initialize() {
      // TODO: Initialize native provider resources.
      throw new Error("Not implemented.");
    },

    start() {
      // TODO: Start native provider flow.
      throw new Error("Not implemented.");
    },

    stop() {
      // TODO: Stop native provider flow.
      throw new Error("Not implemented.");
    },

    recognize() {
      // TODO: Recognize speech through native provider APIs.
      throw new Error("Not implemented.");
    }
  };
}

module.exports = {
  createNativeSpeechProvider
};
