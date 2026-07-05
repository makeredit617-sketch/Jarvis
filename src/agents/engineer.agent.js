function createEngineerAgent() {
  return {
    name: "engineer",

    register({ eventBus, serviceRegistry }) {
      return [
        eventBus.subscribe("SecurityApprovedPlan", async event => {
          const executionResult = await this.executePlan(event.payload.plan, {
            toolRegistry: serviceRegistry.get("toolRegistry")
          });
          event.context.setResult("executionResult", executionResult);

          await eventBus.publish(event.context.createEvent("EngineerExecutedPlan", this.name, {
            plan: event.payload.plan,
            securityDecision: event.payload.securityDecision,
            executionResult
          }));
        })
      ];
    },

    async executePlan(plan) {
      // TODO: Route approved implementation steps through controlled tool adapters.
      return {
        status: "NOT_IMPLEMENTED",
        planId: plan.id,
        changes: [],
        commands: [],
        errors: []
      };
    }
  };
}

module.exports = {
  createEngineerAgent
};
