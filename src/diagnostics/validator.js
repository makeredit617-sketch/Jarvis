const { diagnosticSchema } = require("./schemas");
const { isValidCategory } = require("./categories");

function validateDiagnosticReport(report) {
    const errors = [];

    // Must be an object
    if (!report || typeof report !== "object") {
        return {
            valid: false,
            errors: ["Diagnostic report must be an object."],
            warnings: []
        };
    }

    // Required fields
    for (const field of diagnosticSchema.required) {
        if (!(field in report)) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    // Stop early if required fields are missing
    if (errors.length > 0) {
        return {
            valid: false,
            errors,
            warnings: []
        };
    }

    // Status
    if (!diagnosticSchema.allowedStatus.includes(report.status)) {
        errors.push(`Invalid status: ${report.status}`);
    }

    // Confidence
    if (
        typeof report.confidence !== "number" ||
        report.confidence < 0 ||
        report.confidence > 1
    ) {
        errors.push("Confidence must be a number between 0 and 1.");
    }

    // Category
    if (!isValidCategory(report.category)) {
        errors.push(`Invalid category: ${report.category}`);
    }

    // Arrays
    if (!Array.isArray(report.evidence)) {
        errors.push("Evidence must be an array.");
    }

    if (!Array.isArray(report.possibleFixes)) {
        errors.push("Possible fixes must be an array.");
    }

    // Recommended Fix
    if (
        typeof report.recommendedFix !== "object" ||
        report.recommendedFix === null
    ) {
        errors.push("Recommended fix must be an object.");
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings: []
    };
}

module.exports = {
    validateDiagnosticReport
};
