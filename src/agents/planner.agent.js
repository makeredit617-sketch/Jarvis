function createPlannerAgent() {
  return {
    name: "planner",

    register({ eventBus, serviceRegistry }) {
      this.ai = serviceRegistry.get("ai");
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
      const prompt = `You are the JARVIS Planner Agent.

Return ONLY valid JSON.

The JSON must have exactly these fields:
{
  "id": "plan-001",
  "request": "...",
  "steps": ["..."],
  "dependencies": [],
  "riskLevel": "LOW"
}

User Request:
${input.request}`;

      const reply = await this.ai.generate(prompt);

      try {
        return JSON.parse(reply);
      } catch (error) {
        return {
          id: "plan.fallback",
          request: input.request,
          steps: [
            "Planner returned invalid JSON"
          ],
          dependencies: [],
          riskLevel: "UNKNOWN"
        };
      }
    }
  };
}

module.exports = {
  createPlannerAgent
};
