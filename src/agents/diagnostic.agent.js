const { collectEvidence } = require("../diagnostics/collector");
const { buildDiagnosticPrompt } = require("../diagnostics/prompts");
const { validateDiagnosticReport } = require("../diagnostics/validator");

function createDiagnosticAgent() {
  return {
    name: "diagnostic",

    register({ eventBus, serviceRegistry }) {
      this.ai = serviceRegistry.get("ai");
      this.toolRegistry = serviceRegistry.get("toolRegistry");
      this.runtime = serviceRegistry.get("runtime");

      return [
      eventBus.subscribe("ExecutionFailed", async event => {
        await this.handleExecutionFailure(event);
      })
    ];
    },

    async handleExecutionFailure(event) {
      const evidence = await collectEvidence(event.payload);

      console.log("[Diagnostic] Evidence collected.");
      console.log(evidence);

      const prompt = buildDiagnosticPrompt(evidence);

      const reply = await this.ai.generate(prompt);

      console.log("\n===== DIAGNOSTIC RAW REPLY =====");
      console.log(reply);
      console.log("================================\n");

      const report = JSON.parse(reply);

      console.log("\n===== PARSED DIAGNOSTIC REPORT =====");
      console.log(report);
      console.log("====================================\n");
    }
  };
}

module.exports = {
  createDiagnosticAgent
};
