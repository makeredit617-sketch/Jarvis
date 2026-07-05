"use strict";

/**
 * Holds runtime services by name.
 *
 * Services register once during startup and are then discovered by modules
 * through this registry instead of importing each other directly.
 */
function createServiceRegistry() {
  const services = new Map();

  return {
    register(name, service) {
      validateServiceName(name);

      if (!service) {
        throw new Error(`Service "${name}" must be provided.`);
      }

      if (services.has(name)) {
        throw new Error(`Service "${name}" is already registered.`);
      }

      services.set(name, service);
      return service;
    },

    get(name) {
      validateServiceName(name);

      if (!services.has(name)) {
        throw new Error(`Service "${name}" is not registered.`);
      }

      return services.get(name);
    },

    has(name) {
      validateServiceName(name);
      return services.has(name);
    },

    list() {
      return Array.from(services.keys()).sort();
    },

    clear() {
      services.clear();
    }
  };
}

function validateServiceName(name) {
  if (!name || typeof name !== "string") {
    throw new TypeError("Service name must be a non-empty string.");
  }
}

module.exports = {
  createServiceRegistry
};
