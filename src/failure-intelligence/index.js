"use strict";

const { detectPatterns } = require("../pattern-detector/detector");

function createFailureIntelligence(failureMemory) {
  return {

    listPatterns() {
      const failures = failureMemory.listFailures();

      return detectPatterns(failures);
    }

  };
}

module.exports = {
  createFailureIntelligence
};
