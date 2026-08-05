"use strict";

function getSuccessRate(failureMemory, fingerprint) {
  const outcomes = failureMemory.listRetryOutcomes(fingerprint);

  if (outcomes.length === 0) {
    return { attempts: 0, successes: 0, successRate: null };
  }

  const successes = outcomes.filter((o) => o.succeeded).length;

  return {
    attempts: outcomes.length,
    successes,
    successRate: successes / outcomes.length
  };
}

function createStrategyLearning(failureMemory) {
  return {
    getSuccessRate: (fingerprint) => getSuccessRate(failureMemory, fingerprint)
  };
}

module.exports = {
  createStrategyLearning,
  getSuccessRate
};
