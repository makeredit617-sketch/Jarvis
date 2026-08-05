"use strict";

/**
 * Self Debugger
 *
 * Applies deterministic, hardcoded fix strategies to specific classes of
 * failure. The AI's diagnosis only ever selects WHICH strategy might apply
 * (via category matching) — it never decides WHAT the strategy does. This
 * module never executes AI-suggested free text as instructions.
 *
 * Tonight's scope: exactly one strategy — absolute-path correction for
 * rejected file writes. Retries go through the existing writeFile tool,
 * which has its own independent path-safety checks as a second layer.
 */

function extractAbsolutePathFixes(evidence) {
  const failedWrites = (evidence.changes || []).filter(
    (c) => !c.success && typeof c.error === "string" && c.error.includes("Absolute paths are not allowed")
  );

  return failedWrites
    .map((failedWrite) => {
      const original = (evidence.attemptedChanges || []).find((c) => c.file === failedWrite.file);
      if (!original) return null;

      const correctedFile = failedWrite.file.replace(/^\/+/, "");
      if (!correctedFile) return null;

      return { originalFile: failedWrite.file, correctedFile, content: original.content };
    })
    .filter(Boolean);
}

function createSelfDebugger(options = {}) {
  const { toolRegistry } = options;

  return {
    async attemptFix(report, evidence) {
      if (report.category !== "CONFIGURATION") {
        return { attempted: false, reason: `No fix strategy defined for category "${report.category}".` };
      }

      const fixes = extractAbsolutePathFixes(evidence);
      if (fixes.length === 0) {
        return { attempted: false, reason: "No absolute-path write failures found matching this strategy." };
      }

      const writeFile = toolRegistry ? toolRegistry.get("writeFile") : null;
      if (!writeFile) {
        return { attempted: false, reason: "writeFile tool is not registered." };
      }

      const results = fixes.map((fix) => {
        const outcome = writeFile.execute({ file: fix.correctedFile, content: fix.content });
        return { ...fix, outcome };
      });

      const succeeded = results.some((r) => r.outcome.success);

      return {
        attempted: true,
        strategy: "absolute-path-correction",
        results,
        succeeded
      };
    }
  };
}

module.exports = {
  createSelfDebugger
};
