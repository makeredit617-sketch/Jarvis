"use strict";

const RETRYABLE_CATEGORIES = new Set([
  "NETWORK",
  "API",
  "RESOURCE",
  "RUNTIME"
]);

const NON_RETRYABLE_CATEGORIES = new Set([
  "PERMISSION",
  "CONFIGURATION",
  "DEPENDENCY",
  "COMPILATION",
  "MEMORY",
  "FILE_SYSTEM",
  "UNKNOWN"
]);

function isRetryable(category) {
  return RETRYABLE_CATEGORIES.has(category);
}

function determineTrend(occurrences) {
  if (occurrences.length <= 1) {
    return "first-occurrence";
  }

  const sorted = [...occurrences].sort();
  const recentCount = sorted.filter((ts) => {
    const ageMs = Date.now() - new Date(ts).getTime();
    return ageMs < 24 * 60 * 60 * 1000;
  }).length;

  if (recentCount >= 3) {
    return "escalating";
  }

  return "recurring";
}

function analyzeFailures(patterns, allFailures) {
  return patterns.map((pattern) => {
    const related = allFailures.filter((f) => f.fingerprint === pattern.fingerprint);
    const timestamps = related.map((f) => f.timestamp).filter(Boolean);
    const confidences = related.map((f) => f.confidence).filter((c) => typeof c === "number");

    const firstSeen = timestamps.length > 0 ? timestamps.reduce((a, b) => (a < b ? a : b)) : null;
    const averageConfidence = confidences.length > 0
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
      : null;

    return {
      ...pattern,
      retryable: isRetryable(pattern.category),
      trend: determineTrend(timestamps),
      firstSeen,
      averageConfidence
    };
  });
}

function createFailureAnalyzer() {
  return {
    analyzeFailures
  };
}

module.exports = {
  createFailureAnalyzer,
  analyzeFailures,
  isRetryable
};
