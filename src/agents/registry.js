const { createPlannerAgent } = require("./planner.agent");
const { createSecurityAgent } = require("./security.agent");
const { createEngineerAgent } = require("./engineer.agent");
const { createExecutorAgent } = require("./executor.agent");
const { createQaAgent } = require("./qa.agent");
const { createMemoryAgent } = require("./memory.agent");

function createAgentRegistry(context) {
  const agents = [
    createPlannerAgent(context),
    createSecurityAgent(context),
    createEngineerAgent(context),
    createExecutorAgent(context),
    createQaAgent(context),
    createMemoryAgent(context)
  ];

  return {
    all: agents,
    planner: agents[0],
    security: agents[1],
    engineer: agents[2],
    executor: agents[3],
    qa: agents[4],
    memory: agents[5]
  };
}

module.exports = {
  createAgentRegistry
};
