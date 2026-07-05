const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../..");

const paths = {
  root: PROJECT_ROOT,
  agentsDir: path.join(PROJECT_ROOT, "agents"),
  coreDir: path.join(PROJECT_ROOT, "core"),
  docsDir: path.join(PROJECT_ROOT, "docs"),
  runtimeDir: path.join(PROJECT_ROOT, "runtime"),
  memoryFile: path.join(PROJECT_ROOT, "runtime", "memory.log.json")
};

module.exports = {
  paths
};
