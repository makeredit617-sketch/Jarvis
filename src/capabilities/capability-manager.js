"use strict";

/**
 * Capability Manager
 *
 * Responsible for the lifecycle of runtime capabilities.
 *
 * Current Phase:
 * - Skeleton only.
 * - No installation logic.
 * - No GitHub integration.
 * - No package management.
 */

function createCapabilityManager({ registry }) {
  if (!registry) {
    throw new Error("Capability Manager requires a registry.");
  }

  return {
    list() {
      throw new Error("Not implemented.");
    },

    install() {
      throw new Error("Not implemented.");
    },

    uninstall() {
      throw new Error("Not implemented.");
    },

    update() {
      throw new Error("Not implemented.");
    }
  };
}

module.exports = {
  createCapabilityManager
};
