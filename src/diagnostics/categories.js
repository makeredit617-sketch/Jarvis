const DiagnosticCategories = Object.freeze({
  DEPENDENCY: "DEPENDENCY",
  CONFIGURATION: "CONFIGURATION",
  FILE_SYSTEM: "FILE_SYSTEM",
  PERMISSION: "PERMISSION",
  NETWORK: "NETWORK",
  API: "API",
  COMPILATION: "COMPILATION",
  RUNTIME: "RUNTIME",
  MEMORY: "MEMORY",
  RESOURCE: "RESOURCE",
  UNKNOWN: "UNKNOWN"
});

function isValidCategory(category) {
  return Object.values(DiagnosticCategories).includes(category);
}

module.exports = {
  DiagnosticCategories,
  isValidCategory
};
