function createMemoryAgent() {
  return {
    name: "memory",

    register({ eventBus, serviceRegistry }) {
      return [
        eventBus.subscribe("QAValidatedExecution", async event => {
          const memoryRecord = await this.remember({
            input: event.context.getResult("input"),
            plan: event.payload.plan,
            securityDecision: event.payload.securityDecision,
            executionResult: event.payload.executionResult,
            qaResult: event.payload.qaResult,
            memoryStore: serviceRegistry.get("memoryStore")
          });
          event.context.setResult("memoryRecord", memoryRecord);

          await eventBus.publish(event.context.createEvent("MemoryStoredExecution", this.name, {
            memoryRecord
          }));
        })
      ];
    },

    async remember(event) {
      // TODO: Separate episodic, semantic, working, and pin memory writes.
      return event.memoryStore.append({
        type: "episodic.placeholder",
        timestamp: new Date().toISOString(),
        content: {
          request: event.input.request,
          planId: event.plan.id,
          status: event.qaResult.status
        }
      });
    }
  };
}

module.exports = {
  createMemoryAgent
};
