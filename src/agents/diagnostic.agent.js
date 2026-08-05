const { collectEvidence } = require("../diagnostics/collector");
const { buildDiagnosticPrompt } = require("../diagnostics/prompts");
const { validateDiagnosticReport } = require("../diagnostics/validator");
const { createFailureFingerprint } = require("../failure-memory/fingerprint");
const { createRetryEngine } = require("../retry-engine");
const { createSelfDebugger } = require("../self-debugger");

function createDiagnosticAgent() {
  const retryEngine = createRetryEngine();
  const attemptsByFingerprint = new Map();
  let selfDebugger = null;

  return {
    name: "diagnostic",

    register({ eventBus, serviceRegistry }) {
      this.ai = serviceRegistry.get("ai");
      this.failureMemory = serviceRegistry.get("failureMemory");
      this.runtime = serviceRegistry.get("runtime");
      selfDebugger = createSelfDebugger({ toolRegistry: serviceRegistry.get("toolRegistry") });

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

      const fixResult = await selfDebugger.attemptFix(report, evidence);
      if (fixResult.attempted) {
        console.log(`[Self-Debugger] Strategy "${fixResult.strategy}": ${fixResult.succeeded ? "SUCCEEDED" : "FAILED"}`);
        if (fixResult.succeeded) {
          return;
        }
      } else {
        console.log(`[Self-Debugger] Not attempted: ${fixResult.reason}`);
      }

      await this.maybeRetry(report, evidence);
    },

    async maybeRetry(report, evidence) {
      if (!this.runtime || !evidence.request) {
        return;
      }

      const fingerprint = createFailureFingerprint(report);
      const attemptNumber = attemptsByFingerprint.get(fingerprint) || 0;

      const decision = retryEngine.decideRetry({
        category: report.category,
        attemptNumber
      });

      if (!decision.shouldRetry) {
        console.log(`[Retry] Not retrying: ${decision.reason}`);
        return;
      }

      attemptsByFingerprint.set(fingerprint, attemptNumber + 1);
      console.log(`[Retry] ${decision.reason} Waiting ${decision.delayMs}ms before retry.`);

      await new Promise(resolve => setTimeout(resolve, decision.delayMs));

      console.log(`[Retry] Re-attempting request: "${evidence.request}"`);
      const retryResult = await this.runtime.handleRequest({
        request: evidence.request,
        source: "retry-engine"
      });

      const succeeded = retryResult.executionResult?.status === "SUCCESS";
      console.log(`[Retry] Outcome: ${succeeded ? "SUCCEEDED" : "FAILED"}`);

      if (this.failureMemory) {
        this.failureMemory.recordRetryOutcome(fingerprint, {
          succeeded,
          attemptNumber: attemptNumber + 1
        });
      }
    }
  };
}

module.exports = {
  createDiagnosticAgent
};
