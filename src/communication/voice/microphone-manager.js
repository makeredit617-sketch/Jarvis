"use strict";

/**
 * Microphone Manager
 *
 * Placeholder boundary for future microphone device management. This skeleton
 * does not enumerate devices, request permissions, open streams, or process
 * audio.
 */

function createMicrophoneManager(options = {}) {
  const { eventBus } = options;

  return {
    get eventBus() {
      return eventBus;
    },

    listDevices() {
      // TODO: List available microphone devices.
      throw new Error("Not implemented.");
    },

    selectDevice() {
      // TODO: Select a microphone device.
      throw new Error("Not implemented.");
    },

    open() {
      // TODO: Open a microphone stream.
      throw new Error("Not implemented.");
    },

    close() {
      // TODO: Close a microphone stream.
      throw new Error("Not implemented.");
    }
  };
}

module.exports = {
  createMicrophoneManager
};
