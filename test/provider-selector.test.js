"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createProviderSelector
} = require("../src/communication/provider-selector");

const {
  createCommunicationProviderInterface
} = require("../src/communication/provider.interface");

const {
  createCommunicationProviderRegistry
} = require("../src/communication/provider-registry");

const {
  CommunicationProviderStatus,
  CommunicationProviderType
} = require("../src/communication/providers/provider.types");

function createProvider(options = {}) {
  return createCommunicationProviderInterface({
    id: "provider-1",
    type: CommunicationProviderType.GENERIC,
    ...options
  });
}

function createManagerMock(providerRegistry) {
  return {
    async startProvider(providerId) {
      const provider = providerRegistry.get(providerId);

      if (!provider) {
        throw new Error(`Unknown communication provider: ${providerId}`);
      }

      await provider.start();
      providerRegistry.setActiveProvider(providerId);

      return provider;
    },

    async stop() {
      const activeProviderId = providerRegistry.getActiveProvider();

      if (!activeProviderId) {
        return null;
      }

      const provider = providerRegistry.get(activeProviderId);

      if (provider) {
        await provider.stop();
      }

      providerRegistry.setActiveProvider(null);

      return provider;
    }
  };
}

test("select returns the active provider", async () => {
  const registry = createCommunicationProviderRegistry();

  const provider = createProvider({
    id: "active"
  });

  registry.register(provider);
  registry.setActiveProvider("active");

  const selector = createProviderSelector({
    providerRegistry: registry
  });

  assert.equal(await selector.select(), provider);
});

test("select falls back to the default provider", async () => {
  const registry = createCommunicationProviderRegistry();

  const provider = createProvider({
    id: "default"
  });

  registry.register(provider);

  const selector = createProviderSelector({
    providerRegistry: registry
  });

  assert.equal(await selector.select(), provider);
});

test("select throws when no provider is available", async () => {
  const registry = createCommunicationProviderRegistry();

  const selector = createProviderSelector({
    providerRegistry: registry
  });

  await assert.rejects(
    selector.select(),
    /No communication provider is available/
  );
});

test("activate starts a provider through the communication manager", async () => {
  const registry = createCommunicationProviderRegistry();

  const provider = createProvider({
    id: "provider-1"
  });

  registry.register(provider);

  let managerStartCalls = 0;

  const manager = {
    async startProvider(providerId) {
      managerStartCalls += 1;
      assert.equal(providerId, "provider-1");

      await provider.start();
      registry.setActiveProvider(providerId);

      return provider;
    }
  };

  const selector = createProviderSelector({
    providerRegistry: registry,
    communicationManager: manager
  });

  const result = await selector.activate("provider-1");

  assert.equal(result, provider);
  assert.equal(managerStartCalls, 1);
  assert.equal(registry.getActiveProvider(), "provider-1");
  assert.equal(provider.status, CommunicationProviderStatus.ACTIVE);
});

test("activate does not directly call provider.start", async () => {
  const registry = createCommunicationProviderRegistry();

  const provider = createProvider({
    id: "provider-1",
    startHandler: async () => {
      throw new Error("provider.start should not be called directly");
    }
  });

  registry.register(provider);

  const manager = {
    async startProvider() {
      registry.setActiveProvider("provider-1");
      return provider;
    }
  };

  const selector = createProviderSelector({
    providerRegistry: registry,
    communicationManager: manager
  });

  await selector.activate("provider-1");

  assert.equal(registry.getActiveProvider(), "provider-1");
});

test("failed provider startup is not marked active", async () => {
  const registry = createCommunicationProviderRegistry();

  const provider = createProvider({
    id: "provider-1",
    startHandler: async () => {
      throw new Error("startup failed");
    }
  });

  registry.register(provider);

  const manager = {
    async startProvider(providerId) {
      const selected = registry.get(providerId);
      await selected.start();
      registry.setActiveProvider(providerId);
      return selected;
    }
  };

  const selector = createProviderSelector({
    providerRegistry: registry,
    communicationManager: manager
  });

  await assert.rejects(
    selector.activate("provider-1"),
    /startup failed/
  );

  assert.equal(registry.getActiveProvider(), null);
  assert.equal(provider.status, CommunicationProviderStatus.FAILED);
});

test("deactivate stops the active provider through the communication manager", async () => {
  const registry = createCommunicationProviderRegistry();

  const provider = createProvider({
    id: "provider-1"
  });

  registry.register(provider);
  await provider.start();
  registry.setActiveProvider("provider-1");

  let managerStopCalls = 0;

  const manager = {
    async stop() {
      managerStopCalls += 1;
      await provider.stop();
      registry.setActiveProvider(null);
      return provider;
    }
  };

  const selector = createProviderSelector({
    providerRegistry: registry,
    communicationManager: manager
  });

  const result = await selector.deactivate();

  assert.equal(result, provider);
  assert.equal(managerStopCalls, 1);
  assert.equal(registry.getActiveProvider(), null);
});

test("deactivate returns null when no provider is active", async () => {
  const registry = createCommunicationProviderRegistry();

  const selector = createProviderSelector({
    providerRegistry: registry
  });

  assert.equal(await selector.deactivate(), null);
});

test("fallback selects another usable provider", async () => {
  const registry = createCommunicationProviderRegistry();

  const activeProvider = createProvider({
    id: "active"
  });

  const fallbackProvider = createProvider({
    id: "fallback"
  });

  registry.register(activeProvider);
  registry.register(fallbackProvider);
  registry.setActiveProvider("active");

  let activatedProvider = null;

  const manager = {
    async startProvider(providerId) {
      activatedProvider = providerId;
      registry.setActiveProvider(providerId);
      return registry.get(providerId);
    }
  };

  const selector = createProviderSelector({
    providerRegistry: registry,
    communicationManager: manager
  });

  const result = await selector.fallback();

  assert.equal(result, fallbackProvider);
  assert.equal(activatedProvider, "fallback");
});

test("fallback rejects when no usable provider exists", async () => {
  const registry = createCommunicationProviderRegistry();

  const provider = createProvider({
    id: "provider-1"
  });

  registry.register(provider);
  registry.setActiveProvider("provider-1");

  const selector = createProviderSelector({
    providerRegistry: registry
  });

  await assert.rejects(
    selector.fallback(),
    /No fallback communication provider is available/
  );
});

test("lastProvider tracks previous active provider", async () => {
  const registry = createCommunicationProviderRegistry();

  const first = createProvider({
    id: "first"
  });

  const second = createProvider({
    id: "second"
  });

  registry.register(first);
  registry.register(second);

  const manager = {
    async startProvider(providerId) {
      registry.setActiveProvider(providerId);
      return registry.get(providerId);
    }
  };

  const selector = createProviderSelector({
    providerRegistry: registry,
    communicationManager: manager
  });

  await selector.activate("first");
  await selector.activate("second");

  assert.equal(selector.getLastProvider(), "first");
});

test("failed and stopped providers are not selected when a usable provider exists", async () => {
  const registry = createCommunicationProviderRegistry();

  const failedProvider = createProvider({
    id: "failed",
    status: CommunicationProviderStatus.FAILED
  });

  const usableProvider = createProvider({
    id: "usable"
  });

  registry.register(failedProvider);
  registry.register(usableProvider);
  registry.setDefaultProvider("failed");

  const selector = createProviderSelector({
    providerRegistry: registry
  });

  assert.equal(await selector.select(), usableProvider);
});
