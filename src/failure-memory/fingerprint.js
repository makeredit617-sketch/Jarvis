"use strict";

const crypto = require("crypto");

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function createFailureFingerprint(report) {
  const source = [
    normalize(report.category),
    normalize(report.rootCause)
  ].join("::");

  return crypto
    .createHash("sha256")
    .update(source)
    .digest("hex");
}

module.exports = {
  createFailureFingerprint
};
