"use strict";

const {
  CommunicationProviderStatus,
  CommunicationProviderType
} = require("./providers/provider.types");

/**
 * Stores communication provider contracts without owning their behavior.
 */
function createCommunicationProviderRegistry() {
  const providers = new Map();
  let defaultProvider = null;
  let activeProvider = null;

  function validateProvider(provider) {
    if (!provider || typeof provider !== "object" || !provider.id) {
      throw new Error("Provider must define an id.");
    }

    if (!Object.values(CommunicationProviderType).includes(provider.type)) {
      throw new Error(`Invalid provider type: ${provider.type}`);
    }

    if (provider.status === undefined) {
      provider.status = CommunicationProviderStatus.DISCOVERED;
    }

    if (!Object.values(CommunicationProviderStatus).includes(provider.status)) {
      throw new Error(`Invalid provider status: ${provider.status}`);
    }

    for (const operation of ["initialize", "start", "stop"]) {
      if (typeof provider[operation] !== "function") {
        throw new Error(`Provider must define ${operation}().`);
      }
    }
  }

  return {
    get size() {
      return providers.size;
    },

    register(provider) {
      validateProvider(provider);

      if (providers.has(provider.id)) {
        throw new Error(`Provider already exists: ${provider.id}`);
      }

      providers.set(provider.id, provider);

      if (!defaultProvider) {
        defaultProvider = provider.id;
      }

      return provider;
    },

    get(id) {
      return providers.get(id) ?? null;
    },

    remove(id) {
      const removed = providers.get(id) ?? null;

      providers.delete(id);

      if (defaultProvider === id) {
        const remaining = providers.keys().next();
        defaultProvider = remaining.done ? null : remaining.value;
      }

      if (activeProvider === id) {
        activeProvider = null;
      }

      return removed;
    },

    list() {
      return [...providers.values()];
    },

    getDefaultProvider() {
      return defaultProvider;
    },

    setDefaultProvider(id) {
      if (!providers.has(id)) {
        throw new Error("Unknown provider.");
      }

      defaultProvider = id;
      return defaultProvider;
    },

    getActiveProvider() {
      return activeProvider;
    },

    setActiveProvider(id) {
      if (id === null) {
        activeProvider = null;
        return activeProvider;
      }

      if (!providers.has(id)) {
        throw new Error("Unknown provider.");
      }

      activeProvider = id;
      return activeProvider;
    }
  };
}

module.exports = {
  createCommunicationProviderRegistry
};
