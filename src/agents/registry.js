const { createPlannerAgent } = require("./planner.agent");
const { createSecurityAgent } = require("./security.agent");
const { createEngineerAgent } = require("./engineer.agent");
const { createQaAgent } = require("./qa.agent");
const { createMemoryAgent } = require("./memory.agent");

function createAgentRegistry(context) {
  const agents = [
    createPlannerAgent(context),
    createSecurityAgent(context),
    createEngineerAgent(context),
    createQaAgent(context),
    createMemoryAgent(context)
  ];

  return {
    all: agents,
    planner: agents[0],
    security: agents[1],
    engineer: agents[2],
    qa: agents[3],
    memory: agents[4]
  };
}

module.exports = {
  createAgentRegistry
};
