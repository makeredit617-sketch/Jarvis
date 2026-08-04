"use strict";

const { detectPatterns } = require("../pattern-detector/detector");
const { analyzeFailures } = require("../failure-analyzer");

function createFailureIntelligence(failureMemory) {
  return {

    listPatterns() {
      const failures = failureMemory.listFailures();

      return detectPatterns(failures);
    },

    analyzePatterns() {
      const failures = failureMemory.listFailures();
      const patterns = detectPatterns(failures);

      return analyzeFailures(patterns, failures);
    }

  };
}

module.exports = {
  createFailureIntelligence
};
