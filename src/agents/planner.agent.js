function createPlannerAgent() {
  return {
    name: "planner",

    register({ eventBus }) {
      return [
        eventBus.subscribe("RuntimeRequestReceived", async event => {
          const plan = await this.createPlan(event.payload.input);
          event.context.setResult("plan", plan);

          await eventBus.publish(event.context.createEvent("PlannerCreatedPlan", this.name, {
            plan
          }));
        })
      ];
    },

    async createPlan(input) {
      // TODO: Replace this placeholder with Planner Agent reasoning.
      return {
        id: "plan.placeholder",
        request: input.request,
        steps: [],
        dependencies: [],
        riskLevel: "UNKNOWN"
      };
    }
  };
}

module.exports = {
  createPlannerAgent
};
