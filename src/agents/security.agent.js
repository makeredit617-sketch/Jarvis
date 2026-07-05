function createSecurityAgent() {
  return {
    name: "security",

    register({ eventBus }) {
      return [
        eventBus.subscribe("PlannerCreatedPlan", async event => {
          const securityDecision = await this.reviewPlan(event.payload.plan);
          event.context.setResult("securityDecision", securityDecision);

          const nextEvent = securityDecision.status === "APPROVED"
            ? "SecurityApprovedPlan"
            : "SecurityBlockedPlan";

          await eventBus.publish(event.context.createEvent(nextEvent, this.name, {
            plan: event.payload.plan,
            securityDecision
          }));
        })
      ];
    },

    async reviewPlan(plan) {
      // TODO: Implement policy-driven risk evaluation and permission checks.
      return {
        status: "APPROVED",
        reason: "Placeholder security review. No executable steps were provided.",
        riskLevel: plan.riskLevel,
        affectedSystems: []
      };
    }
  };
}

module.exports = {
  createSecurityAgent
};
