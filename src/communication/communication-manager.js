"use strict";

const { randomUUID } = require("crypto");
const { CommunicationState } = require("./communication.types");

const COMMUNICATION_STATE_CHANGED = "communication.state.changed";
const COMMUNICATION_MANAGER_SOURCE = "communication-manager";

/**
 * Communication Manager
 *
 * Core infrastructure boundary for JARVIS communication workflows.
 *
 * Future implementations should coordinate sessions, providers, and voice
 * services through runtime-owned services such as the Event Bus, Service
 * Registry, and Emergency Control Service. It intentionally avoids runtime
 * registration and communication-provider behavior.
 */

function createCommunicationManager(options = {}) {
  const { eventBus, providerRegistry, sessionManager } = options;

  if (!eventBus || typeof eventBus.publish !== "function") {
    throw new TypeError("Communication Manager requires an Event Bus.");
  }

  let state = CommunicationState.STOPPED;
  let lifecycleOperation = Promise.resolve();

  async function transitionTo(nextState) {
    const previousState = state;

    if (previousState === nextState) {
      return;
    }

    state = nextState;

    await eventBus.publish({
      name: COMMUNICATION_STATE_CHANGED,
      executionId: randomUUID(),
      source: COMMUNICATION_MANAGER_SOURCE,
      payload: {
        previousState,
        currentState: nextState
      }
    });
  }

  function enqueueLifecycle(operation) {
    const queuedOperation = lifecycleOperation.then(operation, operation);

    lifecycleOperation = queuedOperation.catch(() => {});
    return queuedOperation;
  }

  async function startProvider(providerId) {
    if (!providerRegistry) {
      throw new Error("Communication Manager requires a Provider Registry.");
    }

    const provider = providerRegistry.get(providerId);

    if (!provider) {
      throw new Error(`Unknown communication provider: ${providerId}`);
    }

    await provider.start();
    providerRegistry.setActiveProvider(provider.id);

    return provider;
  }

  const manager = {
    get eventBus() {
      return eventBus;
    },

    get providerRegistry() {
      return providerRegistry;
    },

    get sessionManager() {
      return sessionManager;
    },

    getState() {
      return state;
    },

    isState(expectedState) {
      return state === expectedState;
    },


    async start() {
      return enqueueLifecycle(async () => {
        if (state === CommunicationState.READY) {
          return manager;
        }

        await transitionTo(CommunicationState.STARTING);

        try {
          if (providerRegistry) {
            const providerId = providerRegistry.getActiveProvider() ||
              providerRegistry.getDefaultProvider();

            if (providerId) {
              await startProvider(providerId);
            }
          }

          await transitionTo(CommunicationState.READY);
        } catch (error) {
          await transitionTo(CommunicationState.ERROR);
          throw error;
        }

        return manager;
      });
    },

    async startProvider(providerId) {
      return enqueueLifecycle(() => startProvider(providerId));
    },

    async stop() {
      return enqueueLifecycle(async () => {
        const activeProviderId = providerRegistry &&
          providerRegistry.getActiveProvider();
        let providerError = null;

        if (state !== CommunicationState.STOPPED) {
          await transitionTo(CommunicationState.STOPPING);
        }

        if (activeProviderId) {
          const provider = providerRegistry.get(activeProviderId);

          try {
            if (provider) {
              await provider.stop();
            }
          } catch (error) {
            providerError = error;
          } finally {
            providerRegistry.setActiveProvider(null);
          }
        }

        if (state !== CommunicationState.STOPPED) {
          await transitionTo(CommunicationState.STOPPED);
        }

        if (providerError) {
          throw providerError;
        }

        return manager;
      });
    },

    async handleInput() {
      // TODO: Normalize inbound communication events for future capabilities.
      throw new Error("Not implemented.");
    },

    async sendOutput() {
      // TODO: Route outbound communication through a selected provider.
      throw new Error("Not implemented.");
    }
  };

  return manager;
}

module.exports = {
  createCommunicationManager
};
