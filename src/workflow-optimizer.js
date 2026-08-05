"use strict";

const RECOMMENDATION_THRESHOLDS = {
  minAttemptsForConfidence: 3,
  lowSuccessRateThreshold: 0.3,
  highOccurrenceThreshold: 3
};

function buildRecommendation(analyzedPattern, strategyStats) {
  const { fingerprint, category, rootCause, count, trend, retryable, recommendedFix } = analyzedPattern;
  const { attempts, successRate } = strategyStats;

  if (!retryable) {
    return {
      fingerprint,
      category,
      rootCause,
      action: "MANUAL_REVIEW",
      reason: `Category "${category}" is not auto-retryable. Occurred ${count} time(s).`,
      recommendedFix: recommendedFix || null
    };
  }

  if (attempts >= RECOMMENDATION_THRESHOLDS.minAttemptsForConfidence &&
      successRate !== null &&
      successRate < RECOMMENDATION_THRESHOLDS.lowSuccessRateThreshold) {
    return {
      fingerprint,
      category,
      rootCause,
      action: "STOP_AUTO_RETRY",
      reason: `Retries have historically succeeded only ${Math.round(successRate * 100)}% of the time across ${attempts} attempt(s). Auto-retry is not helping — recommend manual investigation instead.`,
      recommendedFix: recommendedFix || null
    };
  }

  if (trend === "escalating" && count >= RECOMMENDATION_THRESHOLDS.highOccurrenceThreshold) {
    return {
      fingerprint,
      category,
      rootCause,
      action: "PRIORITIZE_FIX",
      reason: `This failure is escalating (${count} occurrences, trending up). Even though it's retryable, the underlying cause should be fixed rather than repeatedly worked around.`,
      recommendedFix: recommendedFix || null
    };
  }

  return {
    fingerprint,
    category,
    rootCause,
    action: "CONTINUE_AUTO_RETRY",
    reason: attempts > 0
      ? `Retries have succeeded ${Math.round((successRate || 0) * 100)}% of the time. Current behavior is working.`
      : `No retry history yet. Retryable category, no signal to change behavior.`,
    recommendedFix: null
  };
}

function optimizeWorkflow(failureIntelligence, strategyLearning) {
  const analyzedPatterns = failureIntelligence.analyzePatterns();

  return analyzedPatterns.map((pattern) => {
    const strategyStats = strategyLearning.getSuccessRate(pattern.fingerprint);
    return buildRecommendation(pattern, strategyStats);
  });
}

function createWorkflowOptimizer(options = {}) {
  const { failureIntelligence, strategyLearning } = options;
  return {
    optimize: () => optimizeWorkflow(failureIntelligence, strategyLearning)
  };
}

module.exports = {
  createWorkflowOptimizer,
  optimizeWorkflow
};
