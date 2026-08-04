"use strict";

const { isRetryable } = require("./failure-analyzer");

const DEFAULT_MAX_ATTEMPTS = 2;
const BASE_DELAY_MS = 1000;

function decideRetry({ category, attemptNumber, maxAttempts = DEFAULT_MAX_ATTEMPTS }) {
  if (!isRetryable(category)) {
    return { shouldRetry: false, delayMs: 0, reason: `Category "${category}" is not retryable.` };
  }

  if (attemptNumber >= maxAttempts) {
    return { shouldRetry: false, delayMs: 0, reason: `Max retry attempts (${maxAttempts}) reached.` };
  }

  const delayMs = BASE_DELAY_MS * Math.pow(2, attemptNumber);
  return { shouldRetry: true, delayMs, reason: `Retryable, attempt ${attemptNumber + 1} of ${maxAttempts}.` };
}

function createRetryEngine(options = {}) {
  const maxAttempts = options.maxAttempts || DEFAULT_MAX_ATTEMPTS;
  return {
    decideRetry: (params) => decideRetry({ ...params, maxAttempts })
  };
}

module.exports = {
  createRetryEngine,
  decideRetry
};
