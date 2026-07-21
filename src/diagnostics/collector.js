async function collectEvidence(context = {}) {
    return {
        status: "SUCCESS",
        timestamp: new Date().toISOString(),

        command: {
        stdout: context.stdout ?? "",
        stderr: context.stderr ?? "",
        exitCode: context.exitCode ?? null
    },

        workingDirectory: context.workingDirectory ?? process.cwd(),

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
