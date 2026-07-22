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

Decide the intent: "CONVERSATION" if the user just wants a reply
(greetings, questions, chat), or "TASK" if the user wants something
built, changed, or executed.

The JSON must have exactly these fields:
{
  "id": "plan-001",
  "request": "...",
  "intent": "CONVERSATION or TASK",
  "reply": "your direct conversational reply text if intent is CONVERSATION, otherwise empty string",
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
