"use strict";

function detectPatterns(failures = []) {
  const groups = new Map();

  for (const failure of failures) {
    const key = failure.fingerprint || "unknown";

    if (!groups.has(key)) {
      groups.set(key, {
        fingerprint: key,
        count: 0,
        category: failure.category,
        rootCause: failure.rootCause,
        latestOccurrence: failure.timestamp
      });
    }

    const entry = groups.get(key);

    entry.count++;

    if (failure.timestamp > entry.latestOccurrence) {
      entry.latestOccurrence = failure.timestamp;
    }
  }

  return [...groups.values()]
    .sort((a, b) => b.count - a.count);
}

module.exports = {
  detectPatterns
};
