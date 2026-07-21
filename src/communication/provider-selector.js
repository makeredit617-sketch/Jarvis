"use strict";

/**
 * Provider Selector
 *
 * Responsible for deciding which communication provider should
 * be used for a request.
 *
 * The selector does not own provider lifecycle behavior.
 * Lifecycle operations are delegated to the Communication Manager.
 */

function createProviderSelector(options = {}) {
  const {
    providerRegistry,
    communicationManager,
    eventBus,
    emergencyControl
  } = options;

  if (!providerRegistry) {
    throw new Error(
      "Provider Selector requires a Provider Registry."
    );
  }

  let lastProvider = null;

  function resolveProviderById(providerId) {
    const provider = providerRegistry.get(providerId);

    if (!provider) {
      throw new Error(
        `Unknown communication provider: ${providerId}`
      );
    }

    return provider;
  }

  function isUsableProvider(provider) {
    return provider &&
      provider.status !== "FAILED" &&
      provider.status !== "STOPPED";
  }

  return {
    get providerRegistry() {
      return providerRegistry;
    },

    get communicationManager() {
      return communicationManager;
    },

    get eventBus() {
      return eventBus;
    },

    get emergencyControl() {
      return emergencyControl;
    },

    getActiveProvider() {
      return providerRegistry.getActiveProvider();
    },

    getDefaultProvider() {
      return providerRegistry.getDefaultProvider();
    },

    getLastProvider() {
      return lastProvider;
    },

    async select() {
      const activeProviderId = providerRegistry.getActiveProvider();

      if (activeProviderId) {
        const activeProvider = resolveProviderById(activeProviderId);

        if (isUsableProvider(activeProvider)) {
          return activeProvider;
        }
      }

      const defaultProviderId = providerRegistry.getDefaultProvider();

      if (defaultProviderId) {
        const defaultProvider = resolveProviderById(defaultProviderId);

        if (isUsableProvider(defaultProvider)) {
          return defaultProvider;
        }
      }

      const fallbackProvider = providerRegistry
        .list()
        .find(isUsableProvider);

      if (fallbackProvider) {
        return fallbackProvider;
      }

      throw new Error(
        "No communication provider is available."
      );
    },

    async activate(providerId) {
      const provider = resolveProviderById(providerId);

      const currentProviderId =
        providerRegistry.getActiveProvider();

      if (currentProviderId === providerId) {
        return provider;
      }

      if (!communicationManager ||
          typeof communicationManager.startProvider !== "function") {
        throw new Error(
          "Provider Selector requires a Communication Manager."
        );
      }

      lastProvider = currentProviderId;

      await communicationManager.startProvider(providerId);

      return provider;
    },

    async deactivate() {
      const currentProviderId =
        providerRegistry.getActiveProvider();

      if (!currentProviderId) {
        return null;
      }

      const currentProvider = resolveProviderById(
        currentProviderId
      );

      if (!communicationManager ||
          typeof communicationManager.stop !== "function") {
        throw new Error(
          "Provider Selector requires a Communication Manager."
        );
      }

      lastProvider = currentProviderId;

      await communicationManager.stop();

      return currentProvider;
    },

    async fallback() {
      const currentProviderId =
        providerRegistry.getActiveProvider();

      const candidate = providerRegistry
        .list()
        .find(provider =>
          provider.id !== currentProviderId &&
          isUsableProvider(provider)
        );

      if (!candidate) {
        throw new Error(
          "No fallback communication provider is available."
        );
      }

      return this.activate(candidate.id);
    }
  };
}

module.exports = {
  createProviderSelector
};
