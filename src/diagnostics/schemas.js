const diagnosticSchema = Object.freeze({
  required: [
    "status",
    "executionId",
    "rootCause",
    "confidence",
    "category",
    "evidence",
    "possibleFixes",
    "recommendedFix"
  ],

  allowedStatus: [
    "SUCCESS",
    "FAILED"
  ]
});

module.exports = {
  diagnosticSchema
};
