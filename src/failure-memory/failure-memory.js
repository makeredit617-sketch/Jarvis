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
    },

    recordRetryOutcome(fingerprint, { succeeded, attemptNumber }) {
      const record = {
        id: `retry-outcome-${Date.now()}`,
        timestamp: new Date().toISOString(),
        fingerprint,
        succeeded,
        attemptNumber
      };

      memoryStore.append(record);

      return record;
    },

    listRetryOutcomes(fingerprint) {
      return memoryStore.readAll().filter(
        record => record.id && record.id.startsWith("retry-outcome-") && record.fingerprint === fingerprint
      );
    }
  };
}

module.exports = {
  createFailureMemory
};
