function createEngineerAgent() {
  return {
    name: "engineer",

    register({ eventBus, serviceRegistry }) {
      this.ai = serviceRegistry.get("ai");
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
      const prompt = `You are the JARVIS Engineer Agent.

Generate ONLY valid JSON.

The JSON must have exactly this structure:

{
  "status": "SUCCESS",
  "planId": "${plan.id}",
  "changes": [
    {
      "file": "example.py",
      "content": "..."
    }
  ],
  "commands": [],
  "errors": []
}

Generate code that implements this plan:

${JSON.stringify(plan, null, 2)}`;

      const reply = await this.ai.generate(prompt);
      console.log("\n===== ENGINEER RAW REPLY =====");
      console.log(reply);
      console.log("==============================\n");

      try {
        return JSON.parse(reply);
      } catch (error) {
        return {
          status: "FAILED",
          planId: plan.id,
          changes: [],
          commands: [],
          errors: [
            "Engineer returned invalid JSON"
          ]
        };
      }
    }
  };
}

module.exports = {
  createEngineerAgent
};
