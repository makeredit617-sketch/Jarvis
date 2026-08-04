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
const { createWriteFileTool } = require("../tools/adapters/write-file.tool");
const { paths: appPaths } = require("../config/paths");
const { createSystemIntelligence } = require("../system-intelligence");
const { createFailureMemory } = require("../failure-memory/failure-memory");
const { createFailureIntelligence } = require("../failure-intelligence");

function bootJarvisRuntime(options = {}) {
  const architectureDocs = loadArchitectureDocs();
  const auditLog = createAuditLog(options.audit);
  const eventBus = createEventBus(options.events);
  const memoryStore = createMemoryStore(options.memory);
  const serviceRegistry = createServiceRegistry();


  const failureMemory = createFailureMemory(memoryStore);
  serviceRegistry.register("failureMemory", failureMemory);

  const failureIntelligence = createFailureIntelligence(failureMemory);
  serviceRegistry.register("failureIntelligence", failureIntelligence);

  const emergencyControl = createEmergencyControl();
  serviceRegistry.register("emergencyControl", emergencyControl);
  serviceRegistry.register("ai", new NvidiaClient());
  const toolRegistry = createToolRegistry(options.tools);
  toolRegistry.register("writeFile", createWriteFileTool({ workspaceDir: appPaths.workspaceDir }));

  const capabilityRegistry = createCapabilityRegistry();
  serviceRegistry.register("capabilityRegistry", capabilityRegistry);

  const capabilityManager = createCapabilityManager({
    registry: capabilityRegistry
  });
  serviceRegistry.register("capabilityManager", capabilityManager);

  const systemIntelligence = createSystemIntelligence();
  serviceRegistry.register("systemIntelligence", systemIntelligence);

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
