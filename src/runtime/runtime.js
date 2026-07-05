"use strict";

const { createExecutionContext } = require("./execution-context");

/**
 * Runtime lifecycle wrapper.
 *
 * Startup registers services and module event handlers. Shutdown removes
 * subscriptions and clears registry state without reaching into module internals.
 */
function createRuntime(options) {
  const {
    architectureDocs,
    auditLog,
    eventBus,
    memoryStore,
    modules,
    orchestrator,
    serviceRegistry,
    toolRegistry
  } = options;

  let started = false;
  let subscriptions = [];

  return {
    get isStarted() {
      return started;
    },

    get services() {
      return serviceRegistry;
    },

    async start() {
      if (started) {
        return this;
      }

      registerCoreServices({
        architectureDocs,
        auditLog,
        eventBus,
        memoryStore,
        serviceRegistry,
        toolRegistry
      });

      for (const module of modules) {
        serviceRegistry.register(module.name, module);

        if (typeof module.register === "function") {
          const moduleSubscriptions = module.register({
            eventBus,
            serviceRegistry
          }) || [];
          subscriptions.push(...moduleSubscriptions);
        }
      }

      started = true;
      return this;
    },

    async shutdown() {
      for (const unsubscribe of subscriptions.splice(0)) {
        unsubscribe();
      }

      serviceRegistry.clear();
      started = false;
    },

    async handleRequest(input) {
      if (!started) {
        await this.start();
      }

      const context = createExecutionContext({
        request: input.request,
        source: input.source || "unknown"
      });

      return orchestrator.handleRequest(context, input);
    }
  };
}

function registerCoreServices({
  architectureDocs,
  auditLog,
  eventBus,
  memoryStore,
  serviceRegistry,
  toolRegistry
}) {
  serviceRegistry.register("architectureDocs", architectureDocs);
  serviceRegistry.register("auditLog", auditLog);
  serviceRegistry.register("eventBus", eventBus);
  serviceRegistry.register("memoryStore", memoryStore);
  serviceRegistry.register("toolRegistry", toolRegistry);
}

module.exports = {
  createRuntime
};
