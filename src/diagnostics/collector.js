async function collectEvidence(context = {}) {
    return {
        status: "FAILED",
        timestamp: new Date().toISOString(),

        executionId: context.executionId ?? null,
        planId: context.executionIntent?.planId ?? null,

        request: context.plan?.request ?? null,

        errors: context.executionResult?.errors ?? [],
        changes: context.executionResult?.changes ?? [],
        attemptedChanges: context.executionIntent?.changes ?? [],
        commands: context.executionIntent?.commands ?? [],

        platform: process.platform,
        nodeVersion: process.version,

        environment: {},
        logs: [],
        metadata: {}
    };
}

module.exports = {
    collectEvidence
};
