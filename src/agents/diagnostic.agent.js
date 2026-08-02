const { collectEvidence } = require("../diagnostics/collector");
const { buildDiagnosticPrompt } = require("../diagnostics/prompts");
const { validateDiagnosticReport } = require("../diagnostics/validator");

function createDiagnosticAgent() {
  return {
    name: "diagnostic",

    register({ eventBus, serviceRegistry }) {
      this.ai = serviceRegistry.get("ai");
      this.failureMemory = serviceRegistry.get("failureMemory");

      return [
        eventBus.subscribe("ExecutionFailed", async event => {
          await this.handleExecutionFailure(event);
        })
      ];
    },

    async handleExecutionFailure(event) {
      const evidence = await collectEvidence({
        executionId: event.executionId,
        plan: event.payload.plan,
        executionIntent: event.payload.executionIntent,
        executionResult: event.payload.executionResult
      });

      const prompt = buildDiagnosticPrompt(evidence);
      const reply = await this.ai.generate(prompt);

      let report;
      try {
        report = JSON.parse(reply);
      } catch (error) {
        console.error("[Diagnostic] AI returned invalid JSON:", error.message);
        return;
      }

      const validation = validateDiagnosticReport(report);
      if (!validation.valid) {
        console.error("[Diagnostic] Report failed validation:", validation.errors);
        return;
      }

      if (this.failureMemory) {
        this.failureMemory.recordFailure(report);
      }

      console.log(`[Diagnostic] ${report.category}: ${report.rootCause} (confidence: ${report.confidence})`);
    }
  };
}

module.exports = {
  createDiagnosticAgent
};
