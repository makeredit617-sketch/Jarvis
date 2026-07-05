const fs = require("fs");
const path = require("path");
const { paths } = require("../config/paths");

const REQUIRED_ARCHITECTURE_DOCS = [
  path.join(paths.docsDir, "constitution.md"),
  path.join(paths.coreDir, "orchestrator.core.md"),
  path.join(paths.coreDir, "codex.master.prompt.md"),
  path.join(paths.agentsDir, "planner.agent.md"),
  path.join(paths.agentsDir, "security.agent.md"),
  path.join(paths.agentsDir, "engineer.agent.md"),
  path.join(paths.agentsDir, "qa.agent.md"),
  path.join(paths.agentsDir, "memory.agent.md")
];

function loadArchitectureDocs() {
  return REQUIRED_ARCHITECTURE_DOCS.map(filePath => ({
    name: path.relative(paths.root, filePath),
    exists: fs.existsSync(filePath),
    content: fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null
  }));
}

module.exports = {
  REQUIRED_ARCHITECTURE_DOCS,
  loadArchitectureDocs
};
