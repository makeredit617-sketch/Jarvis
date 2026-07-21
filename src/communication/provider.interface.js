"use strict";

const { randomUUID } = require("crypto");
const {
  CommunicationProviderStatus,
  CommunicationProviderType
} = require("./providers/provider.types");

const PROVIDER_SOURCE = "communication-provider";
const PROVIDER_EVENTS = Object.freeze({
  [CommunicationProviderStatus.INITIALIZING]: "communication.provider.initializing",
  [CommunicationProviderStatus.READY]: "communication.provider.ready",
  [CommunicationProviderStatus.ACTIVE]: "communication.provider.active",
  [CommunicationProviderStatus.STOPPED]: "communication.provider.stopped",
  [CommunicationProviderStatus.FAILED]: "communication.provider.failed"
});

/**
 * Creates the lifecycle contract shared by communication providers.
 *
 * The optional handlers provide extension points for future provider-specific
 * work without making this contract perform communication itself.
 */
function createCommunicationProviderInterface(options = {}) {
  const {
    id,
    type,
    eventBus,
    initializeHandler,
    startHandler,
    stopHandler
  } = options;

  if (!id) {
    throw new Error("Provider must define an id.");
  }

  if (!Object.values(CommunicationProviderType).includes(type)) {
    throw new Error(`Invalid provider type: ${type}`);
  }

  if (eventBus && typeof eventBus.publish !== "function") {
    throw new TypeError("Provider Event Bus must provide publish.");
  }

  let status = options.status === undefined
    ? CommunicationProviderStatus.DISCOVERED
    : options.status;
  let lifecycleOperation = Promise.resolve();

  if (!Object.values(CommunicationProviderStatus).includes(status)) {
    throw new Error(`Invalid provider status: ${status}`);
  }

  async function transitionTo(nextStatus) {
    const previousStatus = status;

    if (previousStatus === nextStatus) {
      return;
    }

    status = nextStatus;
    const eventName = PROVIDER_EVENTS[nextStatus];

    if (eventBus && eventName) {
      await eventBus.publish({
        name: eventName,
        executionId: randomUUID(),
        source: PROVIDER_SOURCE,
        payload: { providerId: id, previousStatus, currentStatus: nextStatus }
      });
    }
  }

  function enqueueLifecycle(operation) {
    const queuedOperation = lifecycleOperation.then(operation, operation);

    lifecycleOperation = queuedOperation.catch(() => {});
    return queuedOperation;
  }

  async function runHandler(handler) {
    if (typeof handler === "function") {
      await handler();
    }
  }

  const provider = {
    id,
    type,

    get status() {
      return status;
    },

    async initialize() {
      return enqueueLifecycle(async () => {
        if (status === CommunicationProviderStatus.READY ||
            status === CommunicationProviderStatus.ACTIVE) {
          return provider;
        }

        if (status !== CommunicationProviderStatus.DISCOVERED) {
          throw new Error(`Provider cannot initialize from status: ${status}`);
        }

        await transitionTo(CommunicationProviderStatus.INITIALIZING);
        try {
          await runHandler(initializeHandler);
          await transitionTo(CommunicationProviderStatus.READY);
        } catch (error) {
          await transitionTo(CommunicationProviderStatus.FAILED);
          throw error;
        }

        return provider;
      });
    },

    async start() {
      return enqueueLifecycle(async () => {
        if (status === CommunicationProviderStatus.ACTIVE) {
          return provider;
        }

        if (status === CommunicationProviderStatus.DISCOVERED) {
          await transitionTo(CommunicationProviderStatus.INITIALIZING);
          try {
            await runHandler(initializeHandler);
            await transitionTo(CommunicationProviderStatus.READY);
          } catch (error) {
            await transitionTo(CommunicationProviderStatus.FAILED);
            throw error;
          }
        }

        if (status !== CommunicationProviderStatus.READY) {
          throw new Error(`Provider cannot start from status: ${status}`);
        }

        try {
          await runHandler(startHandler);
          await transitionTo(CommunicationProviderStatus.ACTIVE);
        } catch (error) {
          await transitionTo(CommunicationProviderStatus.FAILED);
          throw error;
        }

        return provider;
      });
    },

    async stop() {
      return enqueueLifecycle(async () => {
        if (status === CommunicationProviderStatus.STOPPED) {
          return provider;
        }

        if (status !== CommunicationProviderStatus.READY &&
            status !== CommunicationProviderStatus.ACTIVE) {
          throw new Error(`Provider cannot stop from status: ${status}`);
        }

        try {
          await runHandler(stopHandler);
          await transitionTo(CommunicationProviderStatus.STOPPED);
        } catch (error) {
          await transitionTo(CommunicationProviderStatus.FAILED);
          throw error;
        }

        return provider;
      });
    }
  };

  return provider;
}

module.exports = {
  createCommunicationProviderInterface
};
