const { loadArchitectureDocs } = require("../core/architecture-docs");
const { createOrchestrator } = require("../core/orchestrator");
const { createAgentRegistry } = require("../agents/registry");
const { createMemoryStore } = require("../memory/store");
const { createAuditLog } = require("../audit/audit-log");
const { createToolRegistry } = require("../tools/tool-registry");
const { createEventBus } = require("../events/event-bus");
const { createRuntime } = require("./runtime");
const { createServiceRegistry } = require("./service-registry");

function bootJarvisRuntime(options = {}) {
  const architectureDocs = loadArchitectureDocs();
  const auditLog = createAuditLog(options.audit);
  const eventBus = createEventBus(options.events);
  const memoryStore = createMemoryStore(options.memory);
  const serviceRegistry = createServiceRegistry();
  const toolRegistry = createToolRegistry(options.tools);
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
