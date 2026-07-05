function createQaAgent() {
  return {
    name: "qa",

    register({ eventBus }) {
      return [
        eventBus.subscribe("EngineerExecutedPlan", async event => {
          const qaResult = await this.validate({
            plan: event.payload.plan,
            executionResult: event.payload.executionResult,
            securityDecision: event.payload.securityDecision
          });
          event.context.setResult("qaResult", qaResult);

          await eventBus.publish(event.context.createEvent("QAValidatedExecution", this.name, {
            plan: event.payload.plan,
            securityDecision: event.payload.securityDecision,
            executionResult: event.payload.executionResult,
            qaResult
          }));
        })
      ];
    },

    async validate({ plan, executionResult, securityDecision }) {
      // TODO: Add validation rules, test execution hooks, and regression checks.
      return {
        status: "PASS",
        planId: plan.id,
        executionStatus: executionResult.status,
        securityStatus: securityDecision.status,
        issues: []
      };
    }
  };
}

module.exports = {
  createQaAgent
};
