const { loadArchitectureDocs } = require("../core/architecture-docs");
const { createOrchestrator } = require("../core/orchestrator");
const { createAgentRegistry } = require("../agents/registry");
const { createMemoryStore } = require("../memory/store");
const { createAuditLog } = require("../audit/audit-log");
const { createToolRegistry } = require("../tools/tool-registry");
const { createEventBus } = require("../events/event-bus");
const { createRuntime } = require("./runtime");
const { createServiceRegistry } = require("./service-registry");
const { createEmergencyControl } = require("./emergency-control");
const { NvidiaClient } = require("../ai/client/nvidia.client");
const { createCapabilityManager } = require("../capabilities/capability-manager");
const { createCapabilityRegistry } = require("../capabilities/capability-registry");

function bootJarvisRuntime(options = {}) {
  const architectureDocs = loadArchitectureDocs();
  const auditLog = createAuditLog(options.audit);
  const eventBus = createEventBus(options.events);
  const memoryStore = createMemoryStore(options.memory);
  const serviceRegistry = createServiceRegistry();

  const emergencyControl = createEmergencyControl();
  serviceRegistry.register("emergencyControl", emergencyControl);
  serviceRegistry.register("ai", new NvidiaClient());
  const toolRegistry = createToolRegistry(options.tools);

  const capabilityRegistry = createCapabilityRegistry();
  serviceRegistry.register("capabilityRegistry", capabilityRegistry);

  const capabilityManager = createCapabilityManager({
    registry: capabilityRegistry
  });
  serviceRegistry.register("capabilityManager", capabilityManager);

  const agents = createAgentRegistry({ architectureDocs });
  const orchestrator = createOrchestrator({
    architectureDocs,
    auditLog,
    eventBus
  });

  return createRuntime({
    architectureDocs,
    auditLog,
    eventBus,
    memoryStore,
    modules: agents.all,
    orchestrator,
    serviceRegistry,
    toolRegistry
  });
}

module.exports = {
  bootJarvisRuntime
};
