function createExecutorAgent() {
  return {
    name: "executor",
    register({ eventBus, serviceRegistry }) {
      return [
        eventBus.subscribe("EngineerProposedExecution", async event => {
          const executionResult = await this.execute(event.payload.executionIntent, {
            toolRegistry: serviceRegistry.get("toolRegistry")
          });
          event.context.setResult("executionResult", executionResult);
          await eventBus.publish(event.context.createEvent("ExecutorCompletedExecution", this.name, {
            plan: event.payload.plan,
            securityDecision: event.payload.securityDecision,
            executionIntent: event.payload.executionIntent,
            executionResult
          }));

          if (executionResult.status === "FAILED") {
            await eventBus.publish(event.context.createEvent("ExecutionFailed", this.name, {
              plan: event.payload.plan,
              executionIntent: event.payload.executionIntent,
              executionResult
            }));
          }
        })
      ];
    },
    async execute(intent, { toolRegistry }) {
      const errors = [...(intent.errors || [])];
      const changeResults = [];
      if (intent.changes && intent.changes.length > 0) {
        const writeFile = toolRegistry.get("writeFile");
        if (!writeFile) {
          errors.push("writeFile tool is not registered — no changes were made.");
        } else {
          for (const change of intent.changes) {
            const outcome = writeFile.execute({ file: change.file, content: change.content });
            changeResults.push(outcome);
            if (!outcome.success) {
              errors.push(`Failed to write ${change.file}: ${outcome.error}`);
            }
          }
        }
      }
      if (intent.commands && intent.commands.length > 0) {
        for (const command of intent.commands) {
          errors.push(`Command execution not implemented, skipped: ${command}`);
        }
      }
      const allWritesSucceeded = changeResults.every(result => result.success);
      const result = {
        status: allWritesSucceeded ? (intent.status || "SUCCESS") : "FAILED",
        planId: intent.planId,
        changes: changeResults,
        commands: [],
        errors
      };
      if (intent.reply !== undefined) {
        result.reply = intent.reply;
      }
      return result;
    }
  };
}
module.exports = {
  createExecutorAgent
};
