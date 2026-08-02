"use strict";

const { createFailureFingerprint } = require("./fingerprint");

function createFailureMemory(memoryStore) {
  return {
    recordFailure(report) {
      const record = {
        id: `failure-${Date.now()}`,
        timestamp: new Date().toISOString(),

        executionId: report.executionId,

        category: report.category,

        rootCause: report.rootCause,

        confidence: report.confidence,

        fingerprint: createFailureFingerprint(report),

        evidence: report.evidence,

        possibleFixes: report.possibleFixes,

        recommendedFix: report.recommendedFix,

        resolved: false,

        resolution: null
      };

      memoryStore.append(record);

      return record;
    },

    listFailures() {
      return memoryStore.readAll().filter(
        record => record.id && record.id.startsWith("failure-")
      );
    },

    markResolved(id, resolution) {
      const updated = memoryStore.update(
        record => record.id === id,
        record => {
          record.resolved = true;
          record.resolution = resolution;
        }
      );

      return updated;
    }
  };
}

module.exports = {
  createFailureMemory
};
