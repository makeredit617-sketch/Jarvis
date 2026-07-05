function createOrchestrator({ architectureDocs, auditLog, eventBus }) {
  return {
    async handleRequest(context, input) {
      context.setResult("input", input);

      auditLog.record({
        name: "RuntimeRequestReceived",
        type: "runtime.request.received",
        executionId: context.executionId,
        source: "orchestrator",
        payload: {
          source: input.source,
          hasRequest: Boolean(input.request)
        }
      });

      await eventBus.publish(context.createEvent("RuntimeRequestReceived", "orchestrator", {
        input
      }));

      const plan = context.getResult("plan");
      const securityDecision = context.getResult("securityDecision");

      if (securityDecision.status !== "APPROVED") {
        auditLog.record({
          name: "RuntimeRequestBlocked",
          type: "runtime.request.blocked",
          executionId: context.executionId,
          source: "orchestrator",
          payload: securityDecision
        });

        return {
          status: "BLOCKED",
          plan,
          securityDecision,
          missingArchitectureDocs: getMissingArchitectureDocs(architectureDocs)
        };
      }

      const executionResult = context.getResult("executionResult");
      const qaResult = context.getResult("qaResult");

      return {
        status: qaResult.status === "PASS" ? "READY" : "FAILED_QA",
        executionId: context.executionId,
        plan,
        securityDecision,
        executionResult,
        qaResult,
        missingArchitectureDocs: getMissingArchitectureDocs(architectureDocs)
      };
    }
  };
}

function getMissingArchitectureDocs(architectureDocs) {
  return architectureDocs
    .filter(document => !document.exists)
    .map(document => document.name);
}

module.exports = {
  createOrchestrator
};
