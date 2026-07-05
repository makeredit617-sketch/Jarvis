function createToolRegistry() {
  const tools = new Map();

  return {
    register(name, adapter) {
      // TODO: Validate tool permissions and schemas before registration.
      tools.set(name, adapter);
    },

    get(name) {
      return tools.get(name);
    },

    list() {
      return Array.from(tools.keys());
    }
  };
}

module.exports = {
  createToolRegistry
};
